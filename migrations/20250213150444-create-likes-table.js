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
    postId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "Posts",
        key: "id",
      },
      onDelete: "CASCADE",
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

  // Empêcher un utilisateur de liker plusieurs fois le même post
  await queryInterface.addConstraint("Likes", {
    fields: ["userId", "postId"],
    type: "unique",
    name: "unique_user_post_like",
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Likes");
}
