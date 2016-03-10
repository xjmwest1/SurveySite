'use strict';
module.exports = function(sequelize, DataTypes) {
  var Question = sequelize.define('Question', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    title: DataTypes.STRING,
    submit_date: { type: DataTypes.DATE, defaultValue: sequelize.fn('now')}
  });
  
  return Question;
};