"use strict";
const { Model } = require("sequelize");
const dateResolve = require("../dateResolve");
module.exports = (sequelize, DataTypes) => {
  class designations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
     static associate(models) {
      designations.belongsTo(models.users, {
        foreignKey: "id",
        allowNull: false,
      });
    }
  }
  designations.init(
    {
      name:{
        type: DataTypes.STRING,
        unique: {
          name: 'name',
          msg: "This designation is already added.",
          fields: [sequelize.fn('lower', sequelize.col('name'))]
        },
      }
    },
    {
      sequelize,
      hooks: {
        beforeCreate: function (designation, options) {
          designation.createdAt = dateResolve.getDate();
        },
        beforeUpdate: function (user, options) {
          designation.updatedAt =  dateResolve.getDate();
        },
      },
      modelName: "designations",
    }
  );

  return designations;
};
