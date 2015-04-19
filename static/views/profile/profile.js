app.controller("ProfileCtrl", function ($scope, $http, $location, $rootScope, $routeParams, $window) {

    $http.comments = [];

    //Get a users favorite events
    $http.get('/favorites')
        .success(function (msg) {
            $scope.favorites = msg;
        });

    $scope.update = function (user) {

        if (user.password != user.password2 || !user.password || !user.password2) {
            $scope.message = "The passwords entered do not match.";
        } else {
            delete user['password2'];
            $http.put('/updateUser/' + user._id, user)
                .success(function (msg) {
                    $rootScope.currentUser = user;
                    $window.alert("Updated!");
                });
        }
    };

    //Delete a previously favorited event from a profile
    $scope.unFavorite = function (id) {
        $http.delete('/favorite/' + $scope.favorites[id]._id)
            .success(function (msg) {
                $scope.favorites = msg;
            });
    };

    //Display user's friends in profile
    $http.get('/friends/' + $rootScope.currentUser._id)
        .success(function (msg) {
            $scope.friends = msg;
        });

    //unfollow a previously followed person
    $scope.unfollow = function(id) {
      $http.delete('/friends/' + id)
          .success(function (msg) {
             $scope.friends = msg;
          });
    };

    $http.get('/getUserComments/' + $rootScope.currentUser.username)
        .success(function (msg) {
            $scope.comments = msg;
        });
});