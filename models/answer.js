'use strict';
module.exports = function(sequelize, DataTypes) {
  var Answer = sequelize.define('Answer', {
    id: { type: DataTypes.INTEGER, primaryKey: true},
    question_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    count: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Answer;
};