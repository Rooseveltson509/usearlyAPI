export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("SiteMetadata", "siteTypeId", {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: "SiteTypes", // Assurez-vous que cette table existe ou supprimez la référence
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("SiteMetadata", "siteTypeId");
}
