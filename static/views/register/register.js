app.controller("RegisterCtrl", function ($scope, $http, $location, $rootScope) {

    $scope.loadingImage = 0;

    //Register a user for the website
    $scope.register = function (user) {

        if (!user.username) {
            $rootScope.message = "You did not provide a username.";
        } else if (user.password != user.password2 || !user.password || !user.password2) {
            $rootScope.message = "The passwords entered do not match.";
        } else if (!user.zip) {
            $rootScope.message = "You must at least provide a ZIP Code.";
        } else {

            while ($scope.loadingImage) {

            }

            user.profileImage = $rootScope.img;
            $http.post("/register", user)
                .success(function (response) {
                    console.log(response);
                    if (response != null) {
                        $rootScope.currentUser = response;
                        $location.url("/homepage");
                    } else {
                        $rootScope.message = "A user with that username already exists.";
                    }
                });
        }
    };

    //Save users uploaded image
    $scope.saveImage = function (img) {
        var fileReader = getFileReader($scope);

        $rootScope.flowImg = img;

        $scope.loadingImage = 1;
        fileReader.readAsDataURL(img.files[0].file);
    };

    var getFileReader = function ($scope) {

        var fileReader = new FileReader();

        fileReader.onloadend = function () {
            $rootScope.img = fileReader.result;
            $scope.loadingImage = 0;
        };

        return fileReader;
    };
});