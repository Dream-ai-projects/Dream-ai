/* ================= STATE ================= */
// Replace this with your ACTUAL backend URL when running locally or deploying
const BACKEND_URL = "http://localhost:3000/chat"; 
let history = [];
let personality = "girlfriend";
let memoryEnabled = true;

/* ================= DOM SAFE ================= */
window.addEventListener("DOMContentLoaded", () => {
  
  /* ===== CHAT ===== */
  const chat = document.getElementById("chat");
  const input = document.getElementById("msg");
  const sendBtn = document.getElementById("send-btn");

  function append(role, text) {
    const p = document.createElement("p");
    p.className = role;
    // FIX: Added backticks (`) for template literals
    p.innerHTML = `<b>${role === "user" ? "You" : "Waifu"}:</b> ${text}`;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
  }

  async function sendMsg() {
    const msg = input.value.trim();
    if (!msg) return;

    append("user", msg);
    input.value = "";

    if (memoryEnabled) {
      history.push({ role: "user", content: msg });
    } else {
      history = [{ role: "user", content: msg }];
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
          history,
          mode: personality
        })
      });

      const data = await res.json();
      const reply = data.reply || "...";

      // FIX: Added backticks
      typing.innerHTML = `<b>Waifu:</b> ${reply}`;

      if (memoryEnabled) {
        history.push({ role: "assistant", content: reply });
      }

    } catch (err) {
      typing.innerHTML = "<b>Waifu:</b> connection error 😿";
      console.error(err);
    }
  }

  sendBtn.onclick = sendMsg;
  input.onkeydown = e => {
    if (e.key === "Enter") sendMsg();
  };

  /* ===== SETTINGS ===== */
  const settingsBtn = document.getElementById("settings-btn");
  const settingsPanel = document.getElementById("settings-panel");
  const closeSettings = document.getElementById("close-settings");
  const personalitySelect = document.getElementById("personality-select");
  const memoryToggle = document.getElementById("memory-toggle");

  settingsBtn.onclick = () => {
    settingsPanel.classList.toggle("hidden");
  };

  closeSettings.onclick = () => {
    settingsPanel.classList.add("hidden");
  };

  personalitySelect.onchange = e => {
    personality = e.target.value;
  };

  memoryToggle.onchange = e => {
    memoryEnabled = e.target.checked;
  };

  /* ===== VRM ===== */
  initVRM();
});

/* ================= VRM ================= */
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(30, canvas.clientWidth / canvas.clientHeight, 0.1, 20);
  camera.position.set(0, 1.4, 1.5); // Adjusted camera to see face better
  
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setClearColor(0x000000, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(1, 1, 1);
  scene.add(light);

  // Resize handler
  window.addEventListener("resize", () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  const loader = new THREE.GLTFLoader();
  loader.crossOrigin = "anonymous";

  // Ensure 'oni.vrm' exists in your folder!
  loader.load(
    "./oni.vrm",
    gltf => {
      THREE.VRM.from(gltf).then(v => {
        vrm = v;
        
        vrm.scene.traverse(obj => {
          obj.frustumCulled = false;
        });
        
        // Position tweaks
        vrm.scene.position.set(0, 0, 0);
        vrm.scene.rotation.y = Math.PI; // Rotate 180 to face camera

        scene.add(vrm.scene);
      });
    },
    (progress) => console.log("Loading... " + (progress.loaded / progress.total * 100) + "%"),
    (err) => console.error("❌ VRM LOAD ERROR", err)
  );

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const t = clock.elapsedTime;

  if (vrm) {
    vrm.update(delta);

    const head = vrm.humanoid?.getBoneNode("head");
    if (head) {
      head.rotation.y = Math.sin(t * 0.6) * 0.1;
      head.rotation.x = Math.sin(t * 0.4) * 0.05;
    }

    if (vrm.blendShapeProxy) {
      vrm.blendShapeProxy.setValue(
        THREE.VRM.BlendShapePresetName.Blink,
        Math.sin(t * 3) > 0.98 ? 1 : 0
      );
    }
  }

  renderer.render(scene, camera);
}
