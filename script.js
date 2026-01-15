const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";
let history = JSON.parse(localStorage.getItem("memory")) || [];
let currentMood = "neutral";
let isTalking = false;

// 3D Variables
let scene, camera, renderer, vrm, clock = new THREE.Clock();
let bones = {};

// Mobile Logger
function log(msg) { 
    const debug = document.getElementById("debug-log");
    if(debug) debug.innerText = "Log: " + msg; 
    console.log(msg);
}

async function init() {
    log("Initializing 3D Scene...");
    const canvas = document.getElementById("vrm-canvas");
    
    // 1. SCENE SETUP
    scene = new THREE.Scene();

    // 2. CAMERA SETUP (Adjusted for Mobile Portrait)
    // Field of View: 30 (Zoomed in slightly), Aspect, Near: 0.1, Far: 20.0
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 20);
    camera.position.set(0, 1.4, 3.0); // Moved BACK to ensure she fits

    // 3. RENDERER SETUP
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // 4. LIGHTING (Make sure it's bright enough)
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(1, 1, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // 5. DEBUG CUBE (The "Red Cube Test")
    // If you see this red box, Three.js is WORKING, but your VRM file is missing.
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // RED
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 1.3, 0); // Position where her head should be
    scene.add(cube);
    log("Scene Created. Red Cube added.");

    // 6. LOAD WAIFU
    log("Attempting to load ./oni.vrm");
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        "./oni.vrm", // MAKE SURE THIS MATCHES YOUR FILE NAME EXACTLY
        (gltf) => {
            log("VRM File Found! Parsing...");
            THREE.VRM.from(gltf).then((v) => {
                // Remove debug cube if she loads
                scene.remove(cube);
                
                vrm = v;
                scene.add(vrm.scene);
                vrm.scene.rotation.y = Math.PI; // Face forward

                // Bone Mapping
                bones.head = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Head);
                bones.spine = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Spine);
                bones.lArm = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.LeftUpperArm);
                bones.rArm = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.RightUpperArm);
                
                // Fix T-Pose
                if(bones.lArm) bones.lArm.rotation.z = 1.2;
                if(bones.rArm) bones.rArm.rotation.z = -1.2;

                log("✅ Waifu Rendered!");
                setTimeout(() => document.getElementById("debug-log").classList.add("hidden"), 3000);
            });
        },
        (progress) => {
            log(`Loading Model: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        },
        (error) => {
            log("❌ ERROR: Could not find 'oni.vrm'. Check file name!");
            console.error(error);
        }
    );

    // Handle Window Resize
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();

    if (vrm) {
        vrm.update(delta);

        // Wind Physics
        const wind = Math.sin(t * 0.5) * 0.02;
        vrm.springBoneManager.springBodies.forEach(s => s.externalForce.set(wind, 0, 0));

        // Lip Sync
        if (isTalking) {
            vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.A, Math.abs(Math.sin(t * 12)) * 0.7);
        } else {
            vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.A, 0);
        }

        // Expressions
        vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.Joy, currentMood === "lewd" ? 1 : 0);
        vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.Blink, Math.sin(t * 3) > 0.98 ? 1 : 0);
    }
    renderer.render(scene, camera);
}

// --- CHAT LOGIC ---
async function handleChat() {
    const input = document.getElementById("msg");
    const text = input.value.trim();
    if (!text) return;

    appendChat("user", text);
    input.value = "";
    history.push({ role: "user", content: text });

    try {
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history, mode: document.getElementById("pers-select").value })
        });
        const data = await res.json();

        currentMood = data.mood || "neutral";
        if(currentMood === "lewd") triggerBlush();

        appendChat("waifu", data.reply);
        speak(data.reply);
        history.push({ role: "assistant", content: data.reply });
        localStorage.setItem("memory", JSON.stringify(history.slice(-20)));
    } catch (e) { log("API Error"); }
}

function speak(text) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = 1.4; 
    u.onstart = () => isTalking = true;
    u.onend = () => isTalking = false;
    window.speechSynthesis.speak(u);
}

function appendChat(role, text) {
    const c = document.getElementById("chat-container");
    const p = document.createElement("p");
    p.className = role;
    p.innerHTML = `<b>${role === 'user' ? 'You' : 'Waifu'}:</b> ${text}`;
    c.appendChild(p);
    c.scrollTop = c.scrollHeight;
}

function triggerBlush() {
    document.getElementById("blush-overlay").classList.add("lewd-glow");
    setTimeout(() => document.getElementById("blush-overlay").classList.remove("lewd-glow"), 4000);
}

function toggleSettings() { document.getElementById("settings-menu").classList.toggle("hidden"); }
function clearMemory() { localStorage.clear(); location.reload(); }

window.addEventListener("touchstart", () => { if(vrm) triggerBlush(); });
document.getElementById("send-btn").onclick = handleChat;
init();
