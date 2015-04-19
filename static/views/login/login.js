app.controller("LoginCtrl", function ($scope, $http, $location, $rootScope) {
    $scope.login = function (user) {
        $http.post("/login", user)
            .success(function (response) {
                console.log(response);
                $rootScope.currentUser = response;
                $location.url("/homepage");
            })
            .error(function (err) {
                $scope.message = "Login failed.";
            });
    }
});