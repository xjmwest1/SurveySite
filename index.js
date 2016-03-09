var express = require('express');
var app = express();
var pg = require('pg');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname));

// views is directory for all template files
//app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/mainscreen.html');
});

app.get('/cool', function(request, response) {
  response.send(cool());
});

app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM question_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('public/pages/db', {results: result.rows} ); }
    });
  });
});


app.listen(app.get('port'), function() {
  console.log('SurveySite app is running on port', app.get('port'));
});



