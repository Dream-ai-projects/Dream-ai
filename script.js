const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= CHAT ================= */
let history = [];

const chat = document.getElementById("chat");
const input = document.getElementById("msg");

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
    typing.innerHTML = "<b>Waifu:</b> Backend error";
  }
}

document.getElementById("send-btn").addEventListener("click", sendMsg);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMsg();
});

/* ================= VRM ================= */
let scene, camera, renderer, vrm;
let clock = new THREE.Clock();

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.45, 2.1); // PERFECT BODY FRAME

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  // 🔥 SHARPNESS FIX (GOODBYE 360p)
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h);
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

        // ❗ LOCK POSITION – NO MORE FALLING
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

  if (vrm) {
    vrm.update(delta);

    const humanoid = vrm.humanoid;

    // 💓 IDLE BODY MOTION (NO FLOATING)
    const spine = humanoid.getBoneNode("spine");
    const chest = humanoid.getBoneNode("chest");

    if (spine && chest) {
      spine.rotation.y = Math.sin(t * 0.5) * 0.05;
      chest.rotation.x = Math.sin(t * 0.7) * 0.04;
    }

    // ✋ RELAX ARMS (GOODBYE MANNEQUIN)
    const lArm = humanoid.getBoneNode("leftUpperArm");
    const rArm = humanoid.getBoneNode("rightUpperArm");

    if (lArm && rArm) {
      lArm.rotation.z = Math.sin(t * 0.8) * 0.1 - 0.3;
      rArm.rotation.z = -Math.sin(t * 0.8) * 0.1 + 0.3;
    }

    // 👀 BLINKING (HOT BUT SAFE)
    const blink = (Math.sin(t * 3) + 1) / 2;
    vrm.expressionManager.setValue("blink", blink > 0.96 ? 1 : 0);
  }

  renderer.render(scene, camera);
}

window.addEventListener("load", initVRM);
