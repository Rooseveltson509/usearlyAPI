import db from "../models/index.js"; // Import des modèles Sequelize
const { Comment, User, CoupDeCoeur } = db;
import { getUserId } from "../utils/jwtUtils.js";

export const commentCdc = {
  // 📌 Ajouter un commentaire à un CoupDeCoeur (CDC)
  addCommentToCdc: async function (req, res) {
    try {
      const { coupDeCoeurId } = req.params;
      const { content } = req.body;

      // Récupérer l'authentification de l'utilisateur
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId < 0) {
        return res.status(400).json({ error: "missing parameters" });
      }

      if (!content.trim()) {
        return res
          .status(400)
          .json({ error: "Le commentaire ne peut pas être vide." });
      }

      // Vérifier si le CoupDeCoeur existe
      const coupDeCoeur = await CoupDeCoeur.findByPk(coupDeCoeurId);
      if (!coupDeCoeur) {
        return res.status(404).json({ error: "CoupDeCoeur non trouvé." });
      }

      // Créer le commentaire
      const comment = await Comment.create({
        content,
        coupDeCoeurId,
        userId,
      });

      // Récupérer le commentaire avec l'auteur
      const commentWithUser = await Comment.findByPk(comment.id, {
        include: {
          model: User,
          as: "author",
          attributes: ["id", "pseudo", "avatar"],
        },
      });

      res.status(201).json({ success: true, comment: commentWithUser });
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire :", error);
      res.status(500).json({ error: "Erreur serveur." });
    }
  },

  // 📌 Récupérer les commentaires d'un CoupDeCoeur avec pagination
  getCdcComments: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId < 0) {
        return res.status(400).json({ error: "missing parameters" });
      }

      const { coupDeCoeurId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10; // ⚡ 10 commentaires par page
      const offset = (page - 1) * limit;

      // Vérifier si le CoupDeCoeur existe
      const coupDeCoeur = await CoupDeCoeur.findByPk(coupDeCoeurId);
      if (!coupDeCoeur) {
        return res.status(404).json({ error: "CoupDeCoeur non trouvé." });
      }

      // Récupérer les commentaires avec pagination
      const { count, rows: comments } = await Comment.findAndCountAll({
        where: { coupDeCoeurId },
        include: {
          model: User,
          as: "author",
          attributes: ["id", "pseudo", "avatar"],
        },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      // ✅ Réponse optimisée avec pagination
      res.status(200).json({
        success: true,
        totalComments: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        comments,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires :", error);
      res.status(500).json({ error: "Erreur serveur." });
    }
  },

  // 📌 Supprimer un commentaire d'un CoupDeCoeur
  deleteCommentFromCdc: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId < 0) {
        return res.status(400).json({ error: "missing parameters" });
      }
      const { commentId } = req.params;

      // ✅ Vérifier si l'utilisateur existe
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé." });
      }

      // ✅ Trouver le commentaire avant de vérifier ses propriétés
      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({ error: "Commentaire non trouvé." });
      }

      // ✅ Vérifier si l'utilisateur est l'auteur du commentaire OU un admin
      if (comment.userId !== userId && user.role !== "admin") {
        return res.status(403).json({ error: "Action non autorisée." });
      }

      // ✅ Supprimer le commentaire
      await comment.destroy();
      res.status(200).json({ success: true, message: "Commentaire supprimé." });
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire :", error);
      res.status(500).json({ error: "Erreur serveur." });
    }
  },
};
