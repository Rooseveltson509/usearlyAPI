import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import stringSimilarity from "string-similarity";
import { URL } from "url";
// Récupération des modèles nécessaires
const { SiteType, SiteMetadata } = db;
// Cache pour stocker les emplacements connus (évite de recalculer inutilement)
const bugLocationCache = new Map();

export const service = {
  normalizeUrl: function (url) {
    try {
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.replace(/^www\./, "");
    } catch (error) {
      console.error("❌ Erreur lors de la normalisation de l'URL :", error);
      return null;
    }
  },

  isValidUrl: function (url) {
    try {
      const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
      new URL(formattedUrl);
      return true;
    } catch (error) {
      console.error("❌ Erreur lors de la validation de l'URL :", error);
      return false;
    }
  },
  /**
   * Compare deux descriptions pour détecter si elles sont similaires
   * @param {string} desc1 - Première description
   * @param {string} desc2 - Deuxième description
   * @returns {boolean} - Vrai si elles sont considérées comme similaires
   */
  compareDescriptions: async function (desc1, desc2) {
    const similarity = stringSimilarity.compareTwoStrings(
      desc1.toLowerCase().trim(),
      desc2.toLowerCase().trim()
    );

    console.log(
      `🔍 Comparaison "${desc1}" VS "${desc2}" ➡️ Similarité : ${similarity}`
    );

    return similarity >= 0.6; // 📌 Ajuste le seuil si nécessaire
  },
  /**
   * Détermine la page où se trouve l'utilisateur en fonction du texte extrait.
   */
  determineBugLocation: function (textExtracted) {
    if (!textExtracted?.trim()) {
      return "page inconnue";
    }

    const textLower = textExtracted.toLowerCase().trim();
    if (bugLocationCache.has(textLower)) {
      return bugLocationCache.get(textLower);
    }

    const bugLocationRules = [
      { keywords: ["panier", "checkout"], location: "page panier" },
      { keywords: ["connexion", "login"], location: "page de connexion" },
      { keywords: ["inscription", "signup"], location: "page d'inscription" },
      { keywords: ["produit", "catalogue"], location: "page produit" },
      {
        keywords: ["adresse e-mail", "créer un compte"],
        location: "page compte",
      },
    ];

    for (const rule of bugLocationRules) {
      if (rule.keywords.some((keyword) => textLower.includes(keyword))) {
        bugLocationCache.set(textLower, rule.location);
        return rule.location;
      }
    }

    return "page inconnue";
  },
  async getSiteMetadata(siteUrl) {
    const start = Date.now();
    try {
      console.log(`🌍 [START] Récupération des métadonnées pour ${siteUrl}`);

      const metadata = await SiteMetadata.findOne({ where: { siteUrl } });

      console.log(
        `📌 [${Date.now() - start}ms] Récupération des métadonnées terminée`
      );

      return metadata;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des métadonnées :",
        error
      );
      return null;
    }
  },
  /**
   * Génère des catégories en fonction de la description.
   */
  getCategories: function (description) {
    const descLower = description.toLowerCase().trim();
    const categoryRules = [
      {
        keywords: ["bug", "erreur", "crash"],
        categories: ["Bug", "Problème technique"],
      },
      {
        keywords: ["connexion", "mot de passe"],
        categories: ["Connexion", "Sécurité"],
      },
      {
        keywords: ["produit", "affichage"],
        categories: ["Problème affichage", "Produits"],
      },
    ];

    const matchedCategories = new Set();
    categoryRules.forEach((rule) => {
      if (rule.keywords.some((keyword) => descLower.includes(keyword))) {
        rule.categories.forEach((cat) => matchedCategories.add(cat));
      }
    });

    return Array.from(matchedCategories);
  },

  /**
   * Vérifie si un type de site existe, sinon le crée.
   */
  findOrCreateSiteType: async function (siteTypeName) {
    try {
      let siteType = await SiteType.findOne({ where: { name: siteTypeName } });
      if (!siteType) {
        siteType = await SiteType.create({ name: siteTypeName });
      }
      return siteType;
    } catch (error) {
      console.error(
        "Erreur lors de la recherche/création du type de site :",
        error
      );
      throw new Error(
        "Erreur lors de la recherche ou de la création du type de site."
      );
    }
  },

  async findOrCreateSiteMetadata(siteUrl) {
    const start = Date.now();
    try {
      let existingMetadata = await SiteMetadata.findOne({ where: { siteUrl } });
      if (existingMetadata) {
        console.log(
          `✅ [${Date.now() - start}ms] Métadonnées existantes trouvées`
        );
        return existingMetadata;
      }

      console.log(`🌍 Aucune métadonnée trouvée, création en cours...`);

      const newMetadata = await SiteMetadata.create({
        siteUrl,
        siteType: "inconnu",
        siteTypeId: null,
        categories: "non spécifié",
      });

      console.log(
        `🚀 [${Date.now() - start}ms] Création des métadonnées terminée`
      );
      return newMetadata;
    } catch (error) {
      console.error("❌ Erreur lors de la création des métadonnées :", error);
      return null;
    }
  },
  async extractBrandName(url) {
    try {
      const parsedUrl = new URL(url);
      let hostname = parsedUrl.hostname; // Ex: "www.nike.com"

      // Supprimer les sous-domaines (www, shop, store, etc.)
      let parts = hostname.split(".");
      if (parts.length > 2) {
        parts = parts.slice(-2); // Garde seulement ["nike", "com"]
      }

      // Retirer l'extension (com, fr, net...)
      return parts[0].toLowerCase(); // Ex: "nike"
    } catch (error) {
      console.error("❌ Erreur lors de l'extraction de la marque :", error);
      return null;
    }
  },
  async extractBugLocationAndCategories(url) {
    try {
      const parsedUrl = new URL(url);
      const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

      let bugLocation = "home"; // Par défaut
      let categories = ["Général"]; // Catégorie par défaut

      if (pathSegments.length === 0) {
        return { bugLocation, categories };
      }

      // ✅ Mots-clés supplémentaires (variations pour login/register)
      const mappings = {
        "cart": { location: "cart", categories: ["Panier", "Achat"] },
        "checkout": {
          location: "checkout",
          categories: ["Paiement", "Commande"],
        },
        "payment": {
          location: "checkout",
          categories: ["Paiement", "Commande"],
        },
        "order": { location: "checkout", categories: ["Commande", "Suivi"] },

        "login": {
          location: "login",
          categories: ["Authentification", "Connexion"],
        },
        "logon": {
          location: "login",
          categories: ["Authentification", "Connexion"],
        },
        "log-in": {
          location: "login",
          categories: ["Authentification", "Connexion"],
        },
        "signin": {
          location: "login",
          categories: ["Authentification", "Connexion"],
        },
        "sign-in": {
          location: "login",
          categories: ["Authentification", "Connexion"],
        },

        "register": {
          location: "register",
          categories: ["Authentification", "Inscription"],
        },
        "signup": {
          location: "register",
          categories: ["Authentification", "Inscription"],
        },
        "sign-up": {
          location: "register",
          categories: ["Authentification", "Inscription"],
        },
        "inscription": {
          location: "register",
          categories: ["Authentification", "Inscription"],
        },
        // Ajout dans le bloc "mappings"
        "in": {
          location: "profile_page",
          categories: ["Profil", "Réseau professionnel"],
        },
        "jobs": {
          location: "job_page",
          categories: ["Offres d’emploi", "Carrière"],
        },
        "feed": {
          location: "home",
          categories: ["Fil d’actualité", "Réseau"],
        },
        "messaging": {
          location: "messaging",
          categories: ["Messagerie", "Communication"],
        },
        "notifications": {
          location: "notifications",
          categories: ["Notifications", "Réseau"],
        },
        "wishlist": {
          location: "wishlist",
          categories: ["Favoris", "Liste de souhaits"],
        },
        "favoris": {
          location: "wishlist",
          categories: ["Favoris", "Liste de souhaits"],
        },
        "search": { location: "search_results", categories: ["Recherche"] },
        "recherche": { location: "search_results", categories: ["Recherche"] },

        "help": {
          location: "customer_service",
          categories: ["Service Client", "Assistance"],
        },
        "support": {
          location: "customer_service",
          categories: ["Service Client", "Support"],
        },
        "contact": {
          location: "customer_service",
          categories: ["Service Client", "Contact"],
        },
        "faq": {
          location: "customer_service",
          categories: ["Service Client", "Questions fréquentes"],
        },
        "returns": {
          location: "customer_service",
          categories: ["Service Client", "Retours"],
        },
        "warranty": {
          location: "customer_service",
          categories: ["Service Client", "Garantie"],
        },
        "terms": {
          location: "customer_service",
          categories: ["Service Client", "Conditions générales"],
        },
        "privacy-policy": {
          location: "customer_service",
          categories: ["Service Client", "Confidentialité"],
        },
        "customer-service": {
          location: "customer_service",
          categories: ["Service Client"],
        },
        "assistance": {
          location: "customer_service",
          categories: ["Service Client", "Assistance"],
        },
        "aide": {
          location: "customer_service",
          categories: ["Service Client", "Aide"],
        },
        "support-client": {
          location: "customer_service",
          categories: ["Service Client", "Support"],
        },
        "service-client": {
          location: "customer_service",
          categories: ["Service Client"],
        },
      };

      // ✅ 1️⃣ Recherche stricte dans l’URL
      for (const segment of pathSegments) {
        const normalizedSegment = segment.toLowerCase();
        if (mappings[normalizedSegment]) {
          bugLocation = mappings[normalizedSegment].location;
          categories = mappings[normalizedSegment].categories;
          console.log(`🔍 bugLocation détecté: ${bugLocation}`);
          console.log(`🏷️ Catégories détectées: ${categories.join(", ")}`);
          return { bugLocation, categories };
        }
      }

      const lastSegment = pathSegments[pathSegments.length - 1].toLowerCase();

      // ✅ 2️⃣ Produit
      if (
        lastSegment.match(/[-_][a-zA-Z0-9]{5,}$/) ||
        parsedUrl.searchParams.has("id") ||
        url.includes("/p/") ||
        url.includes("/dp/") ||
        url.includes("/product/")
      ) {
        bugLocation = "product_page";
        categories = ["Produits", "Détail produit"];
      }
      // ✅ 3️⃣ Catégorie
      else if (
        pathSegments.length === 1 &&
        lastSegment.match(/[a-z-]+[0-9]*$/)
      ) {
        bugLocation = "category_page";
        categories = ["Catégorie", "Navigation"];
      }
      // ✅ 4️⃣ Sous-catégorie
      else if (bugLocation === "home" && pathSegments.length > 1) {
        bugLocation = "subcategory";
        categories = ["Sous-catégorie"];
      }

      // ✅ 5️⃣ Détection spéciale Amazon
      if (parsedUrl.hostname.includes("amazon.")) {
        if (url.includes("/dp/") || url.includes("/gp/product/")) {
          bugLocation = "product_page";
          categories = ["Produits", "Amazon"];
        } else if (url.includes("/ap/signin")) {
          bugLocation = "login";
          categories = ["Authentification", "Connexion"];
        } else if (url.includes("/gp/help/")) {
          bugLocation = "customer_service";
          categories = ["Service Client", "Amazon"];
        } else if (url.includes("/hz/wishlist")) {
          bugLocation = "wishlist";
          categories = ["Favoris", "Liste de souhaits"];
        }
      }

      // LinkedIn
      if (parsedUrl.hostname.includes("linkedin.com")) {
        const firstSegment = pathSegments[0];
        if (firstSegment === "in") {
          bugLocation = "profile_page";
          categories = ["Profil", "Réseau professionnel"];
        } else if (firstSegment === "jobs") {
          bugLocation = "job_page";
          categories = ["Emploi", "Carrière"];
        } else if (firstSegment === "messaging") {
          bugLocation = "messaging";
          categories = ["Messagerie", "Communication"];
        } else {
          bugLocation = "linkedin_section";
          categories = ["LinkedIn"];
        }
      }

      // GitHub
      else if (parsedUrl.hostname.includes("github.com")) {
        if (pathSegments.length === 1) {
          bugLocation = "profile_page";
          categories = ["Profil développeur", "GitHub"];
        } else if (pathSegments[1] === "issues") {
          bugLocation = "issues";
          categories = ["Bugs", "Suivi de projet"];
        } else if (pathSegments[1] === "pulls") {
          bugLocation = "pull_requests";
          categories = ["Contributions", "Revue de code"];
        } else {
          bugLocation = "repository";
          categories = ["Projet", "Dépôt"];
        }
      } else if (parsedUrl.hostname.includes("facebook.com")) {
        bugLocation = "facebook_section";
        categories = ["Facebook"];
      }

      // TikTok
      else if (parsedUrl.hostname.includes("tiktok.com")) {
        if (pathSegments[0] === "@") {
          bugLocation = "profile_page";
          categories = ["Profil", "TikTok"];
        } else if (pathSegments.includes("video")) {
          bugLocation = "video_page";
          categories = ["Vidéo", "Contenu"];
        } else {
          bugLocation = "tiktok_section";
          categories = ["TikTok"];
        }
      } else if (parsedUrl.hostname.includes("airbnb.")) {
        if (pathSegments.includes("rooms")) {
          bugLocation = "room_page";
          categories = ["Réservation", "Logement", "Fiche produit"];
        } else if (pathSegments.includes("wishlist")) {
          bugLocation = "wishlist";
          categories = ["Favoris", "Sélection"];
        } else if (pathSegments.includes("trips")) {
          bugLocation = "booking_history";
          categories = ["Historique", "Voyages"];
        } else if (pathSegments.includes("help")) {
          bugLocation = "customer_service";
          categories = ["Aide", "Support"];
        } else {
          bugLocation = "airbnb_section";
          categories = ["Airbnb"];
        }
      }

      console.log(`🔍 bugLocation détecté: ${bugLocation}`);
      console.log(`🏷️ Catégories détectées: ${categories.join(", ")}`);
      return { bugLocation, categories };
    } catch (error) {
      console.error("❌ Erreur lors de l'extraction :", error);
      return { bugLocation: "unknown", categories: ["Non classé"] };
    }
  },

  async extractSiteData(url) {
    try {
      const parsedUrl = new URL(url);

      // ✅ Extrait l'origine du site (sans le chemin)
      const normalizedSiteUrl = parsedUrl.origin; // ex: "https://www.nike.com"

      // ✅ Extrait le chemin après le domaine (ex: "/help", "/cart", etc.)
      let bugLocation = parsedUrl.pathname.trim();

      // ✅ Remplace les chemins vides ou "home" par "/"
      if (!bugLocation || bugLocation === "/") {
        bugLocation = "/home";
      }

      return { normalizedSiteUrl, bugLocation };
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'extraction des données du site :",
        error
      );
      return { normalizedSiteUrl: url, bugLocation: "/unknown" }; // 🔄 Valeur par défaut en cas d'erreur
    }
  },
};
