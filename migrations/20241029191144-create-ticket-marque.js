"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("TicketMarques", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    ticketId: {
      allowNull: false,
      type: Sequelize.UUID,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      references: {
        model: "Tickets",
        key: "id",
      },
      index: true, // Ajout d'un index
    },
    marqueId: {
      allowNull: false,
      type: Sequelize.UUID,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      references: {
        model: "Marques",
        key: "id",
      },
      index: true, // Ajout d'un index
    },
    title: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    description: {
      allowNull: false,
      type: Sequelize.TEXT("long"), // Utilisation de LONGTEXT
    },
    ticketStatus: {
      type: Sequelize.ENUM,
      values: ["sent", "in progress", "fixed"],
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
  await queryInterface.dropTable("TicketMarques");
}
