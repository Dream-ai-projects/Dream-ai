const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= STATE ================= */
let history = [];
let personality = "girlfriend";
let memoryEnabled = true;

/* ================= CHAT + UI ================= */
window.addEventListener("DOMContentLoaded", () => {
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
      typing.innerHTML = `<b>Waifu:</b> ${reply}`;

      if (memoryEnabled) {
        history.push({ role: "assistant", content: reply });
      }
    } catch {
      typing.innerHTML = "<b>Waifu:</b> connection error 😿";
    }
  }

  sendBtn.onclick = sendMsg;
  input.onkeydown = e => { if (e.key === "Enter") sendMsg(); };

  // Settings
  const settingsBtn = document.getElementById("settings-btn");
  const settingsPanel = document.getElementById("settings-panel");
  const closeSettings = document.getElementById("close-settings");
  const personalitySelect = document.getElementById("personality-select");
  const memoryToggle = document.getElementById("memory-toggle");

  settingsBtn.onclick = () => settingsPanel.classList.toggle("hidden");
  closeSettings.onclick = () => settingsPanel.classList.add("hidden");
  personalitySelect.onchange = e => personality = e.target.value;
  memoryToggle.onchange = e => memoryEnabled = e.target.checked;

  // Init VRM
  initVRM();
});

/* ================= VRM ================= */
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.6, 3);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 1));
  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(1, 2, 3);
  scene.add(light);

  // Load VRM
  const loader = new THREE.GLTFLoader();
  loader.crossOrigin = "anonymous";
  loader.load(
    "./oni.vrm",
    gltf => {
      THREE.VRM.from(gltf).then(v => {
        vrm = v;

        // Always render model even if humanoid missing
        vrm.scene.traverse(obj => { obj.frustumCulled = false; });
        vrm.scene.position.set(0, 0, 0);
        vrm.scene.rotation.y = Math.PI;
        vrm.scene.scale.set(1,1,1);
        scene.add(vrm.scene);
      }).catch(() => {
        // If VRM parse fails, just add raw gltf.scene
        scene.add(gltf.scene);
      });
    },
    undefined,
    () => {
      // fallback: empty scene
    }
  );

  // Resize for mobile
  function resize() {
    if (!renderer || !camera) return;
    const parent = canvas.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);
  resize();

  // Animate
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const t = clock.elapsedTime;

    if (vrm && vrm.humanoid) vrm.update(delta);

    // slow rotation so you can see model
    if (vrm && vrm.scene) vrm.scene.rotation.y += 0.003;

    renderer.render(scene, camera);
  }

  animate();
}
