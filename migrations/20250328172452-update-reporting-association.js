"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface) {
  // Ajouter une contrainte de clé étrangère pour `userId` si elle existe déjà
  await queryInterface.addConstraint("Reportings", {
    fields: ["userId"],
    type: "foreign key",
    name: "fk_reporting_user", // Nom de la contrainte
    references: {
      table: "Users",
      field: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
}

export async function down(queryInterface) {
  // Supprimer la contrainte de clé étrangère
  await queryInterface.removeConstraint("Reportings", "fk_reporting_user");
}
