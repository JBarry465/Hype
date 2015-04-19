require('dotenv').load();

var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoose = require('mongoose');

// default to a 'localhost' configuration:
var connection_string = '127.0.0.1:27017/YOUR_APP_NAME';
// if OPENSHIFT env variables are present, use the available connection info:
if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
        process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
        process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
        process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
        process.env.OPENSHIFT_APP_NAME;
}

var db = mongoose.connect(connection_string);

var app = express();

app.use(express.static(__dirname + '/static'));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data
app.use(session({ secret: 'this is the secret' }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

/*
 Import Mongoose Models
 */
var UserModel = require(__dirname + '/models/User');
var FavoriteModel = require(__dirname + '/models/Favorite');
var FriendModel = require(__dirname + '/models/Friend');
var CommentModel = require(__dirname + '/models/Comment');


// -------------------------------------------------------------------
// User logins using passport and Mongo
// -------------------------------------------------------------------

passport.use(new LocalStrategy(function (username, password, done) {
    UserModel.findOne({username: username, password: password}, function (err, user) {
        if (err) {
            return done(err);
        }

        if (!user) {
            return done(null, false);
        }

        return done(null, user);
    })
}));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

var checkAuth = function (req, res, next) {
    if (!req.isAuthenticated())
        res.send(401);
    else
        next();
};

app.post("/login", passport.authenticate('local'), function (req, res) {
    var user = req.user;
    res.json(user);
});

app.get("/getUser/:name", checkAuth, function (req, res) {
    UserModel.findOne({username: req.params.name}, function (err, user) {
        if (err) {
            return next(err);
        }

        if (user) {
            res.json(user);
        } else {
            res.send(null);
        }
    });
});

app.get('/loggedin', function (req, res) {
    res.send(req.isAuthenticated() ? req.user : null);
});

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

app.post('/register', function (req, res) {
    var newUser = req.body;
    newUser.roles = ['student'];
    UserModel.findOne({username: newUser.username}, function (err, user) {
        if (err) {
            return next(err);
        }

        if (user) {
            res.json(null);
            return;
        }

        var newUser = new UserModel(req.body);
        newUser.save(function (err, user) {
            req.login(user, function (err) {
                if (err) {
                    return next(err);
                }

                res.json(user);
            });
        });
    });
});

app.get('/usersList', function (req, res) {
    UserModel.find({}, function (err, users) {
        res.send(users);
    });
});

app.get('/friends', function (req, res) {
    FriendModel.find({}, function (err, users) {
        res.send(users);
    });
});

app.put("/updateUser/:id", checkAuth, function (req, res) {
    delete req.body['_id'];
    UserModel.update({ _id: req.params.id }, req.body, function (err, count) {
        req.login(req.body, function (err) {
            if (err) return next(err);

            res.sendStatus(200);
        });
    });
});

// -------------------------------------------------------------------
// Google's Geolocation to find local concerts
// -------------------------------------------------------------------

var geocoderProvider = 'google';
var httpAdapter = 'http';

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);

// Using callback
app.get('/geocode', function (req, res) {
    geocoder.geocode(req.user.zip, function (err, res2) {
        req.user.location = res2[0];
        songkickLocation(req, res, res2[0]);
    });
});

// -------------------------------------------------------------------
// Songkick API usage for concerts, events, etc.
// -------------------------------------------------------------------

//Gets concerts based off user location
function songkickLocation(req, res, send) {
    var url = 'http://api.songkick.com/api/3.0/search/locations.json?query='
        + req.user.location.city + req.user.location.stateCode
        + '&apikey='
        + process.env.SONGKICK_API_KEY;

    request(url,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                req.user.location.songkick = JSON.parse(body).resultsPage.results.location[0].metroArea.id;
                res.send(send);
            }
        });
}

