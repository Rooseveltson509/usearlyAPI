"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Posts", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "Users", // Vérifie bien que cette table existe !
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    marqueId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "Marques", // Vérifie bien que cette table existe !
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    reactions: {
      type: Sequelize.JSON, // Stocke un tableau d'objets [{ emoji: "🔥", count: 10 }, { emoji: "❤️", count: 5 }]
      allowNull: false,
      defaultValue: [], // Un post commence sans réactions
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Posts");
}
