"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("view_history", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.STRING,
        allowNulls: false
      },
      fileId:{
        type: Sequelize.STRING,
        allowNulls: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("view_history");
  },
};
