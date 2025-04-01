import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import { coupDeCoeurSchema } from "../validation/CoupdeCoeurSchema.js";
const { CoupDeCoeur, User } = db;
import { getUserId } from "../utils/jwtUtils.js";
import { Sequelize } from "sequelize";
import { service as siteService } from "../services/siteService.js";

export const coupDeCoeur = {
  /*   createCoupdeCoeur: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId <= 0) {
        return res.status(400).json({ error: "Missing parameters." });
      }

      // Validation des données avec Joi
      const { error } = coupDeCoeurSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const {
        marque,
        description,
        emplacement,
        emoji,
        validated,
        likes,
        dislikes,
      } = req.body;

      // Vérifier si l'utilisateur existe
      const userFound = await User.findOne({ where: { id: userId } });
      if (!userFound) {
        return res.status(403).json({ error: "Access denied." });
      }

      // Créer un nouveau coup de coeur
      const coupDeCoeur = await CoupDeCoeur.create({
        userId: userFound.id,
        marque,
        description,
        emplacement,
        emoji,
        validated,
        likes,
        dislikes,
      });

      return res.status(201).json({
        status: 201,
        success: true,
        message: "Coup de coeur créé avec succès.",
        coupDeCoeurId: coupDeCoeur.id,
      });
    } catch (err) {
      console.error("Erreur lors de la création du coup de coeur :", err);
      return res
        .status(500)
        .json({ error: "An error occurred", details: err.message });
    }
  }, */

  createCoupdeCoeur: async function (req, res) {
    try {
      const userId = getUserId(req.headers["authorization"]);
      if (userId <= 0) {
        return res.status(400).json({ error: "Utilisateur non authentifié." });
      }

      // ✅ Vérifier si les données sont bien reçues
      console.log("📌 Données reçues :", req.body);

      // Validation des données avec Joi
      const { error } = coupDeCoeurSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const userFound = await User.findOne({ where: { id: userId } });
      if (!userFound) {
        return res.status(403).json({ error: "Access denied." });
      }

      const { siteUrl, description, emoji, capture } = req.body; // ✅ Ajout de capture

      if (!siteUrl || !description) {
        return res.status(400).json({ error: "Paramètres manquants." });
      }

      const normalizedUrl = siteService.normalizeUrl(siteUrl);
      const marque = await siteService.extractBrandName(siteUrl);
      const { bugLocation } =
        await siteService.extractBugLocationAndCategories(siteUrl);

      console.log("🔍 Emplacement détecté:", bugLocation);
      console.log("🏷️ Marque détectée:", marque);
      console.log("site normalization:", normalizedUrl);

      // ✅ Vérifier si capture est bien reçu avant de l'enregistrer
      console.log("📸 Capture reçue :", capture ? "OUI" : "NON");

      // ✅ Création du coup de cœur avec capture
      const coupDeCoeur = await CoupDeCoeur.create({
        userId: userFound.id,
        siteUrl,
        marque,
        description,
        emplacement: bugLocation,
        emoji,
        capture, // ✅ Ajout de la capture dans la BDD
      });

      return res.status(201).json({
        status: 201,
        success: true,
        message: "Coup de cœur créé avec succès.",
        coupDeCoeurId: coupDeCoeur.id,
      });
    } catch (err) {
      console.error("❌ Erreur lors de la création du coup de cœur :", err);
      return res
        .status(500)
        .json({ error: "Une erreur est survenue", details: err.message });
    }
  },

  getAllCoupdeCoeur: async function (req, res) {
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
      const { count, rows: coupdeCoeurs } = await CoupDeCoeur.findAndCountAll({
        attributes: [
          "id",
          "marque",
          "emplacement",
          "emoji",
          "description",
          "siteUrl",
          "capture",
          "createdAt",
          "updatedAt",
          [Sequelize.literal("'coupdecoeur'"), "type"], // ✅ Ajoute `type`
        ],
        include: [
          {
            model: User,
            as: "User",
            attributes: ["pseudo", "email", "avatar"],
          },
          /*           {
            model: SiteType,
            as: "siteType",
            attributes: ["name", "description"],
          }, */
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });
      // Ajouter l'en-tête Content-Type
      res.setHeader("Content-Type", "application/json");
      console.log("✅ Signalements récupérés :", coupdeCoeurs);

      const formattedCdc = coupdeCoeurs.map((cdc) => {
        let reactions = [];
        if (
          coupdeCoeurs.reactions &&
          typeof coupdeCoeurs.reactions === "string"
        ) {
          try {
            reactions = JSON.parse(cdc.reactions);
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
          ...cdc.toJSON(),
          type: "signalement",
          reactions: normalizedReactions,
        };
      });

      res.status(200).json({
        totalCoupsdeCoeur: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        coupdeCoeurs: formattedCdc,
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
  addReactionToCdc: async function (req, res) {
    try {
      console.log("📌 Requête reçue pour ajouter une réaction...");
      console.log("📦 Headers :", req.headers);
      console.log("📦 Body reçu :", req.body);
      console.log("📦 Paramètres :", req.params);

      const { coupdecoeurId } = req.params; // Assure-toi que ce nom correspond bien dans ta route
      const { emoji } = req.body;
      const userId = getUserId(req.headers["authorization"]);

      if (!userId) {
        console.error("❌ Erreur : Utilisateur non authentifié.");
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      if (!coupdecoeurId || !emoji) {
        console.error("❌ Erreur : Paramètres manquants.");
        return res.status(400).json({ error: "Paramètres manquants." });
      }

      const coupdeCoeur = await CoupDeCoeur.findByPk(coupdecoeurId);
      if (!coupdeCoeur) {
        console.error("❌ Erreur : Coup de coeur non trouvé.");
        return res.status(404).json({ error: "Coup de coeur non trouvé." });
      }

      // ✅ Vérification et correction des réactions
      let reactions = [];

      if (
        typeof coupdeCoeur.reactions === "string" &&
        coupdeCoeur.reactions.trim() !== ""
      ) {
        try {
          reactions = JSON.parse(coupdeCoeur.reactions);
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
      await coupdeCoeur.update({ reactions: JSON.stringify(reactions) });

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

  // ✅ Récupérer les utilisateurs ayant réagis avec un emoji sur un cdc
  getCdcReactionUsers: async (req, res) => {
    try {
      const { cdcId, emoji } = req.params;
      console.log("🔍 Emoji reçu dans la requête :", emoji);

      // 🔥 Décodage & Normalisation Unicode
      const normalizedEmoji = decodeURIComponent(emoji).normalize("NFC");
      console.log("🔄 Emoji normalisé :", normalizedEmoji);

      const coupDeCoeur = await CoupDeCoeur.findByPk(cdcId);
      if (!coupDeCoeur) {
        return res.status(404).json({ error: "Coup de coeur non trouvée" });
      }

      console.log("🗂 Réactions stockées :", coupDeCoeur.reactions);

      if (!coupDeCoeur.reactions || typeof coupDeCoeur.reactions !== "string") {
        return res.status(200).json({ success: true, users: [] });
      }

      // Transforme en tableau JSON
      let reactions;
      try {
        reactions = JSON.parse(coupDeCoeur.reactions);
      } catch (err) {
        console.error("❌ Erreur JSON :", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de l'analyse des réactions" });
      }

      console.log("✅ Réactions après parsing :", reactions);

      // 🔥 Filtrer les utilisateurs ayant utilisé cet emoji (normalisé)
      const users = reactions
        .filter((r) => r.emoji === normalizedEmoji)
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

  getAllCdcReactions: async function (req, res) {
    try {
      console.log("📌 Récupération des réactions...");

      const { coupdecoeurId } = req.params; // ✅ Correction ici
      console.log("🔍 ID reçu du frontend :", coupdecoeurId);

      const coupDeCoeur = await CoupDeCoeur.findByPk(coupdecoeurId);
      if (!coupDeCoeur) {
        return res.status(404).json({ error: "Coup de cœur non trouvé" });
      }

      console.log("🗂 Réactions stockées dans la BDD :", coupDeCoeur.reactions);

      // ✅ Vérifie si `reactions` est null ou vide avant de le parser
      if (!coupDeCoeur.reactions || typeof coupDeCoeur.reactions !== "string") {
        return res.status(200).json({ success: true, reactions: [] });
      }

      let reactions;
      try {
        reactions = JSON.parse(coupDeCoeur.reactions);
      } catch (err) {
        console.error("❌ Erreur JSON :", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de l'analyse des réactions" });
      }

      console.log("✅ Réactions après parsing :", reactions);

      return res.status(200).json({ success: true, reactions });
    } catch (error) {
      console.error("❌ Erreur serveur :", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },
};
