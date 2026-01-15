const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";
let history = JSON.parse(localStorage.getItem("memory")) || [];
let currentMood = "neutral";
let isTalking = false;
let scene, camera, renderer, vrm, clock = new THREE.Clock();

function log(msg) { 
    document.getElementById("debug-log").innerText = "Log: " + msg;
}

async function init() {
    log("Scene init...");
    const canvas = document.getElementById("vrm-canvas");
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 20);
    camera.position.set(0, 1.4, 3.5);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    scene.add(new THREE.DirectionalLight(0xffffff, 1.0));
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // THE CUBE TEST
    const testCube = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    testCube.position.set(0, 1.3, 0);
    scene.add(testCube);

    log("Loading VRM...");
    const loader = new THREE.GLTFLoader();
    loader.load(
        "./oni.vrm", 
        (gltf) => {
            THREE.VRM.from(gltf).then((v) => {
                scene.remove(testCube);
                vrm = v;
                scene.add(vrm.scene);
                vrm.scene.rotation.y = Math.PI;
                log("✅ LOADED!");
            });
        },
        (p) => log("Loading: " + Math.round((p.loaded/p.total)*100) + "%"),
        (e) => log("❌ ERROR: " + e.message)
    );

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (vrm) vrm.update(clock.getDelta());
    renderer.render(scene, camera);
}

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
        appendChat("waifu", data.reply);
        history.push({ role: "assistant", content: data.reply });
    } catch (e) { log("API Fail"); }
}

function appendChat(role, text) {
    const c = document.getElementById("chat-container");
    const p = document.createElement("p");
    p.className = role;
    // FIXED THE BACKTICKS HERE
    p.innerHTML = `<b>${role === 'user' ? 'You' : 'Waifu'}:</b> ${text}`;
    c.appendChild(p);
    c.scrollTop = c.scrollHeight;
}

function toggleSettings() { document.getElementById("settings-menu").classList.toggle("hidden"); }
function clearMemory() { localStorage.clear(); location.reload(); }

document.getElementById("send-btn").onclick = handleChat;
init();
