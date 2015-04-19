//Details controller
app.controller("DetailsCtrl", function ($scope, $http, $location, $rootScope, $routeParams) {

    var id = $routeParams.id;
    $scope.event = {};
    $scope.songs = '';
    $scope.artists = [];

    //Get an events for its details page
    $http.get('/getEvent/' + id)
        .success(function (msg) {
            $scope.event = msg;

            $scope.artists = [];
            angular.forEach($scope.event.performance, function (val, index) {
                $scope.artists.push(val.displayName);
            });

            console.log($scope.artists);

            $http.get('/checkFavorite/' + msg.id)
                .success(function (msg) {
                    $scope.favorite = msg;
                });

            $scope.playlist();
            $scope.getEventComments($scope.event.id);
        });

    //Favorite an event on its details page
    $scope.favoriteIt = function () {
        $http.post('/favorite/' + $scope.event.id,
            {
                title: $scope.event.displayName,
                location: $scope.event.location.city,
                date: $scope.event.start.date
            }).success(function (msg) {
                $scope.favorite = msg;
            });
    };

    //Unfavorite an event on its details page
    $scope.unfavoriteIt = function () {
        $http.delete('/favorite/' + $scope.favorite)
            .success(function (msg) {
                $scope.favorite = false;
            });
    };

    //Get the spotify playlist for the details page 

    $scope.playlist = function() {
        $http.get('/playlist/' + $scope.artists)
            .success(function (msg) {
                var s = [];
                for (var i = 0; i < msg.response.songs.length; i++) {
                    var song = msg.response.songs[i];
                    if (song.tracks[0]) {
                        var tid = song.tracks[0].foreign_id;
                        var split = tid.split(':');
                        s.push(split[split.length - 1]);
                    }
                }

                if (s.length > 0) {
                    $scope.songs = $scope.getIframeSrc(s.join(','));
                } else {
                    $scope.songs = null;
                }
            });
    }

    //Display spotify playlist on details page
    $scope.getIframeSrc = function (tracks) {
        return 'https://embed.spotify.com/?uri=spotify:trackset:Playlist:' + tracks;
    };

    //Submit a comment for an event on its details page
    $scope.submitEventComment = function (userId, eventId, comment) {
        $http.post("/submitEventComment/" + userId + '/' + eventId + '/' + comment)
    	.success(function (response) {
    	    $scope.getEventComments($scope.event.id);
    	});
    }

    //Get the comments for an evenet and display them on its details page
    $scope.getEventComments = function (eventId) {
        $http.get("/getEventComments/" + eventId)
    	.success(function (response) {
    	    $scope.eventComments = response;
    	});
    }
});
