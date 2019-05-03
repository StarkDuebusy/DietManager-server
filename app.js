var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session({
  secret: '*j!u%s&t*f$e@e#l$$%^',
  resave: false,
  saveUninitialized: true
 }));

app.use(logger('dev'));
app.use(bodyParser.json({limit: "1mb"}));
app.use(bodyParser.raw({limit: "100mb"}));
app.use(bodyParser.text({limit: "18kb"}));
app.use(bodyParser.urlencoded({ extended: true, limit : "3mb" }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/:countryCode/:protocolType/:apiName', function(req, res, next){
  req.countryCode = req.params.countryCode;
  if(req.params.hasOwnProperty('protocolType') && req.params.hasOwnProperty('apiName')){
    var apiName = req.params.apiName;
    if(req.params.protocolType == 'api'){
      	switch(apiName){
          case 'regist':
          case 'login':
          case 'dietplan': 
          case 'dailyreport':
          case 'bodyrecord':
          case 'bodycomposition':
						next();
						break;
					default:
						next(new Error('ERR001'));
						break;
      }
    } else if(req.params.protocolType == 'view'){
      switch(apiName){
        case 'regist':
        case 'dashboard':
        case 'dietplan':
        case 'dailyreport':
        case 'bodyrecord':
        case 'bodycomposition':
					next();
					break;
				default:
					next(new Error('ERR001'));
					break;
      }
    }else{
      	next(new Error('ERR001'));
    }
  }else{
    	next(new Error('ERR001'));
  }
});

var indexRouter = require('./routes/index');
app.use('/', indexRouter);
app.use('/:countryCode/:protocolType/dashboard', indexRouter);

var registRouter = require('./routes/regist');
app.use('/:countryCode/:protocolType/regist', registRouter);

var loginRouter = require('./routes/login');
app.use('/:countryCode/:protocolType/login', loginRouter);

var dietplanRouter = require('./routes/dietplan');
app.use('/:countryCode/:protocolType/dietplan', dietplanRouter);

var dailyreportRouter = require('./routes/dailyreport');
app.use('/:countryCode/:protocolType/dailyreport', dailyreportRouter);

var bodyrecordRouter = require('./routes/bodyrecord');
app.use('/:countryCode/:protocolType/bodyrecord', bodyrecordRouter);

var bodycompositionRouter = require('./routes/bodycomposition');
app.use('/:countryCode/:protocolType/bodycomposition', bodycompositionRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;