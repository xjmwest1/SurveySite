var express = require('express');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session');
var app = express();
var pg = require('pg');

app.set('port', (process.env.PORT || 5000));
app.set('trust proxy', 1);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.set('view engine', 'ejs');

// CHECK ADMIN MIDDLEWARE
// ( used for /admin & /newquestion )

function checkAdmin(request, response, next) {
  if (!request.session.isAdmin) {
    response.redirect('/login');
  } else {
    next();
  }
}



// INDEX PAGE

app.get('/', function(request, response) {
  var question = getRandomQuestion(request.session.answeredQuestionIds || []);
  
  response.render('pages/index', {
    question: question
  });
});

app.get('/index', function(request, response) {
  var question = getRandomQuestion(request.session.answeredQuestionIds || []);
  
  console.log(question);
  
  response.render('pages/index', {
    question: question
  });
});

function getRandomQuestion(answeredQuestionIds) {
  var unansweredQuestionIds = [];

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM question_table', function(err, questionRows) {
      done();
      if (err) { 
        console.error(err);
        return null;
      }else {
        
        // get unanswered question ids
        questionRows.rows.forEach(function(q) {
          if(answeredQuestionIds.indexOf(q.id) == -1) {
            unansweredQuestionIds.push(q.id);
          }
        });
        
        // pick random unanswered question
        var questionId = unansweredQuestionIds[Math.floor(Math.random() * unansweredQuestionIds.length)];
        
        console.log('questionId---------------------------');
        console.log(questionId);
        
        return pg.connect(process.env.DATABASE_URL, function(err, client, done) {    
          client.query('SELECT * FROM question_table WHERE id=' + questionId, function(err, questionRows) {
            done();
            if (err) { 
              console.error(err);
              return null;
            }else {

              if(questionRows.rows.length <= 0) return null;

              question = questionRows.rows[0];

              client.query('SELECT * FROM answer_table WHERE question_id=' + questionId, function(err, answerRows) {
                done();
                if (err) { 
                  console.error(err);
                  return null;
                }else {
                  done();
                  question.answers = [];
                  answerRows.rows.forEach(function(answer) {
                    question.answers.push(answer);
                  });
                  return question;
                }
              });
            }
          });
        });
      }
    });
  });
}

// LOGIN PAGE

app.get('/login', function(request, response) {
  response.render('pages/login'); 
});

app.post('/login', function(request, response) {
  var post = request.body;
  if (post.user === 'john' && post.pass === 'abc123') {
    request.session.isAdmin = true;
    response.redirect('/admin');
  } else {
    response.render('pages/login', {
      loginAttempted: true
    }); 
  }
});

// LOGOUT PAGE

app.get('/logout', function(request, response) {
  delete request.session.isAdmin;
  response.redirect('/index');
});   


// ADMIN PAGE

app.get('/admin/:questionId?', checkAdmin, function(request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM question_table', function(err, questionRows) {
      done();
      if (err) { 
        console.error(err); response.send("Error " + err); 
      }else {
        
        var questions = questionRows.rows;
        
        if(questions.length > 0) {
          var questionId = request.params.questionId ? request.params.questionId : questions[0].id;
        
          client.query('SELECT * FROM answer_table WHERE question_id=' + questionId, function(err, answerRows) {
            done();
            if (err) { 
              console.error(err); response.send("Invalid question id"); 
            }else {

              var currentQuestion = null;
              var questionsMap = {};

              questions.forEach(function(question) {
                questionsMap[question.id] = question;
              });

              currentQuestion = questionsMap[questionId] ? questionsMap[questionId] : {};
              currentQuestion.answers = [];

              answerRows.rows.forEach(function(answer) {
                if(answer.question_id == currentQuestion.id) {
                  currentQuestion.answers.push(answer);
                }
              });

              response.render('pages/admin', {
                  questions: questions,
                  currentQuestion: currentQuestion
              }); 
            }
          });
        }else {
          response.render('pages/admin', {
            questions: questions,
            currentQuestion: null
          }); 
        }
        
        
      }
    });
  });
});

// NEW QUESTION PAGE

app.get('/newquestion', checkAdmin, function(request, response) {
  response.render('pages/newquestion'); 
});

app.post('/newquestion', checkAdmin, function(request, response) {  
  var questionText = request.body.question;
  var answers = [];
  
  Object.keys(request.body).forEach(function(ele) {
    var val = request.body[ele];
    if(ele.indexOf('answer') > -1 && val.length > 0) {
      answers.push(val);
    }
  });
  
  var insertedQuestion;
  var redirect;
  
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('INSERT INTO question_table(title, submit_timestamp) values($1, current_timestamp) RETURNING id', [questionText], function(err, questionResults) {
      if (err) {
        return client.rollback_transaction(function() {
          console.log(err);
          response.send("Error inserting question"); 
        });
      } else {

        insertedQuestion = questionResults.rows[0];
        answers.forEach(function(answer, index, array) {
          client.query('INSERT INTO answer_table(title, question_id, count) values($1, $2, 0)', [answer, insertedQuestion.id], function(err, answerResults) {
            if (err) {
              console.log(err); response.send("Error inserting answers"); 
            }
            
            // if last query close connection and redirect to admin page
            if(index + 1 === array.length) {
              done();
              redirect(insertedQuestion);
            } 
          });
        });

      }
    });
  });
  
  redirect = function(question) {  
    if(question) {
      response.status(200).send('<html><body></body><script type="text/javascript">window.location.href="/admin/' + question.id + '";</script></html>');
    }else {
      response.status(200).send('<html><body></body><script type="text/javascript">window.location.href="/admin";</script></html>');
    }
  }
  
});


//app.use('/', router);

app.listen(app.get('port'), function() {
  console.log('SurveySite app is running on port', app.get('port'));
});



