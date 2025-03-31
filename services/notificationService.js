import db from "../models/index.js";
import { func } from "../funcs/functions.js";

export const sendNotificationToUser = async (
  userId,
  message,
  type = "info"
) => {
  try {
    const user = await db.User.findByPk(userId);
    if (!user) {
      console.log(`Utilisateur non trouvé pour l'ID: ${userId}`);
      return;
    }

    // Enregistrement de la notification dans la base
    await db.Notification.create({
      userId,
      message,
      type, // Exemple : "bug_resolved", "points_earned", etc.
      read: false, // Non lue par défaut
    });

    // Envoi facultatif de l’email
    func.sendEmail(user.email, "Notification", message);

    console.log(
      `Notification enregistrée et envoyée à ${user.email}: ${message}`
    );
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi/enregistrement de la notification :",
      error
    );
  }
};
