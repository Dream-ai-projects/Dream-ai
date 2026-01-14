const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat"; // REPLACE WITH YOUR RENDER URL
let history = JSON.parse(localStorage.getItem("memory")) || [];
let currentMood = "neutral";
let isTalking = false;

let scene, camera, renderer, vrm, clock = new THREE.Clock();
let bones = {};

// Mobile Logger
function log(msg) { document.getElementById("debug-log").innerText = "Status: " + msg; }

async function init() {
    log("Scene building...");
    const canvas = document.getElementById("vrm-canvas");
    scene = new THREE.Scene();

    // Camera adjusted for Vertical Mobile screens
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
    camera.position.set(0, 1.1, 2.5); 

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance

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
                
                bones.head = vrm.humanoid.getBoneNode("head");
                bones.spine = vrm.humanoid.getBoneNode("spine");
                bones.lArm = vrm.humanoid.getBoneNode("leftUpperArm");
                bones.rArm = vrm.humanoid.getBoneNode("rightUpperArm");
                
                if(bones.lArm) bones.lArm.rotation.z = 1.3;
                if(bones.rArm) bones.rArm.rotation.z = -1.3;
                
                log("✅ Ready!");
                setTimeout(() => document.getElementById("debug-log").classList.add("hidden"), 3000);
            });
        },
        (progress) => log(`Loading: ${Math.round((progress.loaded / progress.total) * 100)}%`),
        (err) => log("❌ Load Error: " + err)
    );

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();

    if (vrm) {
        vrm.update(delta);
        
        // Jiggle/Wind
        const wind = Math.sin(t * 0.5) * 0.02;
        vrm.springBoneManager.springBodies.forEach(s => s.externalForce.set(wind, 0, 0));

        // Lip Sync
        if (isTalking) {
            vrm.blendShapeProxy.setValue("a", Math.abs(Math.sin(t * 12)) * 0.7);
        } else {
            vrm.blendShapeProxy.setValue("a", 0);
        }

        // Expressions
        vrm.blendShapeProxy.setValue("joy", currentMood === "lewd" ? 1 : 0);
        vrm.blendShapeProxy.setValue("blink", Math.sin(t * 3) > 0.98 ? 1 : 0);
    }
    renderer.render(scene, camera);
}

// CHAT LOGIC
async function handleChat() {
    const input = document.getElementById("msg");
    const text = input.value.trim();
    const mode = document.getElementById("pers-select").value;
    if (!text) return;

    appendChat("user", text);
    input.value = "";
    history.push({ role: "user", content: text });

    try {
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history, mode })
        });
        const data = await res.json();

        currentMood = data.mood;
        if(currentMood === "lewd") document.getElementById("blush-overlay").classList.add("lewd-glow");

        appendChat("waifu", data.reply);
        speak(data.reply);
        history.push({ role: "assistant", content: data.reply });
        localStorage.setItem("memory", JSON.stringify(history.slice(-20)));
    } catch (e) { log("API Error: Check Render Backend"); }
}

function speak(text) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = 1.4;
    u.onstart = () => isTalking = true;
    u.onend = () => isTalking = false;
    window.speechSynthesis.speak(u);
}

function toggleSettings() {
    document.getElementById("settings-menu").classList.toggle("hidden");
}

function clearMemory() {
    localStorage.clear();
    location.reload();
}

function appendChat(role, text) {
    const c = document.getElementById("chat-container");
    const p = document.createElement("p");
    p.className = role;
    p.innerHTML = `<b>${role === 'user' ? 'You' : 'Waifu'}:</b> ${text}`;
    c.appendChild(p);
    c.scrollTop = c.scrollHeight;
}

// Touch to Blush
window.addEventListener("touchstart", (e) => {
    if(!vrm) return;
    currentMood = "lewd";
    document.getElementById("blush-overlay").classList.add("lewd-glow");
    setTimeout(() => document.getElementById("blush-overlay").classList.remove("lewd-glow"), 3000);
});

init();
document.getElementById("send-btn").onclick = handleChat;
