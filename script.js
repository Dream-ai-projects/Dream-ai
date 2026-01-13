const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= STATE ================= */
let history = [];
let personality = "girlfriend";
let memoryEnabled = true;

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

/* ================= VRM ================= */
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    30,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 1.45, 2.2);

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 2, 3);
  scene.add(light);

  const loader = new THREE.GLTFLoader();
  loader.load("./oni.vrm", gltf => {
    THREE.VRM.from(gltf).then(v => {
      vrm = v;
      vrm.scene.rotation.y = Math.PI;
      scene.add(vrm.scene);
    });
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const t = clock.elapsedTime;

  if (!vrm) return;
  vrm.update(delta);

  const head = vrm.humanoid?.getBoneNode("head");
  if (head) head.rotation.y = Math.sin(t * 0.6) * 0.05;

  if (vrm.blendShapeProxy) {
    vrm.blendShapeProxy.setValue(
      THREE.VRM.BlendShapePresetName.Blink,
      Math.sin(t * 3) > 0.98 ? 1 : 0
    );
  }

  renderer.render(scene, camera);
}
