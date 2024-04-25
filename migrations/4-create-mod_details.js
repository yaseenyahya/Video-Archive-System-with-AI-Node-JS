"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("mod_details", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      fileId: {
        type: Sequelize.INTEGER,
        allowNulls: false    
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNulls: false    
      },
      transcriptionText: {
        type: Sequelize.TEXT("long"),
        allowNulls: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    }); 
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("mod_details");
  },
};
