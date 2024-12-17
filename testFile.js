import OpenAI from "openai";
import dotenv from "dotenv";
// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Assurez-vous que votre clé API est définie dans vos variables d'environnement
});

(async () => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Test de l'API OpenAI" }],
    });
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error("Erreur OpenAI :", error);
  }
})();
