//Create a friend model and schema
var mongoose = require('mongoose');

var FriendSchema = new mongoose.Schema({
    userId: String,
    friends: [String]
});

module.exports = mongoose.model('FriendModel', FriendSchema);