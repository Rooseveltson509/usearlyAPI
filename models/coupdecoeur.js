"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class CoupDeCoeur extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CoupDeCoeur.belongsTo(models.User, {
        foreignKey: "userId", // Utilisez simplement le nom de la colonne
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  CoupDeCoeur.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: DataTypes.UUID,
      marque: DataTypes.STRING,
      description: DataTypes.TEXT("long"),
      emplacement: DataTypes.STRING,
      emoji: DataTypes.STRING,
      likes: DataTypes.INTEGER,
      validated: DataTypes.BOOLEAN,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "CoupDeCoeur",
    }
  );
  return CoupDeCoeur;
};
