const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= CHAT ================= */
let history = [];
let currentMood = "idle";

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

/* ================= SEND ================= */
async function sendMsg() {
  const msg = input.value.trim();
  if (!msg) return;

  append("user", msg);
  input.value = "";
  history.push({ role: "user", content: msg });

  const typing = document.createElement("p");
  typing.className = "waifu";
  typing.innerHTML = "<i>Typing…</i>";
  chat.appendChild(typing);

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, history })
    });

    const data = await res.json();
    const reply = data.reply || "...";

    typing.innerHTML = `<b>Waifu:</b> ${reply}`;
    history.push({ role: "assistant", content: reply });

  } catch {
    typing.innerHTML = "<b>Waifu:</b> network issue 😿";
  }
}

sendBtn.onclick = sendMsg;
input.onkeydown = e => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMsg();
  }
};

/* ================= VRM ================= */
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.45, 2.2);

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener("resize", resize);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 2, 3);
  scene.add(light);

  const loader = new THREE.GLTFLoader();
  loader.load("./oni.vrm", gltf => {
    THREE.VRM.from(gltf).then(v => {
      vrm = v;

      THREE.VRMUtils.removeUnnecessaryJoints(vrm.scene);

      vrm.scene.position.set(0, 0, 0);
      vrm.scene.rotation.y = Math.PI;

      scene.add(vrm.scene);
    });
  });

  animate();
}

/* ================= ANIMATION ================= */
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const t = clock.elapsedTime;

  if (!vrm) return;
  vrm.update(delta);

  const h = vrm.humanoid;
  if (!h) return;

  const spine = h.getBoneNode("spine");
  const chest = h.getBoneNode("chest");
  const head = h.getBoneNode("head");

  if (spine) spine.rotation.y = Math.sin(t * 0.5) * 0.03;
  if (chest) chest.rotation.x = Math.sin(t * 0.8) * 0.04;
  if (head) head.rotation.y = Math.sin(t * 0.6) * 0.05;

  // blink (VRM 0.6 compatible)
  if (vrm.blendShapeProxy) {
    vrm.blendShapeProxy.setValue(
      THREE.VRM.BlendShapePresetName.Blink,
      Math.sin(t * 3) > 0.97 ? 1 : 0
    );
  }

  renderer.render(scene, camera);
}

window.onload = initVRM;

/* ================= SETTINGS ================= */
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettings = document.getElementById("close-settings");

settingsBtn.onclick = () => {
  settingsPanel.classList.toggle("hidden");
};

closeSettings.onclick = () => {
  settingsPanel.classList.add("hidden");
};
