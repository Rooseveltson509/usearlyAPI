export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn("ReportTimelineSteps", "status", {
    type: Sequelize.ENUM("done", "active", "upcoming", "review"),
    allowNull: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn("ReportTimelineSteps", "status", {
    type: Sequelize.ENUM("done", "active", "upcoming"),
    allowNull: false,
  });
}
