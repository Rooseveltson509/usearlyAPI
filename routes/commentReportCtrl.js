import db from "../models/index.js"; // Import des modèles Sequelize
const { Comment, User, Reporting } = db;
import { getUserId } from "../utils/jwtUtils.js";

export const commentReport = {
  // 📌 Ajouter un commentaire à un Report
  addCommentToReport: async function (req, res) {
    try {
      const { reportId } = req.params;
      const { content } = req.body;

      // Récupérer l'authentification de l'utilisateur
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId < 0) {
        return res.status(400).json({ error: "missing parameters" });
      }

      if (!content) {
        return res
          .status(400)
          .json({ error: "Le commentaire ne peut pas être vide." });
      }

      const report = await Reporting.findByPk(reportId);
      if (!report) {
        return res.status(404).json({ error: "Report non trouvé." });
      }

      const comment = await Comment.create({
        content,
        reportId,
        userId,
      });

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

  // 📌 Récupérer les commentaires d'un Report avec pagination
  getReportComments: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId < 0) {
        return res.status(400).json({ error: "missing parameters" });
      }

      const { reportId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10; // ⚡ 10 commentaires par page
      const offset = (page - 1) * limit;

      // Vérifier si le report existe
      const report = await Reporting.findByPk(reportId);
      if (!report) {
        return res.status(404).json({ error: "Report non trouvé." });
      }

      // Récupérer les commentaires avec pagination
      const { count, rows: comments } = await Comment.findAndCountAll({
        where: { reportId },
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

  // 📌 Supprimer un commentaire d'un Report
  deleteCommentFromReport: async function (req, res) {
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
