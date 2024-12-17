import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
const { CoupDeCoeur, Suggestion, Reporting, Ticket, User } = db;
import { getUserId } from "../utils/jwtUtils.js";

export const adminAction = {
  clearTables: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const adminId = getUserId(headerAuth);

      const admin = await User.findOne({
        where: { id: adminId, role: "admin" },
      });
      if (!admin) {
        return res.status(403).json({ error: "Accès non autorisé." });
      }
      await Ticket.destroy({ where: {} }); // Supprime d'abord les tickets
      await Reporting.destroy({ where: {}, force: true });
      await Suggestion.destroy({ where: {}, force: true });
      await CoupDeCoeur.destroy({ where: {}, force: true });
      console.log(
        "Tables Reportings, Suggestions, et CoupDeCoeurs vidées avec succès."
      );
      return res.status(200).json({ message: "Tables vidées avec succès." });
    } catch (err) {
      console.error("Erreur lors du vidage des tables :", err);
      return res
        .status(500)
        .json({ error: "Impossible de vider les tables.", err });
    }
  },
};
