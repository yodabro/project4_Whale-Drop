require('dotenv').load();

var express = require('express'),
    app = express(),
    ejs = require('ejs'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    expressLayouts = require('express-ejs-layouts'),
    morgan = require('morgan'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    SoundCloudStrategy = require('passport-soundcloud').Strategy,
    session = require('express-session'),
    Song = require('./models/user.js').Song,
    User = require('./models/user.js').User;

var PORT = process.env.PORT || 3000;
var MONGOURI = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/whale-drop';

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(morgan('short'));
app.use(express.static('./public'));

app.use(expressLayouts);
app.use(session({
  secret : process.env.SESSION_SECRET,
  resave : false,
  saveUninitialized : false
}));

app.use(bodyParser.json());
app.use(methodOverride('_method'));

var usersController = require('./controllers/users.js');
app.use('/', usersController)

mongoose.connect(MONGOURI);
var db = mongoose.connection;

db.on('error', function (err) {
  console.log('DATABASE ERRORS!');
  console.log(err);
});

db.once('open', function () {
  console.log('DATABASE IS RUNNING');
  app.listen(PORT, function () {
    console.log('SERVER IS UP ON PORT', PORT);
  });
});
