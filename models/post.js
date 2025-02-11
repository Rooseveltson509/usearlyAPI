"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Définition des associations.
     */
    static associate(models) {
      Post.belongsTo(models.User, {
        foreignKey: "userId",
        as: "author", // Alias pour accéder à l'utilisateur
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Post.belongsTo(models.Marque, { foreignKey: "marqueId", as: "brand" });
    }
  }

  Post.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [3, 255], // ✅ Le titre doit être entre 3 et 255 caractères
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true, // ✅ Vérifie que le contenu n'est pas vide
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users", // ✅ Assurez-vous que la table Users existe
          key: "id",
        },
      },
      marqueId: {
        // ✅ Ajout de la clé étrangère
        type: DataTypes.UUID,
        references: {
          model: "Marques",
          key: "id",
        },
        allowNull: true, // Optionnel si tous les posts n'ont pas de marque
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Post",
    }
  );

  return Post;
};
