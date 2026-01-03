const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= CHAT ================= */
let history = JSON.parse(localStorage.getItem("waifu_history")) || [];

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
  input.blur();

  history.push({ role: "user", content: msg });
  localStorage.setItem("waifu_history", JSON.stringify(history));

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
    localStorage.setItem("waifu_history", JSON.stringify(history));
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

// Blink
let blinkTimer = 0;
function blink(delta) {
  if (!vrm?.blendShapeProxy) return;
  blinkTimer += delta;
  if (blinkTimer > 4) {
    vrm.blendShapeProxy.setValue(
      THREE.VRM.BlendShapePresetName.Blink,
      1
    );
    setTimeout(() => {
      vrm.blendShapeProxy.setValue(
        THREE.VRM.BlendShapePresetName.Blink,
        0
      );
    }, 120);
    blinkTimer = 0;
  }
}

// Idle rotation ONLY (no Y movement)
function idleMotion() {
  if (!vrm) return;
  const t = Date.now() * 0.001;
  vrm.scene.rotation.y = Math.PI + Math.sin(t) * 0.02;

  const spine = vrm.humanoid?.getBoneNode(
    THREE.VRMSchema.HumanoidBoneName.Spine
  );
  if (spine) spine.rotation.x = Math.sin(t) * 0.03;
}

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 2.0, 2.8); // 🔥 FIX
  camera.lookAt(0, 1.6, 0);         // 🔥 FIX

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setClearColor(0x000000, 0);

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

      vrm.scene.position.set(0, 0, 0); // 🚨 DO NOT TOUCH Y
      vrm.scene.rotation.y = Math.PI;
      vrm.scene.scale.set(1, 1, 1);

      scene.add(vrm.scene);
    });
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (vrm) {
    blink(delta);
    idleMotion();
    vrm.update(delta);
  }
  renderer.render(scene, camera);
}

window.addEventListener("load", initVRM);

/* ================= GREETING ================= */
if (history.length === 0) {
  append("waifu", "*smiles softly* Hey… I was waiting 💗");
}
