/* ================= CONFIG ================= */
const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= OUTFITS / BACKGROUNDS ================= */
let outfits = {
    casual:"outfit1.png",
    school:"outfit2.png",
    maid:"outfit6.png",
    beach:"outfit8.png",
};

let backgrounds = {
    A:"bgA.jpg",
    D:"bgD.jpg",
    G:"bgG.jpg",
    E:"bgE.jpg",
};

let currentOutfit="casual", currentBG="A";

/* ================= CHAT MEMORY ================= */
let history = JSON.parse(localStorage.getItem("history")) || [
{role:"system", content:"You are a cute anime waifu girlfriend. Respond with emotions, flirty tone, cute moans like *moa~ uwu nya~*. No AI talk. You feel real."}
];

/* ================= UI ================= */
function append(role,text){
    let box=document.getElementById("chat");
    let p=document.createElement("p");
    p.className=role;
    p.innerHTML=`<b>${role=="user"?"You":"Waifu"}:</b> ${text}`;
    box.appendChild(p);
    box.scrollTop=box.scrollHeight;
}

/* ================= WAIFU VOICE ================= */
function speak(t){
    let v=new SpeechSynthesisUtterance(t);
    v.pitch=1.6; v.rate=1.05; v.lang="en-US";
    speechSynthesis.speak(v);
}

/* ================= SEND MESSAGE ================= */
async function sendMsg(){
    let input=document.getElementById("msg");
    let msg=input.value.trim();
    if(!msg) return;

    append("user",msg);
    history.push({role:"user",content:msg});
    localStorage.setItem("history",JSON.stringify(history));
    input.value="";

    // create typing bubble
    let chatBox=document.getElementById("chat");
    let typingBubble=document.createElement("p");
    typingBubble.className="waifu";
    typingBubble.innerHTML="<i>Typing...</i>";
    chatBox.appendChild(typingBubble);
    chatBox.scrollTop=chatBox.scrollHeight;

    let reply;
    try{
        let res=await fetch(BACKEND_URL,{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body:JSON.stringify({history})
        });
        let data=await res.json();
        reply = data.reply || "*blushes* …moa~";
    }catch{
        reply="Aww… network is teasing me again >_<";
    }

    // Update typing bubble with real reply
    typingBubble.innerHTML="<b>Waifu:</b> "+reply;
    speak(reply);

    history.push({role:"assistant",content:reply});
    localStorage.setItem("history",JSON.stringify(history));
}

/* ================= VOICE INPUT ================= */
function mic(){
    let r=new (window.SpeechRecognition||webkitSpeechRecognition)();
    r.lang="en-US";
    r.onresult=e=>{
        document.getElementById("msg").value=e.results[0][0].transcript;
        sendMsg();
    };
    r.start();
}

/* ================= MINI GAMES ================= */
function diceGame(){append("waifu","*rolls dice* You got "+(1+Math.random()*6|0)+" nya~","waifu");}
function hugWaifu(){append("waifu","*wraps arms around you softly* uwu~","waifu");}
function kissWaifu(){append("waifu","*kisses your cheek slowly* 💋 moa~","waifu");}
function triviaGame(){append("waifu","Tell me cutie, what's 9+10? 👀","waifu");}

/* ================= AUTO LOOK CHANGE ================= */
function updateLook(){
    let h=new Date().getHours();
    if(h<12) currentOutfit="casual", currentBG="A";
    else if(h<18) currentOutfit="school", currentBG="D";
    else if(h<22) currentOutfit="maid", currentBG="G";
    else currentOutfit="beach", currentBG="E";

    document.getElementById("avatar").src=outfits[currentOutfit];
    document.getElementById("avatar-box").style.backgroundImage=`url(${backgrounds[currentBG]})`;
}
updateLook();

/* ================= EVENTS ================= */
document.getElementById("send-btn").onclick=sendMsg;
document.getElementById("mic-btn").onclick=mic;
document.getElementById("msg").onkeypress=e=>{if(e.key==="Enter")sendMsg();};

/* ================= GREETING ================= */
append("waifu","*leans close* Missed you… come here darling~ uwu 💞");
