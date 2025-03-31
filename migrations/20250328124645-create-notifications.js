"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Notifications", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "Users", // Référence à la table Users
        key: "id",
      },
      onDelete: "CASCADE", // Supprime les notifications associées si l'utilisateur est supprimé
    },
    message: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    read: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
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

  // Ajouter des index pour améliorer les performances
  await queryInterface.addIndex("Notifications", ["userId"]);
  await queryInterface.addIndex("Notifications", ["type"]);
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Notifications");
}
