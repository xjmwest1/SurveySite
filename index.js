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


app.get('/admin/:questionId?', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM question_table', function(err, questionRows) {
      done();
      if (err) { 
        console.error(err); response.send("Error " + err); 
      }else {
        
        var questionId = request.params.questionId ? request.params.questionId : questionRows.rows[0].id;
        
        client.query('SELECT * FROM answer_table WHERE question_id=' + questionId, function(err, answerRows) {
          done();
          if (err) { 
            console.error(err); response.send("Invalid question id"); 
          }else {
            
            var currentQuestion = {};
            var questionsMap = {};
            
            questionRows.rows.forEach(function(question) {
              questionsMap[question.id] = question;
            });
            
            currentQuestion = questionsMap[questionId] ? questionsMap[questionId] : {};
            currentQuestion.answers = [];
            
            answerRows.rows.forEach(function(answer) {
              if(answer.question_id == currentQuestion.id) {
                currentQuestion.answers.push(answer);
              }
            });

            
            response.render('pages/db', {
                questions: questionRows.rows,
                currentQuestion: currentQuestion
            }); 
          }
        });
        
        
        
      }
    });
  });
});



app.listen(app.get('port'), function() {
  console.log('SurveySite app is running on port', app.get('port'));
});



