"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const tableDescription = await queryInterface.describeTable("Reportings");

  // Vérifiez si la colonne existe déjà
  if (!tableDescription.siteTypeId) {
    await queryInterface.addColumn("Reportings", "siteTypeId", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "SiteTypes", // Table référencée
        key: "id", // Colonne référencée
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  }
}

export async function down(queryInterface) {
  const tableName = "Reportings";
  const constraintName = "Reportings_siteTypeId_foreign_idx";

  // Vérifiez si la contrainte existe
  const [results] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME 
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_NAME = '${tableName}' 
     AND COLUMN_NAME = 'siteTypeId' 
     AND TABLE_SCHEMA = DATABASE();`
  );

  if (results.length > 0) {
    console.log(`Suppression de la contrainte ${constraintName}`);
    await queryInterface.sequelize.query(
      `ALTER TABLE ${tableName} DROP FOREIGN KEY ${constraintName};`
    );
  } else {
    console.log(`La contrainte ${constraintName} n'existe pas, aucune action.`);
  }

  // Suppression de la colonne 'siteTypeId' si elle existe
  await queryInterface.removeColumn(tableName, "siteTypeId").catch(() => {
    console.warn("La colonne 'siteTypeId' est déjà supprimée ou inexistante.");
  });
}
