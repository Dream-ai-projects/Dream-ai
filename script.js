const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";
let history = JSON.parse(localStorage.getItem("memory")) || [];
let currentMood = "neutral";
let isTalking = false;

let scene, camera, renderer, vrm, clock = new THREE.Clock();
let bones = {};

function log(msg) { document.getElementById("debug-log").innerText = "Log: " + msg; }

async function init() {
    log("Scene building...");
    const canvas = document.getElementById("vrm-canvas");
    scene = new THREE.Scene();

    // CAMERA ADJUSTED: Pointing at her upper body so she's above the chat
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 20);
    camera.position.set(0, 1.2, 2.4); // Focus on face/torso

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(1, 1, 1);
    scene.add(light, new THREE.AmbientLight(0xffffff, 0.7));

    log("Loading oni.vrm...");
    new THREE.GLTFLoader().load(
        "./oni.vrm",
        (gltf) => {
            THREE.VRM.from(gltf).then((v) => {
                vrm = v;
                scene.add(vrm.scene);
                vrm.scene.rotation.y = Math.PI;
                
                // Bone setup for poses
                bones.head = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Head);
                bones.lArm = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.LeftUpperArm);
                bones.rArm = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.RightUpperArm);
                
                if(bones.lArm) bones.lArm.rotation.z = 1.3;
                if(bones.rArm) bones.rArm.rotation.z = -1.3;
                
                log("✅ Ready!");
                // Auto-hide the debug log after 3 seconds
                setTimeout(() => document.getElementById("debug-log").classList.add("hidden"), 3000);
            });
        },
        (p) => log(`Loading: ${Math.round((p.loaded/p.total)*100)}%`),
        (e) => log("❌ Error: " + e)
    );
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();

    if (vrm) {
        vrm.update(delta);

        // 1. WIND & JIGGLE (The "Hot" Physics)
        const wind = Math.sin(t * 0.7) * 0.03;
        vrm.springBoneManager.springBodies.forEach(s => {
            s.externalForce.set(wind, 0, Math.cos(t * 0.5) * 0.01);
        });

        // 2. BREATHING ANIMATION
        vrm.scene.position.y = Math.sin(t * 0.5) * 0.005;

        // 3. LIP SYNC (Talking)
        if (isTalking) {
            vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.A, Math.abs(Math.sin(t * 15)) * 0.8);
        } else {
            vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.A, 0);
        }

        // 4. EXPRESSIONS & BLINKING
        const blink = Math.sin(t * 4) > 0.98 ? 1 : 0;
        vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.Blink, blink);
        vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.Joy, currentMood === "lewd" ? 1 : 0);
    }
    renderer.render(scene, camera);
}

// CHAT & INTERACTIONS
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
        currentMood = data.mood;
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

function triggerBlush() {
    document.getElementById("blush-overlay").classList.add("lewd-glow");
    setTimeout(() => document.getElementById("blush-overlay").classList.remove("lewd-glow"), 5000);
}

function appendChat(role, text) {
    const c = document.getElementById("chat-container");
    const p = document.createElement("p");
    p.className = role;
    p.innerHTML = `<b>${role === 'user' ? 'You' : 'Waifu'}:</b> ${text}`;
    c.appendChild(p);
    c.scrollTop = c.scrollHeight;
}

// Touch Reaction (Lewd mode)
window.addEventListener("touchstart", (e) => {
    if(!vrm) return;
    currentMood = "lewd";
    triggerBlush();
    if(window.speechSynthesis.paused) window.speechSynthesis.resume();
});

document.getElementById("send-btn").onclick = handleChat;
function toggleSettings() { document.getElementById("settings-menu").classList.toggle("hidden"); }
function clearMemory() { localStorage.clear(); location.reload(); }

init();
