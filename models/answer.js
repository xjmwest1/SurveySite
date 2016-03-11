'use strict';
module.exports = function(sequelize, DataTypes) {
  var Answer = sequelize.define('Answer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    question_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    count: DataTypes.INTEGER
  }, {
    tableName: 'answers'
  }););
  return Answer;
};