"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Reportings", "siteMetadataId", {
    type: Sequelize.UUID,
    allowNull: true, // Peut être null pour les anciens signalements
    references: {
      model: "SiteMetadata",
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Reportings", "siteMetadataId");
}
