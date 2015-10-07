'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    //return queryInterface.addColumn('hostgroups', 'desc', Sequelize.STRING);
    //return queryInterface.addColumn('hostgroups', 'hosts', Sequelize.TEXT);
    return queryInterface.addColumn('hostgroups', 'admins', Sequelize.TEXT);
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
