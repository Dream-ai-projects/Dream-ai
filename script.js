/* ================= CONFIG ================= */
const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= STATE ================= */
let scene, camera, renderer, vrm;
let clock = new THREE.Clock();
let isTalking = false;
let currentMood = "neutral";
let history = JSON.parse(localStorage.getItem("memory")) || [];

/* ================= DEBUG ================= */
function log(msg) {
  const el = document.getElementById("debug-log");
  if (el) el.innerText = "Status: " + msg;
}

/* ================= INIT ================= */
init();
document.getElementById("send-btn").onclick = handleChat;

function init() {
  log("Initializing scene…");

  const canvas = document.getElementById("vrm-canvas");

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  );
  camera.position.set(0, 1.4, 2.3);

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* LIGHT */
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(1, 2, 3);
  scene.add(dir);

  /* RESIZE */
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  loadVRM();
  animate();
}

/* ================= VRM LOAD ================= */
function loadVRM() {
  log("Loading oni.vrm…");

  const loader = new THREE.GLTFLoader();
  loader.load(
    "./oni.vrm",
    (gltf) => {
      THREE.VRM.from(gltf).then((v) => {
        vrm = v;

        THREE.VRMUtils.removeUnnecessaryJoints(vrm.scene);

        vrm.scene.scale.set(1, 1, 1);
        vrm.scene.position.set(0, 0.9, 0); // 🔥 KEY FIX
        vrm.scene.rotation.y = Math.PI;

        scene.add(vrm.scene);

        log("✅ VRM Ready");
        setTimeout(() => {
          const d = document.getElementById("debug-log");
          if (d) d.classList.add("hidden");
        }, 2000);
      });
    },
    (p) => {
      if (p.total) {
        log(`Loading ${Math.round((p.loaded / p.total) * 100)}%`);
      }
    },
    (e) => {
      log("❌ VRM Load Failed");
      console.error(e);
    }
  );
}

/* ================= ANIMATION LOOP ================= */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const t = clock.elapsedTime;

  if (vrm) {
    vrm.update(delta);

    const humanoid = vrm.humanoid;
    if (humanoid) {
      const spine = humanoid.getBoneNode(
        THREE.VRMSchema.HumanoidBoneName.Spine
      );
      const chest = humanoid.getBoneNode(
        THREE.VRMSchema.HumanoidBoneName.Chest
      );
      const head = humanoid.getBoneNode(
        THREE.VRMSchema.HumanoidBoneName.Head
      );

      if (spine) spine.rotation.y = Math.sin(t * 0.4) * 0.04;
      if (chest) chest.rotation.x = Math.sin(t * 0.6) * 0.03;
      if (head) head.rotation.y = Math.sin(t * 0.5) * 0.05;
    }

    /* BLINK */
    if (vrm.blendShapeProxy) {
      const blink =
        Math.sin(t * 3) > 0.97 ? 1 : 0;
      vrm.blendShapeProxy.setValue(
        THREE.VRM.BlendShapePresetName.Blink,
        blink
      );

      vrm.blendShapeProxy.setValue(
        THREE.VRM.BlendShapePresetName.A,
        isTalking ? Math.abs(Math.sin(t * 12)) * 0.8 : 0
      );
    }

    /* SPRING SAFE */
    if (vrm.springBoneManager) {
      const wind = Math.sin(t * 0.5) * 0.02;
      vrm.springBoneManager.springBodies.forEach((s) => {
        s.externalForce.set(wind, 0, 0);
      });
    }
  }

  renderer.render(scene, camera);
}

/* ================= CHAT ================= */
async function handleChat() {
  const input = document.getElementById("msg");
  const text = input.value.trim();
  const mode = document.getElementById("pers-select")?.value || "horny";
  if (!text) return;

  appendChat("user", text);
  input.value = "";
  history.push({ role: "user", content: text });

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, mode })
    });

    const data = await res.json();
    const reply = data.reply || "...";

    currentMood = data.mood || "neutral";
    appendChat("waifu", reply);
    speak(reply);

    history.push({ role: "assistant", content: reply });
    localStorage.setItem("memory", JSON.stringify(history.slice(-20)));
  } catch (e) {
    appendChat("waifu", "Connection problem…");
    console.error(e);
  }
}

/* ================= UI ================= */
function appendChat(role, text) {
  const c = document.getElementById("chat-container");
  const p = document.createElement("p");
  p.className = role;
  p.innerHTML = `<b>${role === "user" ? "You" : "Waifu"}:</b> ${text}`;
  c.appendChild(p);
  c.scrollTop = c.scrollHeight;
}

function speak(text) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = 1.3;
  u.onstart = () => (isTalking = true);
  u.onend = () => (isTalking = false);
  speechSynthesis.speak(u);
}

/* ================= SETTINGS ================= */
function toggleSettings() {
  document.getElementById("settings-menu").classList.toggle("hidden");
}
function clearMemory() {
  localStorage.clear();
  location.reload();
}
