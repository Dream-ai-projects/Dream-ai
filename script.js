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

  // show user message
  append("user", msg);
  input.value = "";
  input.blur(); // mobile fix

  // save user msg
  history.push({ role: "user", content: msg });
  localStorage.setItem("waifu_history", JSON.stringify(history));

  // typing indicator
  const typing = document.createElement("p");
  typing.className = "waifu";
  typing.innerHTML = "<i>Typing…</i>";
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        history: history
      })
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

/* ===== PERSONALITY MODE (SETTINGS READY) ===== */
/* call changeMode("girlfriend" | "waifu" | "horny") */
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

/* ===== VRM ===== */
let scene, camera, renderer, vrm;

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");
  if (!canvas || !window.THREE) return;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.4, 2.2);

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

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
        scene.add(vrm.scene);
      });
    },
    undefined,
    err => console.error("VRM LOAD ERROR", err)
  );

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (vrm) vrm.update(0.016);
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

window.addEventListener("load", initVRM);

/* ===== GREETING ===== */
if (history.length === 0) {
  append("waifu", "*looks at you* Hey… I was waiting 💗");
}
