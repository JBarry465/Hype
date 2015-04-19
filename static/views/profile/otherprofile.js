app.controller("OtherProfileCtrl", function ($scope, $http, $location, $rootScope, $routeParams) {

    $scope.user = {};
    $scope.comments = [];

    //Get other users desired profile
    $http.get('/getUser/' + $routeParams.id)    
        .success(function (msg) {            
            if (msg) {

                if (msg.username == $rootScope.currentUser.username) {
                    $location.url('/profile');
                }

                $scope.user = msg;
                getComments();

                $http.get('/checkFriend/' + msg._id)
                    .success(function (msg) {
                        $scope.following = msg;
                    });

                $http.get('/friends/' + $scope.user._id)
                    .success(function (msg) {
                        $scope.friends = msg;
                    });

            } else {
                $scope.error = "This user does not exist.";
            }
        });

    //Add a freidn to follow
    $scope.addFriend = function (user) {
        $http.put('/friends/' + user._id);
        $scope.following = true;
    };

    //unfollow a  friend
    $scope.unfollow = function (id) {
        $http.delete('/friends/' + id)
            .success(function (msg) {
                $scope.friends = msg;
                $scope.following = false;
            });
    };

    $scope.getComments = function () {
        $http.get('/getUserComments/' + $scope.user.username)
            .success(function (msg) {
                $scope.comments = msg;
            });
    }
});