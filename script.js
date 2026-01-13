/* ================= STATE ================= */
// ✅ KEPT YOUR ORIGINAL URL
const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat"; 
let history = [];
let personality = "girlfriend";
let memoryEnabled = true;

// 🔥 NEW: Animation State
let currentMood = "neutral";
let bones = { neck: null, head: null, leftArm: null, rightArm: null, spine: null };

/* ================= DOM SAFE ================= */
window.addEventListener("DOMContentLoaded", () => {
  
  /* ===== CHAT ===== */
  const chat = document.getElementById("chat");
  const input = document.getElementById("msg");
  const sendBtn = document.getElementById("send-btn");

  function append(role, text) {
    const p = document.createElement("p");
    p.className = role;
    p.innerHTML = `<b>${role === "user" ? "You" : "Waifu"}:</b> ${text}`;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
  }

  async function sendMsg() {
    const msg = input.value.trim();
    if (!msg) return;

    append("user", msg);
    input.value = "";

    if (memoryEnabled) {
      history.push({ role: "user", content: msg });
    } else {
      history = [{ role: "user", content: msg }];
    }

    const typing = document.createElement("p");
    typing.className = "waifu";
    typing.innerHTML = "<i>Typing…</i>";
    chat.appendChild(typing);

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          mode: personality
        })
      });

      const data = await res.json();
      const reply = data.reply || "...";

      // 🔥 NEW: UPDATE CHARACTER MOOD
      if (data.mood) {
        currentMood = data.mood;
        console.log("Mood set to:", currentMood);
      }

      typing.innerHTML = `<b>Waifu:</b> ${reply}`;

      if (memoryEnabled) {
        history.push({ role: "assistant", content: reply });
      }

    } catch (err) {
      typing.innerHTML = "<b>Waifu:</b> connection error 😿";
      console.error(err);
    }
  }

  sendBtn.onclick = sendMsg;
  input.onkeydown = e => {
    if (e.key === "Enter") sendMsg();
  };

  /* ===== SETTINGS ===== */
  const settingsBtn = document.getElementById("settings-btn");
  const settingsPanel = document.getElementById("settings-panel");
  const closeSettings = document.getElementById("close-settings");
  const personalitySelect = document.getElementById("personality-select");
  const memoryToggle = document.getElementById("memory-toggle");

  settingsBtn.onclick = () => {
    settingsPanel.classList.toggle("hidden");
  };

  closeSettings.onclick = () => {
    settingsPanel.classList.add("hidden");
  };

  personalitySelect.onchange = e => {
    personality = e.target.value;
  };

  memoryToggle.onchange = e => {
    memoryEnabled = e.target.checked;
  };

  /* ===== VRM ===== */
  initVRM();
});

/* ================= VRM & ANIMATION ================= */
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

// 🔥 NEW: Mood Configuration
const MOOD_CONFIG = {
  neutral: { arm: 70, tilt: 0, express: "neutral" },
  happy:   { arm: 50, tilt: -0.1, express: "joy" },
  excited: { arm: 30, tilt: -0.2, express: "fun" },
  shy:     { arm: 80, tilt: 0.2, express: "sorrow" }
};

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(30, canvas.clientWidth / canvas.clientHeight, 0.1, 20);
  camera.position.set(0, 1.4, 1.5); 
  
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setClearColor(0x000000, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(1, 1, 1);
  scene.add(light);

  window.addEventListener("resize", () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  const loader = new THREE.GLTFLoader();
  loader.crossOrigin = "anonymous";

  loader.load(
    "./oni.vrm",
    gltf => {
      THREE.VRM.from(gltf).then(v => {
        vrm = v;
        
        vrm.scene.traverse(obj => { obj.frustumCulled = false; });
        
        // 🔥 FIX: Stop spinning, face front
        vrm.scene.position.set(0, 0, 0);
        vrm.scene.rotation.y = Math.PI; 

        // 🔥 FIX: Grab bones for animation
        bones.neck = vrm.humanoid.getBoneNode("neck");
        bones.head = vrm.humanoid.getBoneNode("head");
        bones.spine = vrm.humanoid.getBoneNode("spine");
        bones.leftArm = vrm.humanoid.getBoneNode("leftUpperArm");
        bones.rightArm = vrm.humanoid.getBoneNode("rightUpperArm");

        // 🔥 FIX: Instant Arm Reset (No T-Pose)
        if(bones.leftArm) bones.leftArm.rotation.z = 1.2; 
        if(bones.rightArm) bones.rightArm.rotation.z = -1.2;

        scene.add(vrm.scene);
      });
    },
    undefined,
    (err) => console.error("❌ VRM LOAD ERROR", err)
  );

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const t = clock.elapsedTime;

  if (vrm) {
    vrm.update(delta);

    // --- ANIMATION LOGIC ---
    const activeMood = MOOD_CONFIG[currentMood] || MOOD_CONFIG.neutral;
    
    // 1. Breathing (Sine wave on spine)
    if (bones.spine) bones.spine.rotation.x = Math.sin(t * 1.5) * 0.03;

    // 2. Arms (Smoothly move to mood position)
    if (bones.leftArm) {
      const targetZ = activeMood.arm * (Math.PI / 180);
      bones.leftArm.rotation.z += (targetZ - bones.leftArm.rotation.z) * 0.05;
      bones.rightArm.rotation.z = -bones.leftArm.rotation.z;
    }

    // 3. Head Tilt
    if (bones.head) {
      bones.head.rotation.z += (activeMood.tilt - bones.head.rotation.z) * 0.05;
      bones.head.rotation.y = Math.sin(t * 0.5) * 0.05; // Idle Sway
    }

    // 4. Face Expressions
    ["joy", "sorrow", "fun"].forEach(e => vrm.blendShapeProxy.setValue(e, 0)); // Reset
    if (activeMood.express !== "neutral") {
      vrm.blendShapeProxy.setValue(activeMood.express, 1);
    }

    // 5. Blinking
    vrm.blendShapeProxy.setValue("blink", Math.sin(t * 3) > 0.98 ? 1 : 0);
  }

  renderer.render(scene, camera);
}
