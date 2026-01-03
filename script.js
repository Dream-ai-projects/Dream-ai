const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= CHAT MEMORY ================= */
let history = JSON.parse(localStorage.getItem("waifu_history")) || [];

/* ================= DOM ================= */
const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send-btn");

/* ================= CHAT UI ================= */
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

sendBtn.addEventListener("click", sendMsg);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMsg();
  }
});

/* ================= VRM SETUP ================= */
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");
  if (!canvas) return;

  scene = new THREE.Scene();

  /* 🔥 CAMERA FIX (SEE MORE BODY) */
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.35, 2.6); // farther back
  camera.lookAt(0, 1.2, 0);

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setClearColor(0x000000, 0);

  function resize() {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 420;
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
  loader.load(
    "./oni.vrm",
    gltf => {
      THREE.VRM.from(gltf).then(v => {
        vrm = v;

        /* 🔒 LOCK BODY (STOP SWIMMING) */
        vrm.scene.position.set(0, 0, 0);
        vrm.scene.rotation.set(0, Math.PI, 0);
        vrm.scene.scale.set(1, 1, 1);

        // HARD LOCK ROOT
        if (vrm.humanoid) {
          const hips = vrm.humanoid.getBoneNode("hips");
          if (hips) {
            hips.position.set(0, 0, 0);
          }
        }

        scene.add(vrm.scene);
      });
    },
    undefined,
    err => console.error("VRM LOAD ERROR", err)
  );

  animate();
}

/* ================= BLINKING ================= */
let blinkTimer = 0;
let nextBlink = 2 + Math.random() * 3;

function handleBlink(delta) {
  if (!vrm || !vrm.expressionManager) return;

  blinkTimer += delta;

  if (blinkTimer > nextBlink) {
    vrm.expressionManager.setValue("blink", 1);

    setTimeout(() => {
      vrm.expressionManager.setValue("blink", 0);
    }, 120);

    blinkTimer = 0;
    nextBlink = 2 + Math.random() * 4;
  }
}

/* ================= ANIMATION LOOP ================= */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (vrm) {
    vrm.update(delta);
    handleBlink(delta);
  }

  renderer.render(scene, camera);
}

window.addEventListener("load", initVRM);

/* ================= GREETING ================= */
if (history.length === 0) {
  append("waifu", "*looks up at you* Hey… you’re here 💗");
}
