const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Modelos de respaldo (prueba en este orden)
const MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash-lite"
];

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const voiceBtn = document.getElementById("voice");
const analyzeBtn = document.getElementById("analyze");

function addMessage(text, type = "ai") {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.innerHTML = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function askGemini(prompt) {
  for (let model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.error) {
        console.warn(`Error con ${model}:`, data.error.message);
        continue; // Prueba el siguiente modelo
      }

      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      console.warn(`Falló ${model}:`, err.message);
      continue;
    }
  }

  return `⚠️ Se agotó la cuota de todos los modelos gratuitos.<br><br>
  Espera unos minutos o revisa tu cuota aquí:<br>
  <a href="https://aistudio.google.com/" target="_blank">Google AI Studio</a>`;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  addMessage("Pensando...", "ai");
  const response = await askGemini(text);

  chat.lastChild.remove();
  addMessage(response, response.includes("⚠️") ? "error" : "ai");
}

// Eventos
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

voiceBtn.addEventListener("click", () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Tu navegador no soporta voz");
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "es-ES";
  recognition.onresult = (e) => {
    input.value = e.results[0][0].transcript;
    sendMessage();
  };
  recognition.start();
});

analyzeBtn.addEventListener("click", () => {
  input.value = "Analiza estos datos y dame los puntos más importantes";
  sendMessage();
});

// Mensaje de bienvenida
addMessage("¡Hola! Soy <strong>NeoRubi</strong> 🌸<br>¿En qué te puedo ayudar hoy?");