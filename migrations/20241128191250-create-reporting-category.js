"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("ReportingCategories", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    reportingId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "Reportings", // Nom exact de la table référencée
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    categoryId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "Categories", // Nom exact de la table référencée
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
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

  await queryInterface.addConstraint("ReportingCategories", {
    fields: ["reportingId", "categoryId"],
    type: "unique",
    name: "unique_reporting_category",
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("ReportingCategories");
}
