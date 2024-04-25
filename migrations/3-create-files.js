"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("files", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      preview: {
        type: Sequelize.TEXT("long"),
        allowNulls: true,
      },
      filename: {
        type: Sequelize.STRING,
        allowNulls: false,
      },
      extension: {
        type: Sequelize.STRING,
        allowNulls: false,
      },
      transcription:{
        type: Sequelize.TEXT("long"),
        allowNulls: true,
      },
      folderId:{
        type: Sequelize.INTEGER,
        allowNulls: false,
      },
      moreInfo: {
        type: Sequelize.STRING,
        allowNulls: true,
      
      },
      deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      size:{
        type: Sequelize.INTEGER,
        allowNulls: false,
      },  
      createdAt: {
        allowNull: true,
        type: Sequelize.DATE,
        
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      
      }
    }); 
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("files");
  },
};
