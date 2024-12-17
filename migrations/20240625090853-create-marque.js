"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Marques", {
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
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    name: {
      allowNull: false,
      type: Sequelize.STRING,
      unique: true,
    },
    email: {
      allowNull: false,
      type: Sequelize.STRING,
      unique: true,
    },
    mdp: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    offres: {
      type: Sequelize.ENUM,
      values: ["freemium", "start", "start pro", "premium"],
      defaultValue: "freemium",
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

  // Ajout des index explicitement
  await queryInterface.addIndex("Marques", ["userId"], {
    name: "index_userId",
  });
  await queryInterface.addIndex("Marques", ["name"], { name: "index_name" });
  await queryInterface.addIndex("Marques", ["email"], { name: "index_email" });
}

export async function down(queryInterface) {
  // Suppression des index
  await queryInterface.removeIndex("Marques", "index_userId").catch(() => {});
  await queryInterface.removeIndex("Marques", "index_name").catch(() => {});
  await queryInterface.removeIndex("Marques", "index_email").catch(() => {});

  // Suppression de la table
  await queryInterface.dropTable("Marques").catch(() => {
    console.warn("Table Marques déjà supprimée.");
  });
}
