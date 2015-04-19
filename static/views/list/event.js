app.controller("EventCtrl", function ($scope, $http, $location, $rootScope, $routeParams) {

    $scope.page = 1;
    $scope.shows = {};

    //GEt the list of artist events to display on the events page
    $http.get('/artistEvents/' + $routeParams.id)
        .success(function (concerts) {            
                $scope.shows = concerts.results.event;
                $scope.maxPages = concerts.maxPages;           
        });

    //Next page function 
    $scope.nextPage = function () {
        $http.get('/artistEvents?page=' + ($scope.page + 1))
            .success(function (concerts) {
                $scope.shows = concerts.results.event;
                $scope.page++;
            });
    };

    //Previous page function
    $scope.previousPage = function () {
        $http.get('/artistEvents?page=' + ($scope.page - 1))
            .success(function (concerts) {
                $scope.shows = concerts.results.event;
                $scope.page--;
            });
    };

    //Favorite an event on the events page
    $scope.favorite = function (index) {
        var show = $scope.shows[index];
        $http.post('/favorite/' + show.id,
            {
                title: show.displayName,
                location: show.location.city,
                date: show.start.date
            });
    }
});