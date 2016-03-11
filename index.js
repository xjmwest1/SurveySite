var express = require('express');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session');
var app = express();
var pg = require('pg');
var db = require('./models');
var http = require('http');
var mysql = require('mysql');

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

// for local, otherwise use process.env.DATABASE_URL
var connectionString = 'postgres://lieggxxxnnxmip:d8_rykzOflG4fi6tEj64ynH-At@ec2-54-83-56-31.compute-1.amazonaws.com:5432/dfccnd1s5eo59t';


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

app.get('/', getRandomQuestion, function(request, response) {
  response.render('pages/index');
});

app.get('/index', getRandomQuestion, function(request, response) {
  response.render('pages/index');
});

function getRandomQuestion(request, response, next) {
  var answeredQuestionIds = request.session.answeredQuestionIds || [];
  
  
  db.Question
    .findAll()
    .then(function(questions) {
      var unansweredQuestionIds = [];
    
      questions.forEach(function(q) {        
        if(answeredQuestionIds.indexOf(q.id) == -1) {
          unansweredQuestionIds.push(q.id);
        }
      }); 
      return unansweredQuestionIds;
    })
    .then(function(unansweredQuestionIds) {    
      if(unansweredQuestionIds.length > 0) {
        var questionId = unansweredQuestionIds[Math.floor(Math.random() * unansweredQuestionIds.length)];
        return db.Question.findById(questionId)
          .then(function(question) {
            return db.Answer.findAll({
              where: {
                question_id: questionId
              }
            })
            .then(function(answers) {
              question.answers = [];
              answers.forEach(function(answer) {
                question.answers.push(answer);
              });
              return question;      
            })
          })
      }else {
        return null;
      }
    })
    .then(function(question) {
      response.locals.question = question;
      next();
    });
}

// SUBMIT ANSWER POST

app.post('/submitAnswer', function(request, response) {
  var post = request.body;
  var questionId = parseInt(post.questionId);
  var selectedAnswerId = post.selectedAnswer;
  
  if(questionId && selectedAnswerId) {
    
    db.Answer.update({
      count: db.sequelize.literal('count +1')
    }, {
      where: {
        id: selectedAnswerId
      }
    })
    .then(function() {
      if(!request.session.answeredQuestionIds) request.session.answeredQuestionIds = [];
      request.session.answeredQuestionIds.push(questionId);
      
      response.redirect('/index');
    });
  }else {
    response.redirect('/index');
  }
  
});

// LOGIN PAGE

app.get('/login', function(request, response) {
  response.render('pages/login'); 
});

app.post('/login', function(request, response) {
  var post = request.body;
  if(post.user === 'john' && post.pass === 'abc123') {
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
  
  db.Question.all().then(function(questions) {

    if(questions.length > 0) {
    
      var questionId = request.params.questionId ? request.params.questionId : questions[0].id;
      db.Question
        .findById(questionId)
        .then(function(question) {
          if(question) {
            db.Answer
              .findAll({
                where: {
                  question_id: questionId
                }
              })
              .then(function(answers) {
                question.answers = [];
                answers.forEach(function(answer) {
                  question.answers.push(answer);
                });
                response.render('pages/admin', {
                    questions: questions,
                    currentQuestion: question
                }); 
              })

          }else {
            console.error("err"); response.send("Error "); 
          }
        });
    }else {
      response.render('pages/admin', {
        questions: questions,
        currentQuestion: null
      }); 
    }
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
  
  var redirect;
  
  db.Question.create({
    title: questionText
  })
  .then(function(insertedQuestion) {
    
    var answerObjects = [];
    answers.forEach(function(answer, index, array) {
       answerObjects.push({
         question_id: insertedQuestion.id,
         title: answer,
         count: 0
       });
    });
    
    db.Answer
      .bulkCreate(answerObjects)
      .then(function(insertedAnswers) {
        redirect(insertedQuestion);
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


db.sequelize.sync().then(function() {
  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));    
  });  
});





