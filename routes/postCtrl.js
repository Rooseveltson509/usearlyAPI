import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import { Op } from "sequelize";
import { getUserId } from "../utils/jwtUtils.js"; // Fonction pour récupérer l'ID utilisateur depuis le token
import { postSchema } from "../validation/postValidation.js"; // Validation avec Joi
const { User, Post, Marque, Like, Comment } = db;

export const posts = {
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
        marqueId: marqueId || null, // ✅ Assure que `null` est accepté
        likes: 0, // ✅ Initialisation du nombre de likes
        reactions: [], // ✅ Initialisation des réactions comme un tableau vide
      });

      // 🔥 **On récupère maintenant le post avec les relations complètes**
      const fullPost = await Post.findByPk(post.id, {
        include: [
          {
            model: User,
            as: "author", // 🔥 Inclut l'auteur avec pseudo et avatar
            attributes: ["id", "pseudo", "avatar"],
          },
          {
            model: Marque,
            as: "brand", // 🔥 Inclut la marque si elle existe
            attributes: ["id", "name", "avatar"],
          },
        ],
      });

      return res.status(201).json({
        status: 201,
        success: true,
        message: "Post créé avec succès.",
        post: fullPost, // ✅ Maintenant on envoie le post avec toutes ses infos
      });
    } catch (err) {
      console.error("Erreur lors de la création du post :", err);
      return res.status(500).json({ error: "Une erreur est survenue" });
    }
  },

  toggleLike: async (req, res) => {
    try {
      const { postId } = req.params;
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const post = await Post.findByPk(postId, {
        include: [{ model: Like, as: "postLikes" }],
      });

      if (!post) {
        return res.status(404).json({ error: "Post non trouvé" });
      }

      // Vérifie si l'utilisateur a déjà liké
      const existingLike = await Like.findOne({
        where: { userId, postId },
      });

      let userLiked;
      if (existingLike) {
        await existingLike.destroy();
        userLiked = false;
      } else {
        await Like.create({ userId, postId });
        userLiked = true;
      }

      // Compte les likes mis à jour
      const likeCount = await Like.count({ where: { postId } });

      return res.status(200).json({
        success: true,
        likeCount, // 🔥 Le vrai nombre de likes
        userLiked, // 🔥 L'état exact du like de l'utilisateur
      });
    } catch (err) {
      console.error("Erreur lors du toggle like :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // ✅ Récupérer tous les posts avec pagination et réactions parsées
  getAllPosts: async (req, res) => {
    try {
      console.log("🔄 Requête reçue pour récupérer les posts...");

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const offset = (page - 1) * limit;

      console.log(`📌 Page: ${page}, Limit: ${limit}`);

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
          {
            model: Like,
            as: "postLikes",
            attributes: ["userId"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      console.log("✅ Posts récupérés :", posts);

      const formattedPosts = posts.map((post) => ({
        ...post.toJSON(),
        likeCount: post.postLikes ? post.postLikes.length : 0,
        reactions:
          post.reactions && typeof post.reactions === "string"
            ? JSON.parse(post.reactions)
            : [], // ✅ Vérifie que post.reactions est bien une chaîne JSON
      }));

      console.log("📤 Réponse envoyée :", formattedPosts);

      res.status(200).json({
        totalPosts: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        posts: formattedPosts,
      });
    } catch (error) {
      console.error("❌ Erreur serveur :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // ✅ Ajouter ou supprimer une réaction sur un post
  addReaction: async (req, res) => {
    try {
      const { postId } = req.params;
      const { emoji } = req.body;
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const post = await Post.findByPk(postId);
      if (!post) {
        return res.status(404).json({ error: "Post non trouvé" });
      }

      let reactions =
        typeof post.reactions === "string"
          ? JSON.parse(post.reactions)
          : post.reactions || [];

      // Vérifie si l'utilisateur a déjà réagi
      const existingIndex = reactions.findIndex((r) => r.userId === userId);

      if (existingIndex !== -1) {
        if (reactions[existingIndex].emoji === emoji) {
          reactions.splice(existingIndex, 1); // Supprime la réaction
        } else {
          reactions[existingIndex].emoji = emoji; // Change la réaction
        }
      } else {
        reactions.push({ userId, emoji, count: 1 });
      }

      console.log("✅ Réactions mises à jour :", reactions);

      await post.update({ reactions: JSON.stringify(reactions) }); // 🔥 Stocke en JSON stringifié

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

  // ✅ Récupérer les utilisateurs ayant réagis avec un emoji sur un post
  getReactionUsers: async (req, res) => {
    try {
      const { postId, emoji } = req.params;
      console.log(
        "🔍 Requête reçue pour le post :",
        postId,
        "et emoji :",
        emoji
      );

      const post = await Post.findByPk(postId);
      if (!post) {
        return res.status(404).json({ error: "Post non trouvé" });
      }

      console.log("🗂 Réactions stockées :", post.reactions);

      // Vérifie que les réactions existent et sont bien un tableau
      if (!post.reactions || typeof post.reactions !== "string") {
        return res.status(200).json({ success: true, users: [] });
      }

      // Transforme en tableau JSON
      let reactions;
      try {
        reactions = JSON.parse(post.reactions);
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

  getAllPostReactions: async function (req, res) {
    try {
      console.log("📌 Récupération des réactions pour un post...");

      const { postId } = req.params;

      const post = await Post.findByPk(postId);
      if (!post) {
        return res.status(404).json({ error: "Post non trouvé" });
      }

      console.log("🗂 Réactions stockées dans la BDD :", post.reactions);

      // ✅ Vérifie si `post.reactions` est null ou vide
      if (!post.reactions || typeof post.reactions !== "string") {
        return res.status(200).json({ success: true, reactions: [] });
      }

      let reactions;
      try {
        reactions = JSON.parse(post.reactions);
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

  //📌 Supprimer un post (utilisateur = son post / admin = tous les posts)
  deletePost: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (!userId) {
        return res.status(400).json({ error: "Utilisateur non authentifié." });
      }

      const post = await Post.findByPk(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post introuvable." });
      }

      // 🔍 Récupérer l'utilisateur pour vérifier son rôle
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur introuvable." });
      }

      // ✅ Vérification : l'utilisateur peut supprimer son post OU l'admin peut tout supprimer
      if (post.userId !== userId && user.role !== "admin") {
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
      console.error("❌ Erreur lors de la suppression du post :", err);
      return res
        .status(500)
        .json({ error: "Une erreur est survenue", details: err.message });
    }
  },

  getFilteredPosts: async (req, res) => {
    try {
      const { filter, search, sort } = req.query;

      console.log("🛠 Filtre reçu :", filter);
      console.log("🔎 Recherche :", search);
      console.log("📌 Tri :", sort);

      let whereClause = {};

      // ✅ Filtrer par type (Actualité, Signalements, Coup de Cœur, Suggestions)
      if (filter) {
        whereClause.category = filter; // Assure-toi que ta colonne "category" existe dans le modèle Post
      }

      // ✅ Filtrer par recherche
      if (search) {
        whereClause.title = { [Op.like]: `%${search}%` }; // Recherche dans le titre des posts
      }

      let orderClause = [["createdAt", "DESC"]]; // Par défaut : tri par date

      // ✅ Tri personnalisé
      if (sort === "Popularité") {
        orderClause = [["likes", "DESC"]]; // Trie par nombre de likes
      } else if (sort === "Commentaires") {
        orderClause = [["commentCount", "DESC"]]; // Trie par nombre de commentaires (ajoute ce champ dans ton modèle si besoin)
      }

      // 📌 Récupérer les posts filtrés
      const posts = await Post.findAll({
        where: whereClause,
        order: orderClause,
      });

      return res.status(200).json(posts);
    } catch (error) {
      console.error("❌ Erreur serveur :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  getPostCommentCount: async (req, res) => {
    try {
      const { postId } = req.params;

      // Vérifie si postId est valide
      if (!postId) {
        return res.status(400).json({ error: "Post ID manquant." });
      }

      // 📌 Utilisation du bon modèle (Comment)
      const commentCount = await Comment.count({
        where: { postId }, // Vérifie que les commentaires sont liés à ce post
      });

      return res.status(200).json({ count: commentCount });
    } catch (error) {
      console.error("❌ Erreur serveur :", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },
};
