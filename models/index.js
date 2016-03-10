if (!global.hasOwnProperty('db')) {
  var Sequelize = require('sequelize')
    , sequelize = null

  if (process.env.DATABASE_URL) {
    // the application is executed on Heroku ... use the postgres database
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      logging: false,
      dialectOptions: {
        ssl: true /* for SSL config since Heroku gives you this out of the box */
      }
    });
  } else {
    // the application is executed on the local machine ... use mysql
    sequelize = new Sequelize('SurveySiteDB', 'root', null)
  }

  global.db = {
    Sequelize: Sequelize,
    sequelize: sequelize,
    Question:      sequelize.import(__dirname + '/question'),
    Answer:      sequelize.import(__dirname + '/answer') 
    // add your other models here
  }

  /*
    Associations can be defined here. E.g. like this:
    global.db.User.hasMany(global.db.SomethingElse)
  */
}

module.exports = global.db