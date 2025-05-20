import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import { suggestionSchema } from "../validation/SuggestionSchema.js";
import { getUserId } from "../utils/jwtUtils.js";
const { User, Suggestion } = db;
import { service as siteService } from "../services/siteService.js";
import { getRecentSuggestionsByUrl } from "../services/getCdcAndSuggestion.js";
import { Sequelize } from "sequelize";

export const suggestion = {
  create: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId <= 0) {
        return res.status(400).json({ error: "Missing parameters." });
      }

      // Validation des données avec Joi
      const { error } = suggestionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { siteUrl, description, emoji, likes, dislikes, capture } =
        req.body;

      // Vérifier si l'utilisateur existe
      const userFound = await User.findOne({ where: { id: userId } });
      if (!userFound) {
        return res.status(403).json({ error: "Access denied." });
      }

      if (!siteUrl || !description) {
        return res.status(400).json({ error: "Paramètres manquants." });
      }

      const marque = await siteService.extractBrandName(siteUrl);
      const domainOnly = new URL(siteUrl).hostname;
      const domain = domainOnly.replace(/^www\./, "");
      const { bugLocation } =
        await siteService.extractBugLocationAndCategories(siteUrl);

      // Créer une nouvelle suggestion
      const suggestion = await Suggestion.create({
        userId: userFound.id,
        siteUrl: domain,
        marque,
        emplacement: bugLocation,
        description,
        emoji,
        likes,
        dislikes,
        capture,
      });

      return res.status(201).json({
        status: 201,
        success: true,
        message: "Suggestion créée avec succès.",
        suggestionId: suggestion.id,
      });
    } catch (err) {
      console.error("Erreur lors de la création de la suggestion :", err);
      return res
        .status(500)
        .json({ error: "An error occurred", details: err.message });
    }
  },
  getAllSuggestions: async function (req, res) {
    try {
      // Récupérer l'authentification de l'admin
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      // Vérifier si l'utilisateur est un administrateur
      const userAuthorized = await User.findOne({
        where: { id: userId },
        //where: { id: userId, role: "admin" },
      });
      if (!userAuthorized) {
        return res.status(403).json({ error: "Accès non autorisé." });
      }

      // Paramètres pour la pagination
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // Récupérer tous les reportings avec pagination
      const { count, rows: suggestions } = await Suggestion.findAndCountAll({
        attributes: [
          "id",
          "marque",
          "emplacement",
          "capture",
          "emoji",
          "description",
          "createdAt",
          "updatedAt",
          [Sequelize.literal("'suggestion'"), "type"], // ✅ Ajoute `type`
        ],
        include: [
          {
            model: User,
            as: "author",
            attributes: ["pseudo", "email", "avatar"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });

      const formattedSuggestions = suggestions.map((suggestion) => {
        let reactions = [];
        if (
          suggestions.reactions &&
          typeof suggestions.reactions === "string"
        ) {
          try {
            reactions = JSON.parse(suggestion.reactions);
          } catch (error) {
            console.error("❌ Erreur parsing JSON des réactions :", error);
          }
        }

        // ✅ Normalisation des réactions
        const reactionMap = new Map();

        reactions.forEach((reaction) => {
          if (!reaction.emoji) return;

          const key = reaction.emoji;
          if (!reactionMap.has(key)) {
            reactionMap.set(key, {
              emoji: reaction.emoji,
              userIds: new Set(), // Utilisation d'un Set pour éviter les doublons
            });
          }

          reactionMap.get(key).userIds.add(reaction.userId);
        });

        // ✅ Format final des réactions
        const normalizedReactions = Array.from(reactionMap.values()).map(
          (reaction) => ({
            emoji: reaction.emoji,
            count: reaction.userIds.size, // Le count est le nombre unique d'utilisateurs
            userIds: Array.from(reaction.userIds), // Convertir le Set en tableau
          })
        );

        return {
          ...suggestion.toJSON(),
          type: "signalement",
          reactions: normalizedReactions,
        };
      });

      // Ajouter l'en-tête Content-Type
      res.setHeader("Content-Type", "application/json");
      // Retourner les reportings avec pagination
      res.status(200).json({
        totalSuggestion: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        suggestions: formattedSuggestions,
      });
    } catch (err) {
      console.error("Erreur lors de la récupération des coups de coeur :", err);
      // Ajouter l'en-tête Content-Type
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error:
          "Une erreur est survenue lors de la récupération des coups de coeur.",
      });
    }
  },

  // ✅ Ajouter ou supprimer une réaction sur une suggestion
  addReactionToSuggestion: async function (req, res) {
    try {
      console.log("📌 Requête reçue pour ajouter une réaction...");
      console.log("📦 Headers :", req.headers);
      console.log("📦 Body reçu :", req.body);
      console.log("📦 Paramètres :", req.params);

      const { suggestionId } = req.params;
      const { emoji } = req.body;
      const userId = getUserId(req.headers["authorization"]);

      if (!userId) {
        console.error("❌ Erreur : Utilisateur non authentifié.");
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      if (!suggestionId || !emoji) {
        console.error("❌ Erreur : Paramètres manquants.");
        return res.status(400).json({ error: "Paramètres manquants." });
      }

      const suggestion = await Suggestion.findByPk(suggestionId);
      if (!suggestion) {
        console.error("❌ Erreur : Suggestion non trouvée.");
        return res.status(404).json({ error: "Suggestion non trouvée." });
      }

      // ✅ Vérification et correction des réactions
      let reactions = [];

      if (
        typeof suggestion.reactions === "string" &&
        suggestion.reactions.trim() !== ""
      ) {
        try {
          reactions = JSON.parse(suggestion.reactions);
          if (!Array.isArray(reactions)) {
            console.error(
              "❌ Données des réactions invalides. Réinitialisation..."
            );
            reactions = [];
          }
        } catch (error) {
          console.error("❌ Erreur lors du parsing JSON :", error);
          return res.status(500).json({
            error:
              "Données corrompues dans les réactions. Veuillez contacter un administrateur.",
          });
        }
      }

      console.log("✅ Réactions après parsing :", reactions);

      // ✅ Vérifie si l'utilisateur a déjà réagi
      const existingIndex = reactions.findIndex((r) => r.userId === userId);

      if (existingIndex !== -1) {
        if (reactions[existingIndex].emoji === emoji) {
          console.log("🔄 Suppression de la réaction existante.");
          reactions.splice(existingIndex, 1);
        } else {
          console.log("🔄 Mise à jour de l'emoji de la réaction.");
          reactions[existingIndex].emoji = emoji;
        }
      } else {
        console.log("➕ Ajout d'une nouvelle réaction.");
        reactions.push({ userId, emoji, count: 1 });
      }

      console.log("✅ Réactions mises à jour :", reactions);

      // ✅ Mise à jour de la base de données
      await suggestion.update({ reactions: JSON.stringify(reactions) });

      return res.status(200).json({
        success: true,
        message: "Réaction mise à jour.",
        reactions,
      });
    } catch (err) {
      console.error("❌ Erreur lors de l'ajout de la réaction :", err);
      return res.status(500).json({ error: "Une erreur est survenue" });
    }
  },

  // ✅ Récupérer les utilisateurs ayant réagis avec un emoji sur un suggestion
  getSuggestionReactionUsers: async (req, res) => {
    try {
      const { suggestionId, emoji } = req.params;
      console.log(
        "🔍 Requête reçue pour le report :",
        suggestionId,
        "et emoji :",
        emoji
      );

      const suggestion = await Suggestion.findByPk(suggestionId);
      if (!suggestion) {
        return res.status(404).json({ error: "Suggestion non trouvée" });
      }

      console.log("🗂 Réactions stockées :", suggestion.reactions);

      // Vérifie que les réactions existent et sont bien un tableau
      if (!suggestion.reactions || typeof suggestion.reactions !== "string") {
        return res.status(200).json({ success: true, users: [] });
      }

      // Transforme en tableau JSON
      let reactions;
      try {
        reactions = JSON.parse(suggestion.reactions);
      } catch (err) {
        console.error("❌ Erreur JSON :", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de l'analyse des réactions" });
      }

      console.log("✅ Réactions après parsing :", reactions);

      // Filtrer les utilisateurs ayant utilisé cet emoji
      const users = reactions
        .filter((r) => r.emoji === emoji)
        .map((r) => r.userId);

      console.log("👥 Utilisateurs ayant réagi :", users);

      if (users.length === 0) {
        return res.status(200).json({ success: true, users: [] });
      }

      // Récupérer les infos des utilisateurs
      const userInfos = await User.findAll({
        where: { id: users },
        attributes: ["id", "pseudo", "avatar"],
      });

      return res.status(200).json({ success: true, users: userInfos });
    } catch (error) {
      console.error("❌ Erreur serveur :", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },

  getAllSuggestionReactions: async function (req, res) {
    try {
      console.log("📌 Récupération des réactions pour Suggestion...");

      const { suggestionId } = req.params;

      const suggestion = await Suggestion.findByPk(suggestionId);
      if (!suggestion) {
        return res.status(404).json({ error: "Suggestion non trouvée" });
      }

      console.log("🗂 Réactions stockées dans la BDD :", suggestion.reactions);

      // ✅ Vérification et parsing des réactions
      let reactions = [];
      if (suggestion.reactions && typeof suggestion.reactions === "string") {
        try {
          reactions = JSON.parse(suggestion.reactions);
        } catch (err) {
          console.error("❌ Erreur JSON :", err);
          return res
            .status(500)
            .json({ error: "Erreur lors de l'analyse des réactions" });
        }
      }

      console.log("✅ Réactions après parsing :", reactions);

      return res.status(200).json({ success: true, reactions });
    } catch (error) {
      console.error("❌ Erreur serveur :", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },

  getReactionsCountBySuggest: async function (req, res) {
    try {
      console.log("📌 Récupération des réactions...");

      const { suggestionId } = req.params;

      // Récupérer le suggestion par son ID
      const suggestion = await Suggestion.findByPk(suggestionId);
      if (!suggestion) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      console.log("🗂 Réactions stockées dans la BDD :", suggestion.reactions);

      // ✅ Vérifie si `suggestion.reactions` est null ou une chaîne vide
      if (!suggestion.reactions || typeof suggestion.reactions !== "string") {
        return res
          .status(200)
          .json({ success: true, reactionsCount: 0, reactions: [] });
      }

      let reactions;
      try {
        // Tentative de parsing du JSON des réactions
        reactions = JSON.parse(suggestion.reactions);

        // Vérifie si les réactions sont un tableau ou un objet
        if (!Array.isArray(reactions) && typeof reactions !== "object") {
          return res.status(500).json({
            error: "Les réactions doivent être un tableau ou un objet valide",
          });
        }

        // Si c'est un tableau, on va grouper les réactions par `emoji` et compter les occurrences
        let groupedReactions = [];
        let reactionsCount = 0;

        if (Array.isArray(reactions)) {
          // Grouper les réactions par emoji et compter les occurrences
          reactions.forEach((reaction) => {
            const existingReaction = groupedReactions.find(
              (r) => r.emoji === reaction.emoji
            );
            if (existingReaction) {
              existingReaction.count += 1;
            } else {
              groupedReactions.push({
                userId: reaction.userId,
                emoji: reaction.emoji,
                count: 1,
              });
            }
            reactionsCount += 1;
          });
        } else {
          // Si les réactions sont un objet, on les convertit en tableau avec des counts
          Object.keys(reactions).forEach((userId) => {
            const emoji = reactions[userId];
            const existingReaction = groupedReactions.find(
              (r) => r.emoji === emoji
            );
            if (existingReaction) {
              existingReaction.count += 1;
            } else {
              groupedReactions.push({ userId, emoji, count: 1 });
            }
            reactionsCount += 1;
          });
        }

        // Retourner les données avec le nombre total de réactions et le tableau détaillé
        return res.status(200).json({
          success: true,
          reactionsCount,
          reactions: groupedReactions,
        });
      } catch (err) {
        console.error("❌ Erreur JSON :", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de l'analyse des réactions" });
      }
    } catch (error) {
      console.error("❌ Erreur serveur :", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },

  getRecentSuggestion: async (req, res) => {
    try {
      const { url } = req.query;
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth); // Peut être undefined ou -1

      if (!url) {
        return res.status(400).json({ error: "URL manquante." });
      }

      const result = await getRecentSuggestionsByUrl(url, userId); // 👈 on passe quand même userId (peut être null ou -1)
      return res.status(200).json(result);
    } catch (err) {
      console.error("❌ Erreur getRecentSuggestion:", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
  },
};
