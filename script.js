/* ================= STATE ================= */
const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com"; 
let history = [];
let personality = "girlfriend";
let memoryEnabled = true;

// Current Mood State
let currentMood = "neutral";

/* ================= DOM EVENTS ================= */
window.addEventListener("DOMContentLoaded", () => {
  
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

    // Add to history
    if (memoryEnabled) history.push({ role: "user", content: msg });
    else history = [{ role: "user", content: msg }];

    const typing = document.createElement("p");
    typing.className = "waifu";
    typing.innerHTML = "<i>Typing…</i>";
    chat.appendChild(typing);

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, mode: personality })
      });

      const data = await res.json();
      const reply = data.reply || "...";
      
      // 🔥 UPDATE MOOD HERE
      if (data.mood) {
        console.log("Switching mood to:", data.mood);
        currentMood = data.mood; 
      }

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
  input.onkeydown = e => { if (e.key === "Enter") sendMsg(); };

  /* SETTINGS HANDLERS */
  document.getElementById("settings-btn").onclick = () => 
    document.getElementById("settings-panel").classList.toggle("hidden");
  document.getElementById("close-settings").onclick = () => 
    document.getElementById("settings-panel").classList.add("hidden");
  document.getElementById("personality-select").onchange = e => personality = e.target.value;
  document.getElementById("memory-toggle").onchange = e => memoryEnabled = e.target.checked;

  /* START 3D */
  initVRM();
});

/* ================= 3D & ANIMATION ENGINE ================= */
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

// Bone References
let bones = {
  neck: null,
  head: null,
  leftArm: null,
  rightArm: null,
  spine: null
};

// Animation Config
const MOODS = {
  neutral: {
    armRotation: 75, // degrees down
    headTilt: 0,
    blinkSpeed: 3,
    expression: "neutral"
  },
  happy: {
    armRotation: 60, // arms slightly wider
    headTilt: -0.1,  // slight tilt
    blinkSpeed: 5,
    expression: "fun"
  },
  excited: {
    armRotation: 45, // arms open
    headTilt: -0.2,
    blinkSpeed: 8,
    expression: "joy"
  },
  shy: {
    armRotation: 80, // arms tight to body
    headTilt: 0.2,   // looking down/away
    blinkSpeed: 2,
    expression: "sorrow" // usually looks shy/sad
  }
};

function initVRM() {
  const canvas = document.getElementById("vrm-canvas");

  scene = new THREE.Scene();
  
  // Camera Setup
  camera = new THREE.PerspectiveCamera(30, canvas.clientWidth / canvas.clientHeight, 0.1, 20);
  camera.position.set(0, 1.4, 1.45); // Eye level
  
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1.1);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  // Load Model
  const loader = new THREE.GLTFLoader();
  loader.crossOrigin = "anonymous";
  loader.load("./oni.vrm", (gltf) => {
    THREE.VRM.from(gltf).then((v) => {
      vrm = v;
      scene.add(vrm.scene);

      // 🔥 STOP ROTATION: Face forward
      vrm.scene.rotation.y = Math.PI; 

      // Get Bones
      bones.neck = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Neck);
      bones.head = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Head);
      bones.leftArm = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.LeftUpperArm);
      bones.rightArm = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.RightUpperArm);
      bones.spine = vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Spine);

      // Initial Un-T-Pose
      resetPose();
      
      console.log("VRM Loaded & Animated");
    });
  });

  animate();
}

function resetPose() {
  if(!bones.leftArm) return;
  // Force arms down immediately so we don't see T-pose
  bones.leftArm.rotation.z = Math.PI / 2.5; 
  bones.rightArm.rotation.z = -Math.PI / 2.5;
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const t = clock.elapsedTime;

  if (vrm) {
    vrm.update(delta);

    // --- PROCEDURAL ANIMATION SYSTEM --- //
    
    // 1. Get Target Mood
    const target = MOODS[currentMood] || MOODS.neutral;
    const rad = Math.PI / 180;

    // 2. Breathing (Sine Wave on Spine & Neck)
    // We keep this always running to make her look alive
    const breath = Math.sin(t * 1.5); 
    if (bones.spine) bones.spine.rotation.x = breath * 0.03; 
    if (bones.neck) bones.neck.rotation.x = breath * 0.03; 

    // 3. Smooth Arm Movement (Interpolation)
    if (bones.leftArm && bones.rightArm) {
      // Lerp current rotation to target rotation
      // Arms Z-axis: Positive is Down for Left, Negative is Down for Right
      const currentL = bones.leftArm.rotation.z;
      const targetL = target.armRotation * rad;
      
      bones.leftArm.rotation.z += (targetL - currentL) * 0.05; // 0.05 is speed
      bones.rightArm.rotation.z = -bones.leftArm.rotation.z;
    }

    // 4. Head Tilt (Mood based)
    if (bones.head) {
        // Mix breathing movement + mood tilt
        const currentTilt = bones.head.rotation.z;
        const targetTilt = target.headTilt;
        bones.head.rotation.z += (targetTilt - currentTilt) * 0.05;
        
        // Subtle idle sway
        bones.head.rotation.y = Math.sin(t * 0.5) * 0.05; 
    }

    // 5. Facial Expressions (BlendShapes)
    // Reset all emotions first (simplified)
    vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.Joy, 0);
    vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.Sorrow, 0);
    vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.Fun, 0);

    // Apply current mood expression
    if(target.expression === "joy") 
        vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.Joy, 1);
    else if(target.expression === "sorrow") 
        vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.Sorrow, 1);
    else if(target.expression === "fun") 
        vrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.Fun, 1);

    // 6. Blinking
    const blinkVal = Math.sin(t * target.blinkSpeed);
    vrm.blendShapeProxy.setValue(
      THREE.VRMSchema.BlendShapePresetName.Blink,
      blinkVal > 0.95 ? 1 : 0 // Sharp blink
    );
  }

  renderer.render(scene, camera);
}
