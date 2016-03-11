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
    
    sequelize.query("insert into Questions values(DEFAULT, 'question tres')", { type: sequelize.QueryTypes.INSERT})
  .then(function(users) {
      console.log('---------------------------');
      console.log(users);
    // We don't need spread here, since only the results will be returned for select queries
  })
    
  } else {
    // the application is executed on the local machine ... use mysql
    sequelize = new Sequelize('SurveySiteDB', 'root', null)
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