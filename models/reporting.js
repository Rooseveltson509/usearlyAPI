'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class Reporting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Reporting.belongsTo(models.User, {
        foreignKey: "userId", // Utilisez simplement le nom de la colonne
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Association avec le modèle Ticket
      models.Reporting.hasMany(models.Ticket);

      Reporting.belongsToMany(models.Category, {
        through: 'ReportingCategories',
        foreignKey: 'reportingId',
        as: 'categories',
      });

      // Association avec SiteType
      Reporting.belongsTo(models.SiteType, {
        foreignKey: 'siteTypeId',
        as: 'siteType',
      });

    }
  };
  Reporting.init({
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    userId: DataTypes.UUID,
    //siteTypeId: DataTypes.UUID,
    siteUrl: DataTypes.STRING,
    marque: DataTypes.STRING,
    bugLocation: DataTypes.STRING,
    emojis: DataTypes.STRING,
    description: DataTypes.STRING,
    blocking: DataTypes.BOOLEAN,
    capture: DataTypes.STRING,
    tips: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Reporting',
  });
  return Reporting;
};