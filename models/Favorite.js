//Create a favorite model and schema
var mongoose = require('mongoose');

var FavoriteSchema = new mongoose.Schema({
    userId: String,
    eventId: String,
    date: String,
    location: String,
    title: String
});

module.exports = mongoose.model('FavoriteModel', FavoriteSchema);
