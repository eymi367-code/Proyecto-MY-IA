// main.js
// Ahora el frontend NO tiene ninguna API key. Llama a tu propio backend
// (api/gemini.js), que es el único que conoce la key de Google.

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
  return div;
}

async function askGemini(prompt) {
  try {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Fallo del backend:", data);

      const detalle = data.attempts
        ?.map((a) => `• ${a.model}: [${a.status ?? "sin status"}] ${a.message}`)
        .join("<br>");

      return `⚠️ No se pudo obtener respuesta.<br><br>${
        detalle || data.error || "Error desconocido"
      }<br><br>
      Revisa tu cuota aquí: <a href="https://aistudio.google.com/" target="_blank">Google AI Studio</a>`;
    }

    console.log("Modelo usado:", data.modelUsed);

    return data.text;
  } catch (err) {
    console.error("Error de red:", err);
    return `⚠️ No se pudo conectar con el servidor.<br><br>${err.message}`;
  }
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  const pensando = addMessage("Pensando...", "ai");
  const response = await askGemini(text);

  pensando.remove();
  addMessage(response, response.includes("⚠️") ? "error" : "ai");
}

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

addMessage("¡Hola! Soy <strong>NeoRubi</strong> 🌸<br>¿En qué te puedo ayudar hoy?");