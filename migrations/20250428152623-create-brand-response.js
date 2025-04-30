"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("BrandResponse", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    reportId: {
      allowNull: false,
      type: Sequelize.UUID,
      references: {
        model: "Reportings",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    marqueId: {
      allowNull: false,
      type: Sequelize.UUID,
      references: {
        model: "Marques",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    message: {
      allowNull: false,
      type: Sequelize.TEXT,
    },
    brandName: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    authorName: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    authorRole: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    authorAvatarUrl: {
      allowNull: true,
      type: Sequelize.STRING,
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

  // (Optionnel) Tu peux ajouter un index sur reportId pour optimiser les recherches
  await queryInterface.addIndex("BrandResponse", ["reportId"]);
}

export async function down(queryInterface) {
  await queryInterface.dropTable("BrandResponse");
}
