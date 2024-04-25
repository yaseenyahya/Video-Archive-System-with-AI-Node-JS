"use strict";
const { Model } = require("sequelize");
const dateResolve = require("../dateResolve");
module.exports = (sequelize, DataTypes) => {
  class Files extends Model {
    static associate(models) {
     
    }
  }
  Files.init(
    {
      preview: DataTypes.TEXT("long"),
      filename: DataTypes.STRING,
      extension: DataTypes.STRING,
      transcription: DataTypes.TEXT("long"),
      folderId: DataTypes.INTEGER,
      moreInfo:DataTypes.STRING,
      deleted: DataTypes.BOOLEAN,
      createdAt:DataTypes.DATE,
      size: DataTypes.INTEGER,
    },
    {
      sequelize,
      hooks: {
        beforeBulkCreate: function (files, options) {      
          files.forEach((file) => {

            if (!file.createdAt)   file.createdAt = dateResolve.getDate();

          });
        },
        beforeCreate: function (file, options) {
          if (!file.createdAt) file.createdAt = dateResolve.getDate();
 
        },
        beforeUpdate: function (file, options) {

          file.updatedAt = dateResolve.getDate();
          
        },
      },
      modelName: "files",
      timestamps:false
    }
  );
  return Files;
};
