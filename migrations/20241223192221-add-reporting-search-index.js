"use strict";

export async function up(queryInterface, Sequelize) {
  // Ajout de l'index avec des longueurs spécifiées pour les colonnes TEXT
  await queryInterface.addIndex(
    "Reportings",
    [
      { name: "siteUrl", length: 255 }, // Longueur pour siteUrl
      { name: "bugLocation", length: 100 }, // Longueur pour bugLocation
      { name: "description", length: 255 }, // Longueur pour description
    ],
    {
      name: "idx_reportings_search", // Nom de l'index
      unique: false, // Index non unique
    }
  );
}

export async function down(queryInterface) {
  // Suppression de l'index en cas de rollback
  await queryInterface.removeIndex("Reportings", "idx_reportings_search");
}