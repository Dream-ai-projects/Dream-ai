const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= CHAT ================= */
let history = JSON.parse(localStorage.getItem("history")) || [];

function append(role, text){
  const chat = document.getElementById("chat");
  const p = document.createElement("p");
  p.className = role;
  p.innerHTML = `<b>${role==="user"?"You":"Waifu"}:</b> ${text}`;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMsg(){
  const input = document.getElementById("msg");
  const text = input.value.trim();
  if(!text) return;

  append("user", text);
  history.push({ role:"user", content:text });
  input.value = "";

  const typing = document.createElement("p");
  typing.className = "waifu";
  typing.innerHTML = "<i>Typing...</i>";
  chat.appendChild(typing);

  try{
    const res = await fetch(BACKEND_URL,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ history })
    });

    const data = await res.json();
    typing.innerHTML = `<b>Waifu:</b> ${data.reply}`;
    history.push({ role:"assistant", content:data.reply });
    localStorage.setItem("history", JSON.stringify(history));
  }catch{
    typing.innerHTML = "Connection failed.";
  }
}

/* ================= EVENTS ================= */
send-btn.onclick = sendMsg;
msg.onkeydown = e => e.key==="Enter" && sendMsg();

/* ================= VOICE ================= */
mic-btn.onclick = ()=>{
  const r = new (SpeechRecognition||webkitSpeechRecognition)();
  r.lang="en-US";
  r.onresult = e=>{
    msg.value = e.results[0][0].transcript;
    sendMsg();
  };
  r.start();
};

/* ================= VRM SETUP ================= */
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(30,1,0.1,100);
camera.position.set(0,1.4,2.5);

let renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("vrm-canvas"),
  alpha:true
});
renderer.setSize(220,320);
renderer.setPixelRatio(window.devicePixelRatio);

scene.add(new THREE.DirectionalLight(0xffffff,1).position.set(1,1,1));
scene.add(new THREE.AmbientLight(0xffffff,0.6));

let currentVRM;

new THREE.GLTFLoader().load(
  "vrm/havewaifu.vrm",
  gltf=>{
    THREE.VRMUtils.removeUnnecessaryVertices(gltf.scene);
    THREE.VRMUtils.removeUnnecessaryJoints(gltf.scene);

    THREE.VRM.from(gltf).then(vrm=>{
      currentVRM = vrm;
      scene.add(vrm.scene);
      vrm.scene.rotation.y = Math.PI;
    });
  }
);

function animate(){
  requestAnimationFrame(animate);
  if(currentVRM){
    currentVRM.update(0.016);
  }
  renderer.render(scene,camera);
}
animate();
