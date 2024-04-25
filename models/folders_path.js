"use strict";
const { Model } = require("sequelize");
const dateResolve = require("../dateResolve");
module.exports = (sequelize, DataTypes) => {
  class folders_path extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
     
  }
  folders_path.init(
    {
      path:{
        type: DataTypes.STRING,
        unique: {
          path: 'path',
          msg: "This folder path is already added.",
          fields: [sequelize.fn('lower', sequelize.col('path'))]
        },
      },
      folder_name: DataTypes.STRING,
    },
    {
      sequelize,
      hooks: {
        beforeCreate: function (folder_path, options) {
          folder_path.createdAt = dateResolve.getDate();
        },
        beforeUpdate: function (folder_path, options) {
          folder_path.updatedAt = dateResolve.getDate();
        },
      },
      modelName: "folders_path",
      freezeTableName: true
    }
  );

  return folders_path;
};
