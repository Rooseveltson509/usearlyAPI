"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Likes", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    targetId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    targetType: {
      type: Sequelize.ENUM("report", "coupDeCoeur", "suggestion"),
      allowNull: false,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });

  // 🔐 Empêcher un utilisateur de liker 2x le même contenu (post/suggestion/coupDeCoeur)
  await queryInterface.addConstraint("Likes", {
    fields: ["userId", "targetId", "targetType"],
    type: "unique",
    name: "unique_user_target_like",
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Likes");
}
