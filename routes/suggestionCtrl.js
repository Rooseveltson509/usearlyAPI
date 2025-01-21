import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import { suggestionSchema } from "../validation/SuggestionSchema.js";
import { getUserId } from "../utils/jwtUtils.js";
const { User, Suggestion } = db;

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

      const { marque, description, emplacement, likes, dislikes } = req.body;

      // Vérifier si l'utilisateur existe
      const userFound = await User.findOne({ where: { id: userId } });
      if (!userFound) {
        return res.status(403).json({ error: "Access denied." });
      }

      // Créer une nouvelle suggestion
      const suggestion = await Suggestion.create({
        userId: userFound.id,
        marque,
        emplacement,
        description,
        likes,
        dislikes,
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
          "description",
          "nbrLikes",
          "nbrDislikes",
          "createdAt",
          "updatedAt",
        ],
        include: [
          {
            model: User,
            as: "User",
            attributes: ["pseudo", "email"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });
      // Ajouter l'en-tête Content-Type
      res.setHeader("Content-Type", "application/json");
      // Retourner les reportings avec pagination
      return res.status(200).json({
        totalSuggestion: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        suggestions,
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
};
