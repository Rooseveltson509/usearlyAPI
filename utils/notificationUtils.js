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

    // 🔥 Enregistre la notification en base
    await db.Notification.create({
      userId,
      message,
      type,
      read: false,
    });

    // (optionnel) Envoie l’email
    func.sendEmail(user.email, "Notification", message);

    console.log(`Notification créée + email envoyé à ${user.email}`);
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi/enregistrement de la notification :",
      error
    );
  }
};
