/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("ReportingDescriptions", "emoji", {
    type: Sequelize.STRING, // ou Sequelize.JSON si plusieurs emojis
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("ReportingDescriptions", "emoji");
}
