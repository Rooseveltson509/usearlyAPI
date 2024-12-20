"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Tickets", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    reportingId: {
      allowNull: false,
      type: Sequelize.UUID,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      references: {
        model: "Reportings",
        key: "id",
      },
      index: true, // Ajoout d'un index
    },
    email: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    marque: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    title: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    category: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    blocking: {
      type: Sequelize.ENUM,
      values: ["yes", "no"],
      defaultValue: "no",
    },
    emojis: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    bugLocation: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    tips: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    response: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    ticketStatus: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    configuration: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    criticality: {
      type: Sequelize.ENUM,
      values: ["mineur", "majeur", "critique"],
      defaultValue: "mineur",
    },
    validateAt: {
      allowNull: true,
      type: Sequelize.DATE,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  });
}
export async function down(queryInterface) {
  await queryInterface.dropTable("Tickets");
}
