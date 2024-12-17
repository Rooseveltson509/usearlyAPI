"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Reportings", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    userId: {
      allowNull: false,
      type: Sequelize.UUID,
      references: {
        model: "Users", // Table Users
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    siteUrl: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    marque: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    bugLocation: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    emojis: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    description: {
      allowNull: false,
      type: Sequelize.TEXT("long"),
    },
    blocking: {
      type: Sequelize.ENUM,
      values: ["yes", "no"],
      defaultValue: "no",
    },
    tips: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    capture: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ),
    },
  });
}

export async function down(queryInterface) {
  // Suppression complète de la table Reportings
  await queryInterface.dropTable("Reportings");
}
