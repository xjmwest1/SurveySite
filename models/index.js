if (!global.hasOwnProperty('db')) {
  var Sequelize = require('sequelize')
    , sequelize = null

  if (process.env.DATABASE_URL) {    
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      logging: true,
      dialectOptions: {
        ssl: true
      },
      dialect: 'postgres',
      define: { timestamps: false }
    });
    
  } else {
    // the application is executed on the local machine ... use mysql
    sequelize = new Sequelize('surveysitedb', 'root', null)
  }

  global.db = {
    Sequelize: Sequelize,
    sequelize: sequelize,
    Question: sequelize.import(__dirname + '/question'),
    Answer: sequelize.import(__dirname + '/answer') 
    // add your other models here
  }

}

module.exports = global.db