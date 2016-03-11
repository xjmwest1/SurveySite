'use strict';
module.exports = function(sequelize, DataTypes) {
  var Question = sequelize.define('Question', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    title: DataTypes.STRING
  }, {
    tableName: 'questions'
  });
  
  return Question;
};