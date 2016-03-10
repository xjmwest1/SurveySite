'use strict';
module.exports = function(sequelize, DataTypes) {
  var Answer = sequelize.define('Answer', {
    id: DataTypes.INT,
    question_id: DataTypes.INT,
    title: DataTypes.STRING,
    count: DataTypes.INT
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Answer;
};