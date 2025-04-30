import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import stringSimilarity from "string-similarity";
import { URL } from "url";
import { isHostMatching } from "../utils/urlUtils.js";
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
  normalizeFullUrl: function (url) {
    try {
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      return new URL(url).href; // ex: "https://adidas.fr/checkout"
    } catch (error) {
      console.error("❌ Erreur normalizeFullUrl:", error);
      return null;
    }
  },
  extractDomain: function (url) {
    try {
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, "");
    } catch (error) {
      console.error("❌ Erreur extractDomain:", error);
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
    function isDomain(hostname, baseDomain) {
      return (
        hostname === baseDomain ||
        hostname.endsWith("." + baseDomain) ||
        hostname.match(
          new RegExp(`(^|\\.)${isHostMatching(baseDomain)}\\.[a-z]{2,}$`)
        )
      );
    }

    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

      let bugLocation = "home";
      let categories = ["Général"];

      const mappings = {
        // Authentification
        "login": {
          location: "login",
          categories: ["Authentification", "Connexion"],
        },
        "connexion": {
          location: "login",
          categories: ["Authentification", "Connexion"],
        },
        "signin": {
          location: "login",
          categories: ["Authentification", "Connexion"],
        },
        "signup": {
          location: "register",
          categories: ["Authentification", "Inscription"],
        },
        "register": {
          location: "register",
          categories: ["Authentification", "Inscription"],
        },
        "inscription": {
          location: "register",
          categories: ["Authentification", "Inscription"],
        },
        // E-commerce
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
        "wishlist": {
          location: "wishlist",
          categories: ["Favoris", "Liste de souhaits"],
        },
        "search": { location: "search_results", categories: ["Recherche"] },
        // Support
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
        "contracts": {
          location: "customer_service",
          categories: ["Contrats", "Service Client"],
        },
        // Réseaux sociaux
        "in": {
          location: "profile_page",
          categories: ["Profil", "Réseau professionnel"],
        },
        "jobs": {
          location: "job_page",
          categories: ["Offres d’emploi", "Carrière"],
        },
        "feed": { location: "home", categories: ["Fil d’actualité", "Réseau"] },
        "messaging": {
          location: "messaging",
          categories: ["Messagerie", "Communication"],
        },
        "notifications": {
          location: "notifications",
          categories: ["Notifications", "Réseau"],
        },
      };

      // 1️⃣ Recherche dans les segments
      for (const segment of pathSegments) {
        const normalizedSegment = segment.toLowerCase();
        if (mappings[normalizedSegment]) {
          bugLocation = mappings[normalizedSegment].location;
          categories = mappings[normalizedSegment].categories;
          break;
        }
      }

      // 2️⃣ Cas spécifique par domaine
      if (isDomain(hostname, "amazon")) {
        if (url.includes("/dp/") || url.includes("/gp/product/")) {
          bugLocation = "product_page";
          categories = ["Produits", "Amazon"];
        } else if (url.includes("/ap/signin")) {
          bugLocation = "login";
          categories = ["Authentification", "Connexion"];
        } else if (url.includes("/gp/help/")) {
          bugLocation = "customer_service";
          categories = ["Service Client", "Amazon"];
        }
      } else if (isDomain(hostname, "linkedin")) {
        bugLocation = "linkedin_section";
        categories = ["LinkedIn"];
      } else if (isDomain(hostname, "github")) {
        bugLocation = "github_section";
        categories = ["GitHub"];
      } else if (isDomain(hostname, "facebook")) {
        bugLocation = "facebook_section";
        categories = ["Facebook"];
      } else if (isDomain(hostname, "tiktok")) {
        bugLocation = "tiktok_section";
        categories = ["TikTok"];
      } else if (isDomain(hostname, "airbnb")) {
        if (pathSegments.includes("rooms")) {
          bugLocation = "room_page";
          categories = ["Réservation", "Logement", "Fiche produit"];
        }
      }

      // 3️⃣ Fallback intelligent
      if (!bugLocation || bugLocation === "home") {
        if (pathSegments.length > 0) {
          const lastSegment = pathSegments[pathSegments.length - 1];
          if (
            lastSegment &&
            typeof lastSegment === "string" &&
            lastSegment.length < 20
          ) {
            bugLocation = "category_page";
            categories = ["Catégorie", "Navigation"];
          } else {
            bugLocation = "home";
            categories = ["Général"];
          }
        } else {
          bugLocation = "home";
          categories = ["Général"];
        }
      }

      return { bugLocation, categories };
    } catch (error) {
      console.error("❌ Erreur lors de l'extraction :", error);
      return { bugLocation: "home", categories: ["Général"] };
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
