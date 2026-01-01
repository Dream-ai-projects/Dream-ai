/* ================= CONFIG ================= */
const BACKEND_URL = "https://dream-ai-backend-kkkk.onrender.com/chat";

/* ================= OUTFITS / BACKGROUNDS ================= */
let outfits = {
    casual:"outfit1.png",
    school:"outfit2.png",
    maid:"outfit6.png",
    beach:"outfit8.png"
};

let backgrounds = {
    A:"bgA.jpg",
    D:"bgD.jpg",
    G:"bgG.jpg",
    E:"bgE.jpg"
};

let currentOutfit="casual", currentBG="A";

/* ================= CHAT MEMORY ================= */
let history = JSON.parse(localStorage.getItem("history")) || [
    {
        role:"system",
        content:"You are a cute anime waifu girlfriend. Respond with emotions, flirty tone, cute moans like *moa~ uwu nya~*. No AI talk. You feel real."
    }
];

/* ================= UI APPEND ================= */
function append(role,text){
    const box = document.getElementById("chat");
    const p = document.createElement("p");
    p.className = role;
    p.innerHTML = `<b>${role==="user"?"You":"Waifu"}:</b> ${text}`;
    box.appendChild(p);
    box.scrollTop = box.scrollHeight;
}

/* ================= VOICE OUTPUT ================= */
function speak(text){
    let utter = new SpeechSynthesisUtterance(text);
    utter.pitch = 1.6;
    utter.rate = 1.05;
    utter.lang = "en-US";
    window.speechSynthesis.speak(utter);
}

/* ================= SEND MESSAGE ================= */
async function sendMsg(){
    const input = document.getElementById("msg");
    const msg = input.value.trim();

    // First greeting / empty message
    if(!msg && history.length>1) return;

    if(msg) append("user",msg);
    history.push({role:"user",content:msg});
    localStorage.setItem("history",JSON.stringify(history));
    if(input) input.value="";

    // Typing bubble
    const chatBox = document.getElementById("chat");
    const typingBubble = document.createElement("p");
    typingBubble.className="waifu";
    typingBubble.innerHTML="<i>Typing...</i>";
    chatBox.appendChild(typingBubble);
    chatBox.scrollTop = chatBox.scrollHeight;

    let reply;
    try{
        const res = await fetch(BACKEND_URL,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({history})
        });
        const data = await res.json();
        reply = data.reply || "*blushes* …moa~";
    }catch(err){
        reply="Aww… network is teasing me >_<";
    }

    typingBubble.innerHTML = `<b>Waifu:</b> ${reply}`;
    speak(reply);

    history.push({role:"assistant",content:reply});
    localStorage.setItem("history",JSON.stringify(history));
}

/* ================= VOICE INPUT ================= */
function mic(){
    const rec = new (window.SpeechRecognition||webkitSpeechRecognition)();
    rec.lang = "en-US";
    rec.onresult = e => {
        document.getElementById("msg").value = e.results[0][0].transcript;
        sendMsg();
    };
    rec.start();
}

/* ================= MINI GAMES ================= */
function diceGame(){ append("waifu","*rolls dice* You got "+(1+Math.floor(Math.random()*6))+" nya~"); }
function hugWaifu(){ append("waifu","*wraps arms around you softly* uwu~"); }
function kissWaifu(){ append("waifu","*kisses your cheek slowly* 💋 moa~"); }
function triviaGame(){ append("waifu","Tell me cutie, what's 9+10? 👀"); }

/* ================= AUTO OUTFIT / BACKGROUND ================= */
function updateLook(){
    const hour = new Date().getHours();
    if(hour<12) currentOutfit="casual", currentBG="A";
    else if(hour<18) currentOutfit="school", currentBG="D";
    else if(hour<22) currentOutfit="maid", currentBG="G";
    else currentOutfit="beach", currentBG="E";

    document.getElementById("avatar").src = outfits[currentOutfit];
    document.getElementById("avatar-box").style.backgroundImage = `url(${backgrounds[currentBG]})`;
}
updateLook();

/* ================= EVENTS ================= */
document.getElementById("send-btn").onclick = sendMsg;
document.getElementById("mic-btn").onclick = mic;
document.getElementById("msg").onkeypress = e => { if(e.key==="Enter") sendMsg(); };
