var express = require('express');
var app = express();
var pg = require('pg');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname));

// views is directory for all template files
//app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (request, response) {
  response.render('pages/index'); 
});

app.get('/index', function (request, response) {
  response.render('pages/index'); 
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
            
            //convert back to array
            var questionsArray = [];
            Object.keys(questions).forEach(function(key) {
              var obj = questions[key];
              questionsArray.push(obj);
            });
            
            console.log('questions---------');
            console.log(questionRows.rows);
            console.log('answers---------');
            console.log(answerRows.rows);
            console.log('questionsArray---------');
            console.log(questionsArray);
            
            response.render('pages/db', {questions: questionsArray} ); 
          }
        });
        
        
        
      }
    });
  });
});



app.listen(app.get('port'), function() {
  console.log('SurveySite app is running on port', app.get('port'));
});



