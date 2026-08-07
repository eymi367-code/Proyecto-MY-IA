// api/gemini.js
// Función serverless de Vercel. Se despliega automáticamente si este
// archivo vive en la carpeta /api en la raíz de tu proyecto.
//
// IMPORTANTE: la variable de entorno aquí NO debe llevar el prefijo VITE_.
// En el dashboard de Vercel (Settings → Environment Variables) crea:
//   Nombre:  GEMINI_API_KEY
//   Valor:   tu API key de Google AI Studio
// Así la key vive solo en el servidor y nunca llega al navegador.

const MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash-lite",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Falta el campo 'prompt'" });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY no configurada en el servidor" });
  }

  const attempts = [];

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    try {
      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      const data = await geminiRes.json();

      if (!geminiRes.ok || data.error) {
        attempts.push({
          model,
          status: geminiRes.status,
          message: data.error?.message || "Respuesta sin candidatos",
        });

        if (geminiRes.status === 401 || geminiRes.status === 403) {
          break;
        }
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        attempts.push({ model, status: geminiRes.status, message: "Respuesta vacía" });
        continue;
      }

      return res.status(200).json({ text, modelUsed: model });
    } catch (err) {
      attempts.push({ model, status: null, message: err.message });
      continue;
    }
  }

  return res.status(502).json({
    error: "Todos los modelos fallaron",
    attempts,
  });
}