import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
const { User, Post, Marque } = db;
import { getUserId } from "../utils/jwtUtils.js"; // Fonction pour récupérer l'ID utilisateur depuis le token
import { postSchema } from "../validation/postValidation.js"; // Validation avec Joi

export const posts = {
  // 📌 Créer un post
  // ✅ Créer un post
  createPost: async (req, res) => {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      // Validation avec Joi
      const { error } = postSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { title, content, marqueId } = req.body;

      // Vérifier si l'utilisateur existe
      const userFound = await User.findByPk(userId);
      if (!userFound) {
        return res.status(403).json({ error: "Utilisateur introuvable" });
      }

      // Création du post
      const post = await Post.create({
        userId: userFound.id,
        title,
        content,
        marqueId: marqueId || null, // ✅ Assure-toi que `null` est accepté
      });

      return res.status(201).json({
        status: 201,
        success: true,
        message: "Post créé avec succès.",
        post,
      });
    } catch (err) {
      console.error("Erreur lors de la création du post :", err);
      return res.status(500).json({ error: "Une erreur est survenue" });
    }
  },

  // 📌 Récupérer tous les posts
  getAllPosts: async (req, res) => {
    try {
      // Récupérer les paramètres de pagination avec des valeurs par défaut
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5; // 5 posts par page par défaut
      const offset = (page - 1) * limit;

      // Récupérer les posts avec pagination
      const { count, rows: posts } = await Post.findAndCountAll({
        limit,
        offset,
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "pseudo", "avatar"],
          },
          {
            model: Marque,
            as: "brand",
            attributes: ["id", "name", "avatar"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Retourner les posts avec les infos de pagination
      res.status(200).json({
        totalPosts: count, // Nombre total de posts
        totalPages: Math.ceil(count / limit), // Nombre total de pages
        currentPage: page,
        posts,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des posts :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 📌 Récupérer un post par son ID
  getPostById: async function (req, res) {
    try {
      const post = await Post.findByPk(req.params.id, {
        include: [{ model: User, as: "author", attributes: ["id", "pseudo"] }],
      });

      if (!post) {
        return res.status(404).json({ error: "Post introuvable." });
      }

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Post récupéré avec succès.",
        post,
      });
    } catch (err) {
      console.error("Erreur lors de la récupération du post :", err);
      return res
        .status(500)
        .json({ error: "An error occurred", details: err.message });
    }
  },

  // 📌 Mettre à jour un post
  updatePost: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId <= 0) {
        return res.status(400).json({ error: "Missing parameters." });
      }

      const { error } = postSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { title, content, brand } = req.body;

      const post = await Post.findByPk(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post introuvable." });
      }

      // Vérification que l'utilisateur est bien l'auteur du post
      if (post.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Non autorisé à modifier ce post." });
      }

      await post.update({ title, content, brand });

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Post mis à jour avec succès.",
        post,
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour du post :", err);
      return res
        .status(500)
        .json({ error: "An error occurred", details: err.message });
    }
  },

  // 📌 Supprimer un post
  deletePost: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId <= 0) {
        return res.status(400).json({ error: "Missing parameters." });
      }

      const post = await Post.findByPk(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post introuvable." });
      }

      // Vérification que l'utilisateur est bien l'auteur
      if (post.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Non autorisé à supprimer ce post." });
      }

      await post.destroy();

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Post supprimé avec succès.",
      });
    } catch (err) {
      console.error("Erreur lors de la suppression du post :", err);
      return res
        .status(500)
        .json({ error: "An error occurred", details: err.message });
    }
  },
};
