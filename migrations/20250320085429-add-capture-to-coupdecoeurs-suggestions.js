"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("CoupDeCoeurs", "capture", {
    type: Sequelize.STRING, // Stocke une URL ou une base64
    allowNull: true, // Peut être null
  });

  await queryInterface.addColumn("Suggestions", "capture", {
    type: Sequelize.STRING,
    allowNull: true,
  });

  // Ajout d'un index pour améliorer la recherche sur la colonne capture
  await queryInterface.addIndex("CoupDeCoeurs", ["capture"], {
    name: "index_capture_coupdecoeurs",
  });

  await queryInterface.addIndex("Suggestions", ["capture"], {
    name: "index_capture_suggestions",
  });
}

export async function down(queryInterface) {
  // Suppression des index
  await queryInterface
    .removeIndex("CoupDeCoeurs", "index_capture_coupdecoeurs")
    .catch(() => {});
  await queryInterface
    .removeIndex("Suggestions", "index_capture_suggestions")
    .catch(() => {});

  // Suppression des colonnes ajoutées
  await queryInterface.removeColumn("CoupDeCoeurs", "capture").catch(() => {
    console.warn("Colonne capture déjà supprimée de CoupDeCoeurs.");
  });

  await queryInterface.removeColumn("Suggestions", "capture").catch(() => {
    console.warn("Colonne capture déjà supprimée de Suggestions.");
  });
}
