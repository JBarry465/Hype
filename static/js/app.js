/**
 * Created by matthewclamp on 3/31/15.
 */
var app = angular.module("HypeApp", ["ngRoute", "flow"]);

app.config(function ($routeProvider, $httpProvider, $locationProvider, $sceProvider) {

    $sceProvider.enabled(false);

    $routeProvider
        .when('/home', {
            templateUrl: 'views/home/home.html'
        })
        .when('/homepage', {
            templateUrl: 'views/home/homepage.html',
            resolve: {
                loggedin: isLoggedIn
            }
        })
        .when('/login', {
            templateUrl: 'views/login/login.html',
            controller: 'LoginCtrl',
            resolve: {
                hompage: homeToHomepage
            }
        })
        .when('/register', {
            templateUrl: 'views/register/register.html',
            controller: 'RegisterCtrl',
            resolve: {
                hompage: homeToHomepage
            }
        })
        .when('/about', {
            templateUrl: 'views/about/about.html'
        })
        .when('/profile', {
            templateUrl: 'views/profile/profile.html',
            controller: 'ProfileCtrl',
            resolve: {
                loggedin: isLoggedIn
            }
        })
        .when('/profile/:id', {
            templateUrl: 'views/profile/otherprofile.html',
            controller: 'OtherProfileCtrl',
            resolve: {
                loggedin: isLoggedIn
            }
        })
        .when('/locationSearch', {
            templateUrl: 'views/list/list.html',
            controller: 'ListCtrl',
            resolve: {
                loggedin: isLoggedIn
            }
        })
        .when('/artistSearch', {
            templateUrl: 'views/list/artistSearch.html',
            controller: 'ListCtrl'
        })
        .when('/artistEvents/:id', {
            templateUrl: 'views/list/artistEvents.html',
            controller: 'EventCtrl'
        })
        .when('/contact', {
            templateUrl: 'views/contact/contact.html'
        })
        .when('/details/:id', {
            templateUrl: 'views/details/details.html',
            controller: 'DetailsCtrl',
            resolve: {
                loggedin: isLoggedIn
            }
        })
        .otherwise({
            redirectTo: '/home'
        });
});

var isLoggedIn = function ($q, $timeout, $http, $location, $rootScope) {
    var deferred = $q.defer();

    $http.get('/loggedin').success(function (user) {
        $rootScope.errorMessage = null;
        // User is Authenticated
        if (user) {
            $rootScope.currentUser = user;

            $http.get('/geocode').success(function (res) {
                $rootScope.location = res;
            });

            deferred.resolve();
        } else {
            $rootScope.errorMessage = 'You must login to access that page.';
            deferred.reject();
            $location.url('/login');
        }
    });

    return deferred.promise;
};

var homeToHomepage = function ($q, $timeout, $http, $location, $rootScope) {
    $http.get('/loggedin').success(function (user) {
        if (user) {
            $rootScope.currentUser = user;

            $http.get('/geocode').success(function (res) {
                $rootScope.location = res;
            });

            $location.url('/homepage');
        }
    });
};

app.controller("NavCtrl", function ($scope, $http, $location, $rootScope) {
    $scope.logout = function () {
        $http.get("/logout")
            .success(function () {
                $rootScope.currentUser = null;
                $location.url("/home");
            });
    };
});