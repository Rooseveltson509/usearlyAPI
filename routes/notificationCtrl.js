import db from "../models/index.js"; // Import des modèles Sequelize
const { Notification, User } = db;
// Route pour récupérer les notifications non lues de l'utilisateur
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params; // Récupérer l'ID de l'utilisateur dans les paramètres de la route

    // Vérification de l'existence de l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Trouver les notifications non lues de l'utilisateur
    const notifications = await Notification.findAll({
      where: { userId, read: false }, // Récupérer uniquement les notifications non lues
      order: [["createdAt", "DESC"]], // Trier par date de création
    });

    // Répondre avec les notifications
    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications", error);
    return res.status(500).json({
      error: "Erreur interne lors de la récupération des notifications",
    });
  }
};

// Route pour marquer une notification comme lue
export const markNotificationAsRead = async (req, res) => {
  try {
    const { userId } = req.params; // Récupérer l'ID de l'utilisateur dans les paramètres de la route
    const { notificationId } = req.body; // Récupérer l'ID de la notification à marquer comme lue

    // Vérification de l'existence de l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérification de l'existence de la notification
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "Notification non trouvée" });
    }

    // Vérification que la notification appartient bien à l'utilisateur
    if (notification.userId !== userId) {
      return res.status(403).json({
        error:
          "Vous n'avez pas la permission de marquer cette notification comme lue",
      });
    }

    // Mettre à jour la notification comme lue
    await Notification.update(
      { read: true },
      { where: { id: notificationId } }
    );

    // Répondre avec un message de succès
    return res.status(200).json({ message: "Notification marquée comme lue" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification", error);
    return res.status(500).json({
      error: "Erreur interne lors de la mise à jour de la notification",
    });
  }
};

// Route pour créer une notification
export const createNotification = async (req, res) => {
  try {
    const { userId, message, type } = req.body;

    // Vérification de l'existence de l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Créer la notification
    const notification = await Notification.create({
      userId,
      message,
      type, // Le type de la notification (par exemple : "points_earned", "bug_fixed")
    });

    return res.status(201).json(notification);
  } catch (error) {
    console.error("Erreur lors de la création de la notification", error);
    return res
      .status(500)
      .json({ error: "Erreur interne lors de la création de la notification" });
  }
};
