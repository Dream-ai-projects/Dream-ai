const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= CHAT ================= */
let history = JSON.parse(localStorage.getItem("waifu_history")) || [];
let memoryEnabled = localStorage.getItem("memory") !== "off";

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

  if (memoryEnabled) {
    history.push({ role: "user", content: msg });
    localStorage.setItem("waifu_history", JSON.stringify(history));
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
  } catch {
    typing.innerHTML = "<b>Waifu:</b> network error 😿";
  }
}

sendBtn.onclick = sendMsg;
input.onkeydown = e => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMsg();
  }
};

/* ================= VRM (SAFE MODE) ================= */
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");
  if (!canvas) {
    console.error("Canvas not found");
    return;
  }

  /* 🔥 FORCE CANVAS SIZE (CRITICAL) */
  canvas.style.width = "100%";
  canvas.style.height = "400px";

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 1.45, 2.8); // SAFE DISTANCE

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, 400);
  renderer.setClearColor(0x000000, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(1, 2, 3);
  scene.add(dir);

  const loader = new THREE.GLTFLoader();
  loader.load(
    "./oni.vrm",
    gltf => {
      THREE.VRM.from(gltf).then(v => {
        vrm = v;

        /* 🔥 FORCE VISIBILITY */
        vrm.scene.scale.set(1, 1, 1);
        vrm.scene.position.set(0, 0, 0);
        vrm.scene.rotation.y = Math.PI;

        scene.add(vrm.scene);
        console.log("VRM LOADED ✅");
      });
    },
    undefined,
    err => console.error("VRM LOAD ERROR", err)
  );

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  if (vrm) {
    vrm.update(clock.getDelta());

    // very light idle motion (SAFE)
    vrm.scene.rotation.z = Math.sin(clock.elapsedTime) * 0.01;
  }

  renderer.render(scene, camera);
}

window.addEventListener("load", initVRM);

/* ================= GREETING ================= */
if (history.length === 0) {
  append("waifu", "*looks at you* Hey… I’m here 💗");
}
