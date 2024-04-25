"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
   await queryInterface.sequelize.query(
      "INSERT INTO `designations`( `name`,`createdAt`,`updatedAt`) VALUES ('demo',NOW(),NOW())"
    );

  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
