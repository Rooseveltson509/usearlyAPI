"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("CoupDeCoeurs", {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    userId: {
      type: Sequelize.UUID,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT("long"), // Utilisation de LONGTEXT
      allowNull: false,
    },
    marque: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    emoji: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    emplacement: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    likes: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    validated: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    reactions: {
      type: Sequelize.JSON, // Stocke un tableau d'objets [{ emoji: "🔥", count: 10 }, { emoji: "❤️", count: 5 }]
      allowNull: false,
      defaultValue: [], // Un post commence sans réactions
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("CoupDeCoeurs");
}
