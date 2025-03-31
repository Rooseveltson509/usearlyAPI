"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("SiteMetadata", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    siteUrl: {
      allowNull: false,
      type: Sequelize.STRING,
      unique: true,
    },
    siteType: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    categories: {
      allowNull: false,
      type: Sequelize.JSON, // Stocke les catégories sous forme de tableau JSON
      defaultValue: [],
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

  // Ajout d'index pour accélérer les recherches
  await queryInterface.addIndex("SiteMetadata", ["siteUrl"], {
    name: "index_siteUrl",
  });
  await queryInterface.addIndex("SiteMetadata", ["siteType"], {
    name: "index_siteType",
  });
}

export async function down(queryInterface) {
  // Suppression des index
  await queryInterface
    .removeIndex("SiteMetadata", "index_siteUrl")
    .catch(() => {});
  await queryInterface
    .removeIndex("SiteMetadata", "index_siteType")
    .catch(() => {});

  // Suppression de la table
  await queryInterface.dropTable("SiteMetadata").catch(() => {
    console.warn("Table SiteMetadata déjà supprimée.");
  });
}
