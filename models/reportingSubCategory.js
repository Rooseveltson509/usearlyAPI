import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class ReportingSubCategory extends Model {
    static associate(models) {
      ReportingSubCategory.belongsTo(models.Reporting, {
        foreignKey: "reportingId",
        as: "reporting",
        onDelete: "CASCADE",
      });
    }
  }

  ReportingSubCategory.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      reportingId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      subCategory: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: true, // ou false si tu veux rendre obligatoire plus tard
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ReportingSubCategory",
      tableName: "ReportingSubCategories",
    }
  );

  return ReportingSubCategory;
};
