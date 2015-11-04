var classifindApp = angular.module('classifindApp', ['ngRoute']);
var apiIP = 'http://25.19.222.241:3000/api/';


classifindApp.config(function ($routeProvider) {
    $routeProvider
 
	// route for the home page
        .when('/', {
            templateUrl: 'partials/splash.html'
        })
 
	// route for the about page
        .when('/register', {
            templateUrl: 'partials/register.html',
            controller: 'registerController'
        })

		.when('/dashboard', {
            templateUrl: 'partials/dashboard.html',
            controller: 'dashController'
        })

		.when('/search', {
            templateUrl: 'partials/search-results.html',
            controller: 'searchController'
        })

		.otherwise({
			redirectTo: '/'
		});
});

classifindApp.controller('loginController', ['$scope', '$http', '$location', function ($scope, $http, $location) {
	console.log('loginController loaded');
	$scope.go = function (path) {
		$location.path(path);
	};
	$scope.login = function () {
		var dataObj = {
			email: $scope.userEmail,
			password: $scope.userPassword
		};

		var endpointURL = apiIP + 'classifindUsers/login';
		var response = $http.post(endpointURL, dataObj);

		response.success(function (data, status, headers, config) {
			var sessionToken = data.id;
			var userId = data.userId;
		});
		response.error(function (data, status, headers, config) {
			//If status is 401 (wrong info) or -1 (server unreachable) do something
			console.log(status);
		});
	}
	$scope.showResults = function (searchQuery) {
		// just redirect, the second page will take care of making the query
		// make sure to inject $location into your controller
		$location.url('/search?q=' + encodeURIComponent(searchQuery));
	}
}]);

classifindApp.controller('searchController', ['$scope', '$http', '$location', function ($scope, $http, $location) {
	$scope.$watch(function () {
        return ($location.search() || {}).q;
    }, function (searchTerm) {
		var endpointURL = apiIP + 'jobs';
        $http.get(endpointURL + '?q=' + searchTerm).then(function (data) {
            $scope.results = data;
        });
    });
}]);

classifindApp.controller('registerController', ['$scope', '$http', '$location', function ($scope, $http, $location) {
	console.log('registerController loaded');

	$scope.registerUser = function () {
		var dataObj = {
			userPhone: $scope.userPhone,
			userAddress: $scope.userAddress,
			userDescription: $scope.userBio,
			username: $scope.userName,
			password: $scope.userPassword,
			email: $scope.userEmail,
			id: 0
		};

		var endpointURL = apiIP + 'classifindUsers';
		var response = $http.post(endpointURL, dataObj);
		response.success(function (data, status, headers, config) {
			$location.path('/dashboard.html');
		});
		response.error(function (data, status, headers, config) {
			//If status is 401 (wrong info) or -1 (server unreachable) do something
			console.log(status);
		});
	}
}]);
