const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ===== CHAT ===== */
let history = [];

const chat = document.getElementById("chat");
const input = document.getElementById("msg");

function append(role,text){
  const p=document.createElement("p");
  p.className=role;
  p.innerHTML=`<b>${role==="user"?"You":"Waifu"}:</b> ${text}`;
  chat.appendChild(p);
  chat.scrollTop=chat.scrollHeight;
}

async function sendMsg(){
  const msg=input.value.trim();
  if(!msg) return;

  append("user",msg);
  input.value="";

  const typing=document.createElement("p");
  typing.className="waifu";
  typing.innerHTML="<i>Typing…</i>";
  chat.appendChild(typing);

  try{
    const res=await fetch(BACKEND_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message:msg})
    });
    const data=await res.json();
    typing.innerHTML=`<b>Waifu:</b> ${data.reply || "..."}`;
  }catch(e){
    typing.innerHTML="<b>Waifu:</b> Backend error";
  }
}

document.getElementById("send-btn").addEventListener("click",sendMsg);
input.addEventListener("keydown",e=>{
  if(e.key==="Enter") sendMsg();
});

/* ===== VRM ===== */
let scene,camera,renderer,vrm;

function initVRM(){
  const canvas=document.getElementById("vrm-canvas");

  scene=new THREE.Scene();

  camera=new THREE.PerspectiveCamera(30,1,0.1,100);
  camera.position.set(0,1.4,2.2);

  renderer=new THREE.WebGLRenderer({
    canvas,
    alpha:true,
    antialias:true
  });

  const resize=()=>{
    const w=canvas.clientWidth;
    const h=canvas.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize",resize);

  scene.add(new THREE.AmbientLight(0xffffff,0.8));
  const light=new THREE.DirectionalLight(0xffffff,1);
  light.position.set(1,2,3);
  scene.add(light);

  const loader=new THREE.GLTFLoader();
  loader.load(
    "./oni.vrm",
    gltf=>{
      THREE.VRM.from(gltf).then(v=>{
        vrm=v;
        vrm.scene.rotation.y=Math.PI;
        scene.add(vrm.scene);
      });
    },
    undefined,
    err=>console.error("VRM LOAD ERROR",err)
  );

  animate();
}

function animate(){
  requestAnimationFrame(animate);
  if(vrm) vrm.update(0.016);
  renderer.render(scene,camera);
}

window.addEventListener("load",initVRM);
