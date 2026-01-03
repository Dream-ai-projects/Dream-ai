const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= CHAT MEMORY ================= */
let history = JSON.parse(localStorage.getItem("waifu_history")) || [];
let memoryEnabled = localStorage.getItem("memory") !== "off";

/* ================= DOM ================= */
const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send-btn");

/* ================= UI ================= */
function append(role, text) {
  const p = document.createElement("p");
  p.className = role;
  p.innerHTML = `<b>${role === "user" ? "You" : "Waifu"}:</b> ${text}`;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

/* ================= SEND MESSAGE ================= */
async function sendMsg() {
  const msg = input.value.trim();
  if (!msg) return;

  append("user", msg);
  input.value = "";
  input.blur();

  if (memoryEnabled) {
    history.push({ role: "user", content: msg });
    localStorage.setItem("waifu_history", JSON.stringify(history));
  }

  const typing = document.createElement("p");
  typing.className = "waifu";
  typing.innerHTML = "<i>Typing…</i>";
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  startTalking(); // 👄 start mouth animation

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        history: memoryEnabled ? history : []
      })
    });

    const data = await res.json();
    const reply = data.reply || "...";

    typing.innerHTML = `<b>Waifu:</b> ${reply}`;

    if (memoryEnabled) {
      history.push({ role: "assistant", content: reply });
      localStorage.setItem("waifu_history", JSON.stringify(history));
    }

  } catch (e) {
    typing.innerHTML = "<b>Waifu:</b> network issue 😿";
  }

  stopTalking();
}

/* ================= EVENTS ================= */
sendBtn.addEventListener("click", sendMsg);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMsg();
  }
});

/* ================= PERSONALITY ================= */
async function changeMode(mode) {
  try {
    await fetch("https://dream-ai-backend-kkkk.onrender.com/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode })
    });

    history = [];
    localStorage.removeItem("waifu_history");
    setExpression(mode);

    append("waifu", `*smiles* I’m your ${mode} now~`);
  } catch {
    append("waifu", "*tilts head* couldn’t change mode…");
  }
}

/* ================= VRM SETUP ================= */
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

/* ===== animation state ===== */
let blinkTimer = 0;
let isTalking = false;

let targetRotationY = Math.PI;
let currentRotationY = Math.PI;
let isDragging = false;
let lastX = 0;

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");
  if (!canvas) return;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.4, 2.2);

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

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

  /* ===== TOUCH ROTATE ===== */
  canvas.addEventListener("touchstart", e => {
    isDragging = true;
    lastX = e.touches[0].clientX;
  });

  canvas.addEventListener("touchmove", e => {
    if (!isDragging) return;
    const x = e.touches[0].clientX;
    targetRotationY += (x - lastX) * 0.005;
    lastX = x;
  });

  canvas.addEventListener("touchend", () => {
    isDragging = false;
  });

  const loader = new THREE.GLTFLoader();
  loader.load(
    "./oni.vrm",
    gltf => {
      THREE.VRM.from(gltf).then(v => {
        vrm = v;
        vrm.scene.rotation.y = Math.PI;
        scene.add(vrm.scene);
      });
    },
    undefined,
    err => console.error("VRM LOAD ERROR", err)
  );

  animate();
}

/* ================= ANIMATIONS ================= */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.elapsedTime;

  if (vrm) {
    vrm.update(delta);

    /* 🌸 smooth rotate */
    currentRotationY += (targetRotationY - currentRotationY) * 0.08;
    vrm.scene.rotation.y = currentRotationY;

    /* 🌸 idle sway */
    vrm.scene.rotation.z = Math.sin(time * 0.8) * 0.02;

    /* 🌸 breathing */
    const breath = 1 + Math.sin(time * 1.5) * 0.01;
    vrm.scene.scale.set(breath, breath, breath);

    /* 👁️ blinking */
    blinkTimer += delta;
    if (blinkTimer > 3 + Math.random() * 2) {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
      blinkTimer = 0;
    }

    /* 👄 talking */
    if (isTalking) {
      setMouth(Math.abs(Math.sin(time * 12)));
    } else {
      setMouth(0);
    }
  }

  renderer.render(scene, camera);
}

/* ================= EXPRESSIONS ================= */
function setBlink(state) {
  const exp = vrm?.expressionManager;
  if (!exp) return;
  exp.setValue("blink", state ? 1 : 0);
}

function setMouth(v) {
  const exp = vrm?.expressionManager;
  if (!exp) return;
  exp.setValue("aa", v);
}

function startTalking() {
  isTalking = true;
}
function stopTalking() {
  setTimeout(() => (isTalking = false), 400);
}

function setExpression(mode) {
  const exp = vrm?.expressionManager;
  if (!exp) return;

  exp.reset();

  if (mode === "girlfriend") exp.setValue("happy", 0.8);
  if (mode === "waifu") exp.setValue("joy", 0.6);
  if (mode === "horny") exp.setValue("relaxed", 0.9);
}

/* ================= SETTINGS ================= */
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettings = document.getElementById("close-settings");
const memoryToggle = document.getElementById("memory-toggle");
const personalitySelect = document.getElementById("personality-select");

memoryToggle.checked = memoryEnabled;

settingsBtn.onclick = () => settingsPanel.classList.toggle("hidden");
closeSettings.onclick = () => settingsPanel.classList.add("hidden");

memoryToggle.onchange = () => {
  memoryEnabled = memoryToggle.checked;
  localStorage.setItem("memory", memoryEnabled ? "on" : "off");

  if (!memoryEnabled) {
    history = [];
    localStorage.removeItem("waifu_history");
    append("waifu", "*nods* I won’t remember past chats.");
  } else {
    append("waifu", "*smiles* I’ll remember you 💗");
  }
};

personalitySelect.onchange = () => changeMode(personalitySelect.value);

/* ================= START ================= */
window.addEventListener("load", initVRM);

if (history.length === 0) {
  append("waifu", "*looks at you* Hey… I was waiting 💗");
}
