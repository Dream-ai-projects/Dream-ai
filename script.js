const BACKEND_URL="https://dream-ai-backend-kkkk.onrender.com/chat"; 

let outfits={casual:"outfit1.png",school:"outfit2.png",maid:"outfit6.png",beach:"outfit8.png"};
let backgrounds={A:"bgA.jpg",D:"bgD.jpg",G:"bgG.jpg",E:"bgE.jpg"};
let currentOutfit="casual", currentBG="A";

let history=JSON.parse(localStorage.getItem("history"))||[];

function append(role,text){
    let box=document.getElementById("chat");
    let p=document.createElement("p");
    p.className=role;
    p.innerHTML=`<b>${role=="user"?"You":"Waifu"}:</b> ${text}`;
    box.appendChild(p);
    box.scrollTop=box.scrollHeight;
    speak(text);
}

function speak(t){
    let v=new SpeechSynthesisUtterance(t);
    v.pitch=1.6;v.rate=1.05;v.lang="en-US";
    speechSynthesis.speak(v);
}

async function sendMsg(){
    let input=document.getElementById("msg");
    let msg=input.value.trim();
    if(!msg) return;

    append("user",msg);
    history.push({role:"user",content:msg});
    input.value="";

    append("waifu","Typing...");

    let reply;
    try{
        let res=await fetch(BACKEND_URL,{
            method:"POST",
            headers:{ "Content-Type":"application/json"},
            body:JSON.stringify({history})
        });
        let data=await res.json();
        reply=data.reply;
    }catch{
        reply="Hmm network being naughty again >_<";
    }

    history.push({role:"assistant",content:reply});
    document.querySelectorAll(".waifu").pop().innerHTML="<b>Waifu:</b> "+reply;
    localStorage.setItem("history",JSON.stringify(history));
}

function mic(){
 let r=new (window.SpeechRecognition||webkitSpeechRecognition)();
 r.lang="en-US";
 r.onresult=e=>{
   document.getElementById("msg").value=e.results[0][0].transcript;
   sendMsg();
 };
 r.start();
}

document.getElementById("send-btn").onclick=sendMsg;
document.getElementById("mic-btn").onclick=mic;
document.getElementById("msg").onkeypress=e=>{if(e.key==="Enter")sendMsg();};

append("waifu","*leans close* Missed you… come here darling~ uwu 💞");
