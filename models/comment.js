"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * Cette méthode est appelée automatiquement par le fichier `models/index.js`.
     */
    static associate(models) {
      // 📌 Un Commentaire appartient à un Post
      Comment.belongsTo(models.Post, {
        foreignKey: "postId",
        as: "post",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // 📌 Un Commentaire appartient à un Utilisateur
      Comment.belongsTo(models.User, {
        foreignKey: "userId",
        as: "author",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  Comment.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      postId: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: "Posts",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      userId: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false, // ✅ Le commentaire ne peut pas être vide
        validate: {
          len: [1, 500], // ✅ Min 1 caractère, max 500
        },
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Comment",
    }
  );

  return Comment;
};
