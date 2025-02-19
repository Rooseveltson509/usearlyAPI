"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Comments", "reportId", {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: "Reportings",
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  await queryInterface.addColumn("Comments", "suggestionId", {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: "Suggestions",
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  await queryInterface.addColumn("Comments", "coupDeCoeurId", {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: "CoupDeCoeurs",
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Comments", "reportId");
  await queryInterface.removeColumn("Comments", "suggestionId");
  await queryInterface.removeColumn("Comments", "coupDeCoeurId");
}
