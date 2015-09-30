var express = require('express'),
    router = express.Router(),
    Song = require('../models/user.js').Song,
    User = require('../models/user.js').User,
    passport = require('passport'),
    SoundCloudStrategy = require('passport-soundcloud').Strategy,
    request = require('request');

// PASSPORT SETUP
router.use(passport.initialize());
router.use(passport.session());

passport.use(new SoundCloudStrategy({
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: 'http://localhost:3000/callback',
    display: 'popup'
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ soundcloudId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

passport.serializeUser(function (user, done) {
  done(null, user)
});

passport.deserializeUser(function (obj, done) {
  done(null, obj)
})

// INDEX
router.get('/', function (req, res) {
  console.log(req.user);
  if(req.user) {
    req.session.soundcloudId = req.user.soundcloudId
  }
  res.render('whaledrop', {
    user : req.user,
    songs : req.session.songs
  })
});

// SOUNDCLOUD CALLBACK
router.get('/auth/soundcloud', passport.authenticate('soundcloud'));

router.get('/callback', passport.authenticate('soundcloud', {
  successRedirect: '/',
  failureRedirect: '/'
}));


// GET TRACKS
router.get('/tracks', function (req, res) {
  request.get({
    url : 'https://api.soundcloud.com/users/' + req.session.soundcloudId + '/favorites?client_id=' + process.env.clientID
    },
    function (err, response, body) {
    req.session.songs = JSON.parse(body);
    res.json({ songs : req.session.songs })
    })
  });

// ADD TO PLAYLIST
router.post('/addtoplaylist', function (req, res) {
  newSong = new Song(req.body.song);
  newSong.save(function(err, song) {
    if (err) {
      console.log(err);
    } else {
      console.log(song);
      User.findOne({ _id : req.session.passport.user._id }, function (err, user) {
        user.playlist.push(song);
        user.save(function(err, success) {
          if (err) {
            console.log(err);
          } else {
            res.json({ user : user })
          }
        })
      });
    }
  });
});

// SHOW PLAYLIST
router.get('/playlist', function (req, res) {
  User.findOne({ _id : req.session.passport.user._id }, function (err, user) {
    res.json({ playlist : user.playlist })
  });
});

// LOGOUT
router.get('/logout', function (req, res) {
  res.render('whaledrop', {
    user : null
  })
})

// DELETE
router.delete('/delete', function (req, res) {
  console.log(req.body);
  User.findOne({ _id : req.session.passport.user._id })
})

// EDIT


// UPDATE


module.exports = router;
