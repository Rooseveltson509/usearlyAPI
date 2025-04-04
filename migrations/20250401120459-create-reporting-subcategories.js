"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("ReportingSubCategories", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal("(UUID())"),
    },
    reportingId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "Reportings",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    subCategory: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("ReportingSubCategories");
}
