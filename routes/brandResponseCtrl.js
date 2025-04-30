"use strict";
import db from "../models/index.js";
import { getBrandId } from "../utils/jwtUtils.js";

const { BrandResponse, Reporting, Marque } = db;

export const brandResponseCtrl = {
  createBrandReply: async (req, res) => {
    try {
      const { reportId } = req.params;
      const { message } = req.body;

      if (!message) {
        return res
          .status(400)
          .json({ success: false, message: "Message requis." });
      }

      const brandId = getBrandId(req.headers["authorization"]);

      if (!brandId) {
        return res
          .status(401)
          .json({ success: false, message: "Marque non authentifiée." });
      }

      const brand = await Marque.findByPk(brandId);

      if (!brand) {
        return res
          .status(403)
          .json({ success: false, message: "Marque introuvable." });
      }

      const report = await Reporting.findOne({
        where: {
          id: reportId,
          marque: brand.name,
        },
      });

      if (!report) {
        return res
          .status(404)
          .json({ success: false, message: "Signalement introuvable." });
      }

      // 🔥 Vérifie si une réponse existe déjà pour ce report et cette marque
      const existingReply = await BrandResponse.findOne({
        where: { reportId, marqueId: brand.id },
      });

      if (existingReply) {
        // 🔥 Si déjà existante ➔ On update le message
        existingReply.message = message;
        existingReply.updatedAt = new Date();
        await existingReply.save();

        return res
          .status(200)
          .json({ success: true, data: existingReply, updated: true });
      }

      // 🔥 Sinon ➔ On crée une nouvelle réponse
      const newReply = await BrandResponse.create({
        reportId,
        marqueId: brand.id,
        message,
        brandName: brand.name,
        authorName: brand.name,
        authorRole: "Community Manager",
        authorAvatarUrl: brand.avatar,
      });

      return res
        .status(201)
        .json({ success: true, data: newReply, created: true });
    } catch (error) {
      console.error("❌ Erreur création/mise à jour réponse marque :", error);
      return res
        .status(500)
        .json({ success: false, message: "Erreur serveur." });
    }
  },

  getBrandReplyByReport: async (req, res) => {
    try {
      const { id } = req.params; // reportId

      const reply = await BrandResponse.findOne({
        where: { reportId: id },
        include: [
          {
            model: Marque,
            as: "marque",
            attributes: ["id", "name", "avatar"],
          },
        ],
      });

      if (!reply) {
        return res.status(404).json({
          success: false,
          message: "Aucune réponse pour ce signalement.",
        });
      }

      return res.status(200).json({
        brandName: reply.brandName,
        message: reply.message,
        author: {
          name: reply.authorName,
          role: reply.authorRole,
          avatarUrl: reply.authorAvatarUrl,
        },
        marque: {
          id: reply.marque?.id,
          name: reply.marque?.name,
          avatar: reply.marque?.avatar,
        },
      });
    } catch (error) {
      console.error("❌ Erreur récupération réponse :", error);
      return res
        .status(500)
        .json({ success: false, message: "Erreur serveur." });
    }
  },
};
