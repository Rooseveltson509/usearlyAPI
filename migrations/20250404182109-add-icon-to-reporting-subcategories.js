export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("ReportingSubCategories", "icon", {
    type: Sequelize.STRING,
    allowNull: true, // Facultatif, évite les erreurs sur les anciennes lignes
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("ReportingSubCategories", "icon");
}
