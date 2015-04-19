//Create a comment model and schema
var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
    userId: String,
    eventId: String,
    date: String,
    comment: String,
    date: String
});

module.exports = mongoose.model('CommentModel', CommentSchema);