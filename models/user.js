var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    findOrCreate = require('mongoose-findorcreate');

var songSchema = Schema({
  songId: { type : Number, required : true },
  title: { type : String, required : true },
  imageUrl: String,
  start: Number,
  end: Number
});

var userSchema = Schema({
  soundcloudId: { type : String, required : true },
  playlist: [songSchema]
});

userSchema.plugin(findOrCreate);

var Song = mongoose.model('Song', songSchema);
var User = mongoose.model('User', userSchema);

module.exports = { Song : Song,
                   User : User
                 };
