import * as cheerio from "cheerio";
import OpenAI from "openai";
import dotenv from "dotenv";
import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import Tesseract from "tesseract.js";
import path from "path";
import { fileURLToPath } from "url";
const { createWorker } = Tesseract; // Déstructurez createWorker depuis le module
const BASE_URL = process.env.BASE_URL || "https://usearly-api.vercel.app";

// Définir __dirname en ES Module
const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);

const { SiteType } = db;

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Assurez-vous que votre clé API est définie dans vos variables d'environnement
});

// Vérification de la clé API
if (!process.env.OPENAI_API_KEY) {
  console.error(
    "Erreur : Clé API OpenAI non définie dans les variables d'environnement."
  );
  process.exit(1);
}

// Vérification de la clé API
export const service = {
  getEmbeddings: async function (text) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      console.log(
        "Réponse brute d'OpenAI :",
        JSON.stringify(response, null, 2)
      );

      // Accédez directement aux embeddings sans condition stricte inutile
      if (response?.data?.data?.[0]?.embedding) {
        console.log("Embeddings extraits avec succès !");
        return response.data.data[0].embedding;
      } else {
        throw new Error(
          "Les embeddings sont manquants ou vides dans la réponse OpenAI."
        );
      }
    } catch (error) {
      if (error.response) {
        console.error("Erreur de l'API OpenAI :", error.response.data);
      } else {
        console.error("Erreur de réseau ou autre :", error.message);
      }
      throw error;
    }
  },

  cosineSimilarity: async function (vec1, vec2) {
    console.log("Vecteur 1 :", vec1);
    console.log("Vecteur 2 :", vec2);

    if (!vec1 || !vec2) {
      throw new Error("Un ou plusieurs vecteurs d'embeddings sont manquants.");
    }

    const dotProduct = vec1.reduce((sum, value, i) => sum + value * vec2[i], 0);
    const magnitude1 = Math.sqrt(
      vec1.reduce((sum, value) => sum + value * value, 0)
    );
    const magnitude2 = Math.sqrt(
      vec2.reduce((sum, value) => sum + value * value, 0)
    );

    return dotProduct / (magnitude1 * magnitude2);
  },
  isValidUrl: function (url) {
    try {
      // Ajouter "https://" si l'URL n'a pas de protocole
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }

      const parsedUrl = new URL(url);

      // Vérifiez les protocoles autorisés
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return false;
      }

      // Vérifiez le domaine contre une liste blanche
      /*       const allowedDomains = ['example.com', 'nike.com'];
      if (!allowedDomains.some((domain) => parsedUrl.hostname.endsWith(domain))) {
        return false;
      } */

      return true;
    } catch (error) {
      console.error("Erreur lors de la validation de l'URL :", error);
      return false;
    }
  },
  normalizeUrl: function (url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  },

  getSimilarityDescription: async function (text1, text2) {
    try {
      const embedding1 = await this.getEmbeddings(text1);
      const embedding2 = await this.getEmbeddings(text2);

      console.log("Embeddings texte 1 :", embedding1);
      console.log("Embeddings texte 2 :", embedding2);

      // Calculez la similarité cosine entre les embeddings
      const similarity = await this.cosineSimilarity(embedding1, embedding2);
      console.log("Similarité entre les descriptions :", similarity);
      return similarity;
    } catch (error) {
      console.error("Erreur lors du calcul de la similarité :", error);
      throw error;
    }
  },

  // Méthode pour déterminer le bugLocation à partir du texte extrait
  determineBugLocation: async function (textExtracted) {
    if (!textExtracted?.trim()) {
      console.warn("Aucun texte n'a été extrait.");
      return "Emplacement inconnu";
    }

    // Logique de correspondance basée sur des règles
    const textLower = textExtracted.toLowerCase();
    const bugLocationRules = [
      { keywords: ["panier", "checkout"], location: "panier" },
      { keywords: ["connexion", "login"], location: "page de connexion" },
      { keywords: ["inscription", "signup"], location: "page d'inscription" },
      { keywords: ["produit", "catalogue"], location: "page produit" },
      {
        keywords: ["Créer un compte", "Adresse e-mail", "inscription"],
        location: "page connexion/inscription",
      },
    ];

    for (const rule of bugLocationRules) {
      if (rule.keywords.some((keyword) => textLower.includes(keyword))) {
        return rule.location;
      }
    }

    // Si aucune correspondance trouvée, utilisez OpenAI
    try {
      const openaiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `
            Voici un extrait d'une capture d'écran : "${textExtracted}".
            Basé sur ce texte, où l'utilisateur semble-t-il se trouver sur le site? 
            Répondez sous la forme : "Page : [Nom de la page]".
            `,
          },
        ],
      });

      if (openaiResponse?.choices?.[0]?.message?.content) {
        const gptResponse = openaiResponse.choices[0].message.content.trim();
        console.log("Réponse OpenAI pour bugLocation :", gptResponse);

        const match = gptResponse.match(/Page\s*:\s*(.+)/i);
        if (match) {
          return match[1].trim();
        } else {
          console.warn(
            "Réponse OpenAI dans un format inattendu :",
            gptResponse
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'appel OpenAI :", error);
    }

    return "Emplacement inconnu";
  },
  // Utilisation de Tesseract pour extraire du texte depuis une image

/*   extractTextFromImage: async function (base64Image, language = "fra") {
    try {
        if (!base64Image.startsWith("data:image")) {
            throw new Error("L'image fournie n'est pas une image encodée en Base64 valide.");
        }

        const worker = await createWorker({
            logger: (m) => console.log(m), // Activer les logs pour déboguer
        });

        console.log("Langue chargée :", language);
        await worker.loadLanguage(language);
        await worker.reinitialize(language);

        const {
            data: { text },
        } = await worker.recognize(base64Image);

        console.log("Texte extrait :", text);

        await worker.terminate(); // Terminez le worker après utilisation
        return text;
    } catch (error) {
        console.error(`Erreur lors de l'extraction du texte pour ${language} :`, error);
        return "Erreur lors de l'extraction du texte";
    }
}, */

extractTextFromImage: async function (base64Image, language = "fra") {
  try {
      if (!base64Image.startsWith("data:image")) {
          throw new Error("L'image fournie n'est pas une image encodée en Base64 valide.");
      }

      // Configuration pour pointer vers les fichiers locaux
      const worker = await createWorker({
          corePath: "/tesseract/tesseract-core-simd.wasm", // Chemin vers le fichier WASM
          workerPath: "/tesseract/worker.min.js",          // Chemin vers le worker
          langPath: "/tesseract",                         // Chemin vers les fichiers de langues
          logger: (m) => console.log(m), // Activer les logs pour déboguer
      });

      console.log("Langue chargée :", language);

      await worker.loadLanguage(language);
      await worker.initialize(language);

      const {
          data: { text },
      } = await worker.recognize(base64Image);

      console.log("Texte extrait :", text);

      await worker.terminate(); // Terminer le worker après utilisation
      return text;
  } catch (error) {
      console.error(`Erreur lors de l'extraction du texte pour ${language} :`, error);
      return "Erreur lors de l'extraction du texte";
  }
},


  // Récupération des métadonnées du site
  getCategories: async function (description) {
    try {
      const prompt = `
            Un utilisateur a signalé le problème suivant : "${description}".
            Basé sur cette description, déterminez les catégories les plus pertinentes pour classer ce problème, environ 4 suggestions
    
            Répondez sous le format suivant :
            Catégories :
            - [Catégorie 1]
            - [Catégorie 2]
            - [Catégorie 3]
            - [Catégorie 4]
            `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });

      if (
        response &&
        response.choices &&
        response.choices[0] &&
        response.choices[0].message
      ) {
        const text = response.choices[0].message.content.trim();
        console.log("Réponse brute d'OpenAI :", text);

        // Parse the response for categories
        const categories = text
          .match(/- (.+)/g)
          .map((cat) => cat.replace("- ", "").trim());
        return categories;
      } else {
        console.error("Réponse d’OpenAI invalide :", response);
        return [];
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des catégories depuis OpenAI :",
        error
      );
      return [];
    }
  },
  findOrCreateSiteType: async function (siteTypeName) {
    try {
      // Vérifiez si le siteType existe déjà
      let siteType = await SiteType.findOne({ where: { name: siteTypeName } });
      if (!siteType) {
        // Si le siteType n'existe pas, créez-le
        siteType = await SiteType.create({ name: siteTypeName });
      }
      return siteType;
    } catch (error) {
      console.error(
        "Erreur lors de la création ou de la recherche du site type :",
        error
      );
      throw new Error(
        "Erreur lors de la recherche ou de la création du type de site."
      );
    }
  },
  getSiteMetadata: async function (url) {
    try {
      const fetch = (await import("node-fetch")).default;

      // Ajouter le protocole si manquant
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`; // Par défaut, ajoutez `https://`
      }

      const parsedUrl = new URL(url); // Valide l'URL complète
      const response = await fetch(parsedUrl.href);

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $("title").text().trim();
      const description = $('meta[name="description"]').attr("content") || "";

      return { title, description };
    } catch (error) {
      console.error("Erreur lors de la récupération des métadonnées :", error);
      return { title: "", description: "" }; // Valeurs par défaut en cas d'erreur
    }
  },

  getCategoriesAndSiteType: async function (
    description,
    siteMetadata,
    existingCategories,
    existingSiteTypes
  ) {
    try {
      const prompt = `
            Un utilisateur a signalé le problème suivant : "${description}".
            Métadonnées du site : Titre - "${siteMetadata.title}", Description - "${siteMetadata.description}".
            Types de sites disponibles : ${existingSiteTypes.join(", ")}.
            Catégories de bugs disponibles : ${existingCategories.join(", ")}.
    
            Basé sur les informations ci-dessus :
            1. Déterminez le type de site le plus approprié parmi les types de sites disponibles.
            2. Proposez 4 catégories de bugs les plus pertinentes Basé sur cette description pour classer ce problème.
    
            Répondez sous le format suivant :
            Type de site : [Type de site]
            Catégories :
            - [Catégorie 1]
            - [Catégorie 2]
            - [Catégorie 3]
            - [Catégorie 4]
            `;
      console.log("Prompt généré :", prompt);
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });
      console.log("Réponse brute OpenAI :", response);
      if (
        response &&
        response.choices &&
        response.choices[0] &&
        response.choices[0].message
      ) {
        const text = response.choices[0].message.content.trim();
        return this.parseOpenAIResponse(text);
      } else {
        console.error("Réponse d’OpenAI invalide :", response);
        return { siteType: "Inconnu", categories: [] };
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des catégories et du type de site depuis OpenAI :",
        error
      );
      return { siteType: "Inconnu", categories: [] };
    }
  },

  parseOpenAIResponse: function (responseText) {
    if (!responseText) {
      console.error("La réponse d’OpenAI est vide ou invalide.");
      return { siteType: "Inconnu", categories: [] };
    }

    console.log("Réponse brute à parser :", responseText);

    const lines = responseText.split("\n").map((line) => line.trim());
    let siteType = "";
    const categories = [];

    lines.forEach((line) => {
      if (line.startsWith("Type de site :")) {
        siteType = line.replace("Type de site :", "").trim();
      } else if (line.startsWith("- ")) {
        categories.push(line.replace("- ", "").trim());
      }
    });

    if (!siteType) {
      console.warn("Type de site non détecté dans la réponse.");
    }

    if (categories.length === 0) {
      console.warn("Catégories non détectées dans la réponse.");
    }

    if (!siteType || categories.length === 0) {
      console.error(
        "Impossible de parser la réponse OpenAI correctement :",
        responseText
      );
      return { siteType: "Inconnu", categories: ["Autre"] }; // Ajouter une valeur par défaut
    }

    return { siteType, categories };
  },
};
