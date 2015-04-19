app.controller("ListCtrl", function ($scope, $http, $location, $rootScope) {

    $scope.page = 1;

    //Get concerts to display based on location
    $http.get("/metroConcerts")
        .success(function (concerts) {
            $scope.shows = concerts.results.event;
            $scope.maxPages = concerts.maxPages;
        });

    //Display close concerts on location page
    $scope.filter = function (search) {
        $http.get('/artistSearch/' + search)
            .success(function (msg) {
               var artists = msg.resultsPage.results.artist;
               angular.forEach(artists, function(value, key) {
                    $http.get('/artistImage/' + value.id)
                        .success(function (msg) {
                            console.log(msg);
                           value.img = msg.url;
                           artists[key] = value;
                        });
               });

                $scope.artists = artists;
            });
    };

    //Next page function
    $scope.nextPage = function () {
        $http.get('/metroConcerts?page=' + ($scope.page + 1))
            .success(function (concerts) {
               $scope.shows = concerts.results.event;
                $scope.page++;
            });
    };

    //Previous page function
    $scope.previousPage = function () {
        $http.get('/metroConcerts?page=' + ($scope.page - 1))
            .success(function (concerts) {
                $scope.shows = concerts.results.event;
                $scope.page--;
            });
    };
});