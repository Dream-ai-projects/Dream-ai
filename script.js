const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat"; 
let history = JSON.parse(localStorage.getItem("memory")) || [];
let affection = parseInt(localStorage.getItem("affection")) || 50;
let currentMood = "neutral";
let isTalking = false;

let vrm, scene, camera, renderer, clock = new THREE.Clock();
let bones = {};
const mouse = new THREE.Vector2();

async function init() {
    console.log("🚀 Initializing 3D Engine...");
    const canvas = document.getElementById("vrm-canvas");
    
    scene = new THREE.Scene();

    // Full Body Camera Setup
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 3.0); // Moved back for full body

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(1, 1, 1);
    scene.add(light, new THREE.AmbientLight(0xffffff, 0.7));

    console.log("📦 Loading VRM: oni.vrm");
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        "./oni.vrm", // Ensure the file is named EXACTLY this in your GitHub repo
        (gltf) => {
            THREE.VRM.from(gltf).then((v) => {
                vrm = v;
                scene.add(vrm.scene);
                vrm.scene.rotation.y = Math.PI; // Face the camera
                
                console.log("✅ VRM Loaded Successfully!", vrm);

                // Map bones
                bones.head = vrm.humanoid.getBoneNode("head");
                bones.spine = vrm.humanoid.getBoneNode("spine");
                bones.lArm = vrm.humanoid.getBoneNode("leftUpperArm");
                bones.rArm = vrm.humanoid.getBoneNode("rightUpperArm");
                
                // Relax arms
                if(bones.lArm) bones.lArm.rotation.z = 1.2;
                if(bones.rArm) bones.rArm.rotation.z = -1.2;
            });
        },
        (progress) => console.log(`Loading: ${Math.round((progress.loaded / progress.total) * 100)}%`),
        (error) => console.error("❌ VRM LOAD ERROR:", error)
    );

    window.addEventListener("mousemove", (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

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

        // 1. Wind & Jiggle
        const wind = Math.sin(t * 0.5) * 0.02;
        vrm.springBoneManager.springBodies.forEach(s => s.externalForce.set(wind, 0, 0));

        // 2. Eye Tracking
        if (bones.head) {
            const lookTarget = new THREE.Vector3(mouse.x * 2, mouse.y * 2 + 1.2, 5);
            bones.head.lookAt(lookTarget);
        }

        // 3. Lip Sync
        if (isTalking) {
            vrm.blendShapeProxy.setValue("a", Math.abs(Math.sin(t * 12)) * 0.7);
        } else {
            vrm.blendShapeProxy.setValue("a", 0);
        }

        // 4. Expression
        vrm.blendShapeProxy.setValue("joy", currentMood === "lewd" ? 1 : 0);
        vrm.blendShapeProxy.setValue("blink", Math.sin(t * 3) > 0.98 ? 1 : 0);
    }
    renderer.render(scene, camera);
}

// UI HANDLERS
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
            body: JSON.stringify({ history, mode: "horny", affection })
        });
        const data = await res.json();

        currentMood = data.mood;
        if(currentMood === "lewd") document.getElementById("blush-overlay").classList.add("lewd-glow");

        appendChat("waifu", data.reply);
        speak(data.reply);
        history.push({ role: "assistant", content: data.reply });
        localStorage.setItem("memory", JSON.stringify(history.slice(-30)));
    } catch (e) { 
        console.error("Backend Error:", e);
        appendChat("waifu", "I'm having trouble thinking... is the backend live?");
    }
}

function speak(text) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = 1.4; 
    u.onstart = () => isTalking = true;
    u.onend = () => {
        isTalking = false;
        setTimeout(() => document.getElementById("blush-overlay").classList.remove("lewd-glow"), 3000);
    };
    window.speechSynthesis.speak(u);
}

function appendChat(role, text) {
    const chat = document.getElementById("chat-container");
    const p = document.createElement("p");
    p.className = role;
    p.innerHTML = `<b>${role === 'user' ? 'You' : 'Waifu'}:</b> ${text}`;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
}

function updateAffection(v) {
    affection = Math.min(100, affection + v);
    document.getElementById("affection-fill").style.width = affection + "%";
    localStorage.setItem("affection", affection);
}

// Touch Interaction
window.addEventListener("mousedown", () => {
    if(!vrm) return;
    currentMood = "lewd";
    document.getElementById("blush-overlay").classList.add("lewd-glow");
    const r = "D-don't just touch me like that... *blushes*";
    appendChat("waifu", r);
    speak(r);
    updateAffection(1);
});

init();
document.getElementById("send-btn").onclick = handleChat;
