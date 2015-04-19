//Create a user model and schema
var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String,
    zip: String,
    profileImage: String
});

module.exports = mongoose.model('UserModel', UserSchema);