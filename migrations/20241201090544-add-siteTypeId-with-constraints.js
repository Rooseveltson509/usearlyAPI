'use strict';
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const tableDescription = await queryInterface.describeTable('Reportings');

  // Vérifiez si la colonne existe déjà
  if (!tableDescription.siteTypeId) {
    await queryInterface.addColumn('Reportings', 'siteTypeId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'SiteTypes', // Table référencée
        key: 'id', // Colonne référencée
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  }
}

export async function down(queryInterface, Sequelize) {
  const tableDescription = await queryInterface.describeTable('Reportings');

  // Vérifiez si la colonne existe avant de la supprimer
  if (tableDescription.siteTypeId) {
    await queryInterface.removeColumn('Reportings', 'siteTypeId');
  }
}


