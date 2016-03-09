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
    client.query('SELECT * FROM question_table', function(err, questionRows) {
      done();
      if (err) { 
        console.error(err); response.send("Error " + err); 
      }else {
        
        client.query('SELECT * FROM answer_table', function(err, answerRows) {
          done();
          if (err) { 
            console.error(err); response.send("Error " + err); 
          }else {
            
            var questions = {};
            
            questionRows.rows.forEach(function(question) {
              questions[question.id] = question;
              questions[question.id].answers = [];
            });
            
            answerRows.rows.forEach(function(answer) {
              if(questions[answer.question_id]) {
                questions[answer.question_id].answers.push(answer);
              }
            });
            
            response.render('pages/db', {questions: questions} ); 
          }
        });
        
        
        
      }
    });
  });
});


app.listen(app.get('port'), function() {
  console.log('SurveySite app is running on port', app.get('port'));
});



