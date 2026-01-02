/* ================= BACKEND ================= */
const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= CHAT ================= */
let history = JSON.parse(localStorage.getItem("history")) || [];

function append(role,text){
  const chat=document.getElementById("chat");
  const p=document.createElement("p");
  p.className=role;
  p.innerHTML=`<b>${role==="user"?"You":"Waifu"}:</b> ${text}`;
  chat.appendChild(p);
  chat.scrollTop=chat.scrollHeight;
}

async function sendMsg(){
  const input=document.getElementById("msg");
  const msg=input.value.trim();
  if(!msg) return;

  append("user",msg);
  history.push({role:"user",content:msg});
  input.value="";

  const typing=document.createElement("p");
  typing.className="waifu";
  typing.innerHTML="<i>Typing…</i>";
  document.getElementById("chat").appendChild(typing);

  let reply="...";
  try{
    const res=await fetch(BACKEND_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({history})
    });
    const data=await res.json();
    reply=data.reply || "...";
  }catch(e){
    reply="Connection error.";
  }

  typing.innerHTML=`<b>Waifu:</b> ${reply}`;
  history.push({role:"assistant",content:reply});
  localStorage.setItem("history",JSON.stringify(history));
}

document.getElementById("send-btn").onclick=sendMsg;
document.getElementById("msg").onkeypress=e=>{
  if(e.key==="Enter") sendMsg();
};

/* ================= VOICE INPUT ================= */
document.getElementById("mic-btn").onclick=()=>{
  const R=window.SpeechRecognition||webkitSpeechRecognition;
  if(!R) return alert("Voice not supported");
  const r=new R();
  r.lang="en-US";
  r.onresult=e=>{
    document.getElementById("msg").value=e.results[0][0].transcript;
    sendMsg();
  };
  r.start();
};

/* ================= VRM ================= */
let scene,camera,renderer,vrm;

function initVRM(){
  const canvas=document.getElementById("vrm-canvas");

  scene=new THREE.Scene();

  camera=new THREE.PerspectiveCamera(
    30,
    canvas.clientWidth/canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0,1.4,2.2);

  renderer=new THREE.WebGLRenderer({
    canvas,
    alpha:true,
    antialias:true
  });
  renderer.setSize(canvas.clientWidth,canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  scene.add(new THREE.AmbientLight(0xffffff,0.7));
  const light=new THREE.DirectionalLight(0xffffff,1.2);
  light.position.set(1,2,3);
  scene.add(light);

  const loader=new THREE.GLTFLoader();
  loader.load(
    "oni.vrm",
    gltf=>{
      THREE.VRMUtils.removeUnnecessaryVertices(gltf.scene);
      THREE.VRMUtils.removeUnnecessaryJoints(gltf.scene);
      THREE.VRM.from(gltf).then(v=>{
        vrm=v;
        vrm.scene.rotation.y=Math.PI;
        scene.add(vrm.scene);
      });
    },
    undefined,
    e=>console.error(e)
  );

  animate();
}

function animate(){
  requestAnimationFrame(animate);
  if(vrm) vrm.update(0.016);
  renderer.render(scene,camera);
}

window.addEventListener("load",initVRM);
