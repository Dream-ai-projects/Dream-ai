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

/* ===== MOOD DETECTOR ===== */
function detectMood(text) {
  const t = text.toLowerCase();
  if (/love|yay|hehe|happy|cute/.test(t)) return "happy";
  if (/shy|blush|umm|embarrass/.test(t)) return "shy";
  if (/angry|mad|annoyed|huh/.test(t)) return "angry";
  if (/sad|miss|lonely|sorry/.test(t)) return "sad";
  return "idle";
}

/* ===== SEND MESSAGE ===== */
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
  chat.scrollTop = chat.scrollHeight;

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        history,
        mode: "girlfriend"
      })
    });

    const data = await res.json();
    const reply = data.reply || "...";

    typing.innerHTML = `<b>Waifu:</b> ${reply}`;
    history.push({ role: "assistant", content: reply });

    // 🎭 detect mood from reply
    currentMood = detectMood(reply);

  } catch {
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

/* ================= VRM ================= */
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.45, 2.2); // PERFECT framing

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  // 🔥 sharp rendering (no 360p)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function resize() {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 400;
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

        // ❗ HARD LOCK POSITION (NO FALLING)
        vrm.scene.position.set(0, 0, 0);
        vrm.scene.rotation.y = Math.PI;

        scene.add(vrm.scene);
      });
    },
    undefined,
    err => console.error("VRM LOAD ERROR", err)
  );

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
  const lArm = h.getBoneNode("leftUpperArm");
  const rArm = h.getBoneNode("rightUpperArm");

  // RESET every frame (kills T-pose stiffness)
  [spine, chest, head, lArm, rArm].forEach(b => {
    if (b) b.rotation.set(0, 0, 0);
  });

  /* ===== MOOD ANIMATIONS ===== */

  // IDLE
  if (currentMood === "idle") {
    chest.rotation.x = Math.sin(t * 0.8) * 0.04;
    spine.rotation.y = Math.sin(t * 0.5) * 0.03;
  }

  // HAPPY
  if (currentMood === "happy") {
    chest.rotation.x = Math.sin(t * 2) * 0.1;
    lArm.rotation.z = -0.6;
    rArm.rotation.z = 0.6;
  }

  // SHY
  if (currentMood === "shy") {
    head.rotation.x = 0.25;
    head.rotation.y = Math.sin(t) * 0.15;
    lArm.rotation.z = -0.3;
    rArm.rotation.z = 0.3;
  }

  // ANGRY
  if (currentMood === "angry") {
    spine.rotation.x = -0.15;
    lArm.rotation.x = -0.6;
    rArm.rotation.x = -0.6;
  }

  // SAD
  if (currentMood === "sad") {
    head.rotation.x = 0.35;
    chest.rotation.x = -0.1;
  }

  // 👀 blinking
  vrm.expressionManager.setValue(
    "blink",
    Math.sin(t * 3) > 0.97 ? 1 : 0
  );

  renderer.render(scene, camera);
}

window.addEventListener("load", initVRM);

/* ===== MIC PLACEHOLDER ===== */
document.getElementById("mic-btn").onclick = () => {
  append("waifu", "*giggles* voice soon~");
};

/* ===== GREETING ===== */
append("waifu", "*smiles softly* Hi… I’m here 💗");