//gets concerts in major cities
app.get('/metroConcerts', function (req, res) {
    var page = req.query.page || 1;

    var url = 'http://api.songkick.com/api/3.0/metro_areas/'
        + req.user.location.songkick
        + '/calendar.json?apikey='
        + process.env.SONGKICK_API_KEY
        + '&page=' + page;

    request(url,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var newBody = JSON.parse(body).resultsPage;
                var maxPages = Math.ceil(newBody.totalEntries / newBody.perPage);
                newBody.maxPages = maxPages;

                res.send(newBody);
            }
        });
});

//Gets a list of artists
app.get('/artistSearch/:q', function (req, res) {
    var url = 'http://api.songkick.com/api/3.0/search/artists.json?query='
        + req.params.q
        + '&apikey='
        + process.env.SONGKICK_API_KEY;

    request(url,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {

                res.send(body);
            }
        });
});

//gets alist of artist events
app.get('/artistsConcerts', function (req, res) {
    var page = req.query.page || 1;

    var url = 'http://api.songkick.com/api/3.0/metro_areas/'
        + req.user.location.songkick
        + '/calendar.json?apikey='
        + process.env.SONGKICK_API_KEY
        + '&page=' + page;

    request(url,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var newBody = JSON.parse(body).resultsPage;
                var maxPages = Math.ceil(newBody.totalEntries / newBody.perPage);
                newBody.maxPages = maxPages;

                res.send(newBody);
            }
        });
});

//gets alist of artist events
app.get('/artistEvents/:q', function (req, res) {
    var page = req.query.page || 1;


    var url = 'http://api.songkick.com/api/3.0/artists/'
        + req.params.q //should be artist id
        + '/calendar.json?apikey='
        + process.env.SONGKICK_API_KEY
        + '&page=' + page;

    request(url,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var newBody = JSON.parse(body).resultsPage;
                var maxPages = Math.ceil(newBody.totalEntries / newBody.perPage);
                newBody.maxPages = maxPages;

                res.send(newBody);
            }
        });
});

app.get('/getEvent/:id', function (req, res) {
    var url = 'http://api.songkick.com/api/3.0/events/'
        + req.params.id //should be event id
        + '.json?apikey='
        + process.env.SONGKICK_API_KEY;


    request(url,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var newBody = JSON.parse(body).resultsPage.results.event;

                res.send(newBody);
            }
        });
});

// -------------------------------------------------------------------
// Favorite Model access (favoriting of events)
// -------------------------------------------------------------------

//Deletes a favorite concert or event
app.delete('/favorite/:id', checkAuth, function (req, res) {
    FavoriteModel.findById(req.params.id, function (err, fav) {
        if (fav.userId != req.user._id) {
            res.send(null);
            return;
        }

        fav.remove();

        FavoriteModel.find({userId: req.user._id}, function (err, favs) {
            res.send(favs);
        });
    });
});

//Adds a favorite concert or event
app.get('/favorites', function (req, res) {
    FavoriteModel.find({userId: req.user._id}, function (err, favs) {
        res.send(favs);
    });
});

//View a user's favorite events
app.get('/checkFavorite/:id', checkAuth, function (req, res) {
    FavoriteModel.find({userId: req.user._id, eventId: req.params.id}, function (err, favs) {
        if (favs.length > 0) {
            res.send(favs[0]._id);
        } else {
            res.send(false);
        }
    });
});

app.post('/favorite/:id', checkAuth, function (req, res) {
    FavoriteModel.findOne({userId: req.user._id, eventId: req.params.id}, function (err, object) {
        if (err) {
            return next(err);
        }

        if (object) {
            res.sendStatus(200);
            return;
        }


        var newFav = new FavoriteModel({
            userId: req.user._id,
            eventId: req.params.id,
            date: req.body.date,
            location: req.body.location,
            title: req.body.title
        });

        newFav.save(function (err, fav) {
            res.send(fav._id);
        });
    });
});

// -------------------------------------------------------------------
// Use the Friend Model to access friend listings
// -------------------------------------------------------------------

