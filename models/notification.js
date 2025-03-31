"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Définir les associations
      Notification.belongsTo(models.User, {
        foreignKey: "userId", // Référence à la table User
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Associer avec d'autres modèles si nécessaire (ex. reporting ou d'autres types de notifications)
    }
  }

  Notification.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Utilise UUID comme clé primaire
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users", // Référence à la table Users
          key: "id",
        },
        onDelete: "CASCADE",
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false, // Le message de la notification
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false, // Type de la notification (par exemple : "points_earned", "bug_fixed", etc.)
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Le statut de lecture de la notification
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Date de création
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Date de mise à jour
      },
    },
    {
      sequelize,
      modelName: "Notification", // Nom du modèle
      tableName: "Notifications", // Nom de la table
    }
  );

  return Notification;
};
