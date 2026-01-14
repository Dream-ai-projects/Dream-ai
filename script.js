const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat"; 
let history = JSON.parse(localStorage.getItem("memory")) || [];
let affection = parseInt(localStorage.getItem("affection")) || 50;
let currentMood = "neutral";
let isTalking = false;
let vrm, scene, camera, renderer, clock = new THREE.Clock();
let bones = {};
const mouse = new THREE.Vector2();

/* ================= 3D CORE ================= */
async function init() {
    const canvas = document.getElementById("vrm-canvas");
    scene = new THREE.Scene();
    
    // CAMERA: Adjusted to see more of her body (Full View)
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 20);
    camera.position.set(0, 1.2, 2.8); 

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(1, 1, 1).normalize();
    scene.add(light, new THREE.AmbientLight(0xffffff, 0.6));

    const loader = new THREE.GLTFLoader();
    loader.load("./oni.vrm", (gltf) => {
        THREE.VRM.from(gltf).then((v) => {
            vrm = v;
            scene.add(vrm.scene);
            vrm.scene.rotation.y = Math.PI;

            // Setup Bones
            bones.head = vrm.humanoid.getBoneNode("head");
            bones.spine = vrm.humanoid.getBoneNode("spine");
            bones.lArm = vrm.humanoid.getBoneNode("leftUpperArm");
            bones.rArm = vrm.humanoid.getBoneNode("rightUpperArm");
            
            // Initial Arm Fix (No T-Pose)
            bones.lArm.rotation.z = 1.3;
            bones.rArm.rotation.z = -1.3;
        });
    });

    window.addEventListener("mousemove", (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    animate();
}

/* ================= PHYSICS & ANIMATION ================= */
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();

    if (vrm) {
        // 1. Update Jiggle Physics (Spring Bones)
        vrm.update(delta);

        // 2. Wind Physics (Subtle hair/clothing sway)
        const wind = Math.sin(t * 0.5) * 0.02;
        vrm.springBoneManager.springBodies.forEach(s => {
            s.externalForce.set(wind, 0, 0);
        });

        // 3. Eye/Head Tracking (Follow Mouse)
        if (bones.head) {
            const target = new THREE.Vector3(mouse.x, mouse.y + 1.2, 2);
            bones.head.lookAt(target);
        }

        // 4. Lip Sync (Talking)
        if (isTalking) {
            vrm.blendShapeProxy.setValue("a", Math.abs(Math.sin(t * 12)) * 0.6);
        } else {
            vrm.blendShapeProxy.setValue("a", 0);
        }

        // 5. Breathing (Faster when lewd)
        const bSpeed = currentMood === "lewd" ? 2.5 : 1.5;
        if(bones.spine) bones.spine.rotation.x = Math.sin(t * bSpeed) * 0.03;

        // 6. Mood Expressions
        vrm.blendShapeProxy.setValue("joy", currentMood === "lewd" || currentMood === "happy" ? 1 : 0);
        vrm.blendShapeProxy.setValue("blink", Math.sin(t * 3) > 0.98 ? 1 : 0);
    }
    renderer.render(scene, camera);
}

/* ================= ACTIONS ================= */
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
        if(currentMood === "lewd") {
            document.getElementById("blush-overlay").classList.add("lewd-glow");
            updateAffection(2);
        }

        appendChat("waifu", data.reply);
        speak(data.reply);
        history.push({ role: "assistant", content: data.reply });
        localStorage.setItem("memory", JSON.stringify(history.slice(-30)));
    } catch (e) { console.error(e); }
}

function speak(text) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = 1.4; // Anime High Pitch
    u.rate = 1.0;
    u.onstart = () => isTalking = true;
    u.onend = () => {
        isTalking = false;
        setTimeout(() => document.getElementById("blush-overlay").classList.remove("lewd-glow"), 2000);
    };
    window.speechSynthesis.speak(u);
}

function updateAffection(v) {
    affection = Math.min(100, affection + v);
    document.getElementById("affection-fill").style.width = affection + "%";
    localStorage.setItem("affection", affection);
}

function appendChat(role, text) {
    const chat = document.getElementById("chat-container");
    const p = document.createElement("p");
    p.className = role;
    p.innerHTML = `<b>${role === 'user' ? 'You' : 'Waifu'}:</b> ${text}`;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
}

/* ================= TOUCH REACTIONS ================= */
window.addEventListener("mousedown", () => {
    if(!vrm) return;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(vrm.scene.children, true);

    if(intersects.length > 0) {
        currentMood = "lewd";
        document.getElementById("blush-overlay").classList.add("lewd-glow");
        const r = "M-master... you're touching me so suddenly... *moans softly*";
        appendChat("waifu", r);
        speak(r);
        updateAffection(1);
    }
});

init();
document.getElementById("send-btn").onclick = handleChat;
