var express = require('express');
var bodyParser = require('body-parser');
//var router = express.Router();
var app = express();
var pg = require('pg');

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.set('view engine', 'ejs');

// CHECK ADMIN MIDDLEWARE

function checkAdmin(request, response, next) {
  if (!request.session.isAdmin) {
    res.send('You are not authorized to view this page');
  } else {
    next();
  }
}

/*router.use('/admin', function(request, response, next) {
  console.log('Request URL:', req.originalUrl);
  next();
}, function (req, res, next) {
  console.log('Request Type:', req.method);
  next();
});*/



// INDEX PAGE

app.get('/', function (request, response) {
  response.render('pages/index'); 
});

app.get('/index', function (request, response) {
  response.render('pages/index'); 
});

// LOGIN PAGE

app.get('/login', function (request, response) {
  response.render('pages/login'); 
});

app.post('/login', function (request, response) {
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


// ADMIN PAGE

app.get('/admin/:questionId?', checkAdmin, function (request, response) {
  //check login
  
  
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

app.get('/newquestion', function (request, response) {
  response.render('pages/newquestion'); 
});

app.post('/newquestion', function (request, response) {  
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
        return client.rollback_transaction(function () {
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



app.use('/', router);

app.listen(app.get('port'), function() {
  console.log('SurveySite app is running on port', app.get('port'));
});



