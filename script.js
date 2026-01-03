const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ===== CHAT MEMORY ===== */
let history = JSON.parse(localStorage.getItem("waifu_history")) || [];

/* ===== DOM ===== */
const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send-btn");

/* ===== UI APPEND ===== */
function append(role, text) {
  const p = document.createElement("p");
  p.className = role;
  p.innerHTML = `<b>${role === "user" ? "You" : "Waifu"}:</b> ${text}`;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

/* ===== SEND MESSAGE ===== */
async function sendMsg() {
  const msg = input.value.trim();
  if (!msg) return;

  append("user", msg);
  input.value = "";
  input.blur();

  history.push({ role: "user", content: msg });
  localStorage.setItem("waifu_history", JSON.stringify(history));

  const typing = document.createElement("p");
  typing.className = "waifu";
  typing.innerHTML = "<i>Typing…</i>";
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

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
    localStorage.setItem("waifu_history", JSON.stringify(history));
  } catch (e) {
    typing.innerHTML = "<b>Waifu:</b> network issue 😿";
  }
}

/* ===== EVENTS (MOBILE SAFE) ===== */
sendBtn.addEventListener("click", sendMsg);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMsg();
  }
});

/* ===== PERSONALITY MODE ===== */
async function changeMode(mode) {
  try {
    await fetch("https://dream-ai-backend-kkkk.onrender.com/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode })
    });

    history = [];
    localStorage.removeItem("waifu_history");
    append("waifu", `*smiles softly* I’ll act as your ${mode} now~`);
  } catch {
    append("waifu", "*tilts head* couldn’t change mode…");
  }
}

/* ===== VRM & ANIMATION ===== */
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

// BLINK TIMER
let blinkTime = 0;
function blinkAnimation(vrm, delta) {
  if (!vrm || !vrm.blendShapeProxy) return;
  blinkTime += delta;
  if (blinkTime > 4) {
    vrm.blendShapeProxy.setValue(THREE.VRM.BlendShapePresetName.Blink, 1);
    setTimeout(() => {
      if (vrm) vrm.blendShapeProxy.setValue(THREE.VRM.BlendShapePresetName.Blink, 0);
    }, 150);
    blinkTime = 0;
  }
}

// RELAX ARMS
function relaxArms(vrm) {
  if (!vrm.humanoid) return;

  const leftUpperArm = vrm.humanoid.getBoneNode("leftUpperArm");
  const rightUpperArm = vrm.humanoid.getBoneNode("rightUpperArm");
  const leftLowerArm = vrm.humanoid.getBoneNode("leftLowerArm");
  const rightLowerArm = vrm.humanoid.getBoneNode("rightLowerArm");

  if (leftUpperArm) leftUpperArm.rotation.z = 0.25;
  if (rightUpperArm) rightUpperArm.rotation.z = -0.25;
  if (leftLowerArm) leftLowerArm.rotation.x = -0.15;
  if (rightLowerArm) rightLowerArm.rotation.x = -0.15;
}

// IDLE SWAY
function idleSway(vrm, delta) {
  if (!vrm || !vrm.scene) return;
  const sway = Math.sin(Date.now() / 800) * 0.01; // subtle sway
  vrm.scene.rotation.y = Math.PI + sway;
  vrm.scene.position.y = sway * 0.5; // tiny vertical float
}

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");
  if (!canvas || !window.THREE) return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.4, 2.2);

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);

  function resize() {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 2, 3);
  scene.add(light);

  const loader = new THREE.GLTFLoader();
  loader.load(
    "./oni.vrm",
    gltf => {
      THREE.VRM.from(gltf).then(v => {
        vrm = v;
        vrm.scene.rotation.y = Math.PI;
        vrm.scene.position.set(0, 0, 0);
        vrm.scene.scale.set(1, 1, 1);
        scene.add(vrm.scene);

        // APPLY RELAXED ARMS
        relaxArms(vrm);
      });
    },
    undefined,
    err => console.error("VRM LOAD ERROR", err)
  );

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (vrm) {
    vrm.update(Math.min(delta, 0.016));
    blinkAnimation(vrm, delta);
    idleSway(vrm, delta);
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

window.addEventListener("load", initVRM);

/* ===== GREETING ===== */
if (history.length === 0) {
  append("waifu", "*looks at you* Hey… I was waiting 💗");
}

/* ===== SETTINGS ===== */
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettings = document.getElementById("close-settings");
const memoryToggle = document.getElementById("memory-toggle");
const personalitySelect = document.getElementById("personality-select");

let memoryEnabled = localStorage.getItem("memory") !== "off";
memoryToggle.checked = memoryEnabled;

settingsBtn.onclick = () => settingsPanel.classList.toggle("hidden");
closeSettings.onclick = () => settingsPanel.classList.add("hidden");

// MEMORY TOGGLE
memoryToggle.onchange = () => {
  memoryEnabled = memoryToggle.checked;
  localStorage.setItem("memory", memoryEnabled ? "on" : "off");

  if (!memoryEnabled) {
    history = [];
    localStorage.removeItem("waifu_history");
    append("waifu", "*nods* I won’t remember past messages now.");
  } else {
    append("waifu", "*smiles* I’ll remember our chats again.");
  }
};

// PERSONALITY CHANGE
personalitySelect.onchange = () => changeMode(personalitySelect.value);
