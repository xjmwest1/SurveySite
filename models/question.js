'use strict';
module.exports = function(sequelize, DataTypes) {
  var Question = sequelize.define('Question', {
    id: { type: DataTypes.INTEGER, primaryKey: true, field: 'id'},
    title: DataTypes.STRING,
    submit_date: { type: DataTypes.DATE, defaultValue: sequelize.fn('now')}
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Question;
};