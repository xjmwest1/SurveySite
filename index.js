var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var pg = require('pg');

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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

            console.log(currentQuestion);
            
            response.render('pages/admin', {
                questions: questionRows.rows,
                currentQuestion: currentQuestion
            }); 
          }
        });
      }
    });
  });
});

app.get('/newquestion', function (request, response) {
  response.render('pages/newquestion'); 
});

app.post('/newquestion', function (request, response) {  
  var questionText = request.body.question;
  var answers = [];
  
  Object.keys(request.body).forEach(function(ele) {
    if(ele.indexOf('answer') > -1) {
      answers.push(ele);
    }
  });
  
  var insertedQuestion;
  
  console.log('we\'re here!!');
  console.log(questionText);
  console.log(answers);
  
  if(questionText != null) {
  
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('INSERT INTO question_table(title, submit_timestamp) values($1, current_timestamp) RETURNING id', [questionText], function(err, questionResults) {
      if (err) {
          console.log(err); response.send("Error inserting question"); 
      } else {
        insertedQuestion = questionResults.rows[0];
        
        answers.forEach(function(answer) {
          client.query('INSERT INTO answer_table(title, submit_timestamp) values($1, $2) RETURNING id', [answer, insertedQuestion.id], function(err, answerResults) {
            if (err) {
              console.log(err); response.send("Error inserting answers"); 
            }
          });
        });
        done();
      }
    });
  });
    
  }
  
  if(insertedQuestion) {
    response.render('pages/admin/' + insertedQuestion.id); 
  }else {
    response.render('pages/admin');
  }
    
});


app.listen(app.get('port'), function() {
  console.log('SurveySite app is running on port', app.get('port'));
});