//Delete a friend
app.delete('/friends/:id', checkAuth, function (req, res) {
    FriendModel.findOne({userId: req.user._id}, function (err, list) {
        var i = list.friends.indexOf(req.params.id);

        if (i != -1) {
            list.friends.splice(i, 1);
        }

        list.save(function (err, resp) {
            res.send(resp.friends);
        });
    });
});

//Adds a user to friend's list
app.put('/friends/:id', checkAuth, function (req, res) {
    FriendModel.findOne({userId: req.user._id}, function (err, obj) {
        if (err) {
            return next(err);
        }

        if (obj) {
            obj.friends.push(req.params.id);

            obj.save(function (err, upd) {
                res.send(upd.friends);
                return;
            });
        } else {
            var frd = new FriendModel({userId: req.user._id, friends: [req.params.id]});
            frd.save(function (err, fav) {
                res.sendStatus(200);
            });
        }

    });
});

//View a friend's profile
app.get('/friends/:id', checkAuth, function (req, res) {
    FriendModel.findOne({userId: req.params.id}, function (err, list) {
        if (err) {
            return next(err);
        }

        var friends = [];
        var count = 0;

        if (list) {

            list.friends.forEach(function (item) {
                UserModel.findById(item, function (err, user) {
                    if (err) {
                        return next(err);
                    }

                    friends.push(user);
                    count++;

                    if (count == list.friends.length) {
                        res.send(friends);
                    }
                });
            });
        } else {
            res.send(null);
        }
    });
});

//View another friends profile
app.get('/checkFriend/:id', checkAuth, function (req, res) {
    FriendModel.findOne({userId: req.user._id}, function (err, list) {
        if (list) {
            if (list.friends.indexOf(req.params.id) > -1) {
                res.send(true);
            }
        } else {
            res.send(false);
        }
    });
});

// -------------------------------------------------------------------
/*
 Comments on Events By Users - this is for accessing them in storange
 */
// -------------------------------------------------------------------
//Submit an event comment for a details page
app.post("/submitEventComment/:userId/:eventId/:comment", function (req, res) {
    var newComment = new CommentModel(
        {
            userId: req.params.userId,
            eventId: req.params.eventId,
            comment: req.params.comment,
            date: new Date()
        });
    newComment.save();

    res.send(200);
});


//Get a users comments to display on their profile page
app.get("/getUserComments/:userId", function (req, res) {
    CommentModel.find({ userId: req.params.userId }, function (err, comments) {
        res.json(comments);
    })
});

//Get an events comments to display on its details page
app.get("/getEventComments/:eventId", function (req, res) {
    CommentModel.find({ eventId: req.params.eventId }, function (err, comments) {
        res.json(comments);
    });
});

app.get("/comments", function (req, res) {
    CommentModel.find({}, function (err, comments) {
       res.send(comments);
    });
});

// -------------------------------------------------------------------
/*
 Echojs is used for artist images and the generation of playlists
 */
// -------------------------------------------------------------------
var echojs = require('echojs');

var echo = echojs({
    key: process.env.ECHONEST_KEY
});

//Gets an artists image from songkick
app.get('/artistImage/:id', function (req, res) {
    echo('artist/images').get({
        id: 'songkick:artist:' + req.params.id,
        license: 'all-rights-reserved'
    }, function (err, json) {
        if (json.response.images) {
            res.send(json.response.images[0]);
        } else {
            res.send(null);
        }
    });
});

//Gets a playlist from spotify
app.get('/playlist/:artists', function (req, res) {
    echo('/playlist/static').get({
        'artist': req.params.artists.split(','), 'format': 'jsonp',
        'bucket': [ 'id:spotify-WW', 'tracks'],
        'results': 30, 'type': 'artist', 'variety': .5
    }, function (err, json) {
        res.send(json);
    })
});
// -------------------------------------------------------------------

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 3030;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

app.listen(server_port, server_ip_address);
