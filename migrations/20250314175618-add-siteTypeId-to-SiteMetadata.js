"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  // Vérifier si la colonne existe déjà
  const tableDesc = await queryInterface.describeTable("SiteMetadata");

  if (!tableDesc.siteTypeId) {
    // Si la colonne n'existe pas, on l'ajoute
    await queryInterface.addColumn("SiteMetadata", "siteTypeId", {
      type: Sequelize.UUID,
      allowNull: true, // Permet d'avoir des valeurs NULL au début
      references: {
        model: "SiteTypes",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Ajout d'un index pour améliorer les performances des requêtes
    await queryInterface.addIndex("SiteMetadata", ["siteTypeId"], {
      name: "index_siteTypeId",
    });
  } else {
    console.log(
      "⚠️ La colonne `siteTypeId` existe déjà dans `SiteMetadata`, pas de modification."
    );
  }
}

export async function down(queryInterface) {
  const tableDesc = await queryInterface.describeTable("SiteMetadata");

  if (tableDesc.siteTypeId) {
    await queryInterface
      .removeIndex("SiteMetadata", "index_siteTypeId")
      .catch(() => {});
    await queryInterface
      .removeColumn("SiteMetadata", "siteTypeId")
      .catch(() => {});
  }
}
