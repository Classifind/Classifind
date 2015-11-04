var classifindApp = angular.module('classifindApp', ['ngRoute', 'classifind.angular-timeago']);
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
            controller: 'searchResultsController'
        })

		.otherwise({
			redirectTo: '/'
		});
});

classifindApp.controller('loginController', ['$scope', '$http', '$location', '$rootScope', function ($scope, $http, $location, $rootScope) {
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
			$rootScope.sessionToken = data.id;
			$rootScope.userId = data.userId;
		});
		response.error(function (data, status, headers, config) {
			//If status is 401 (wrong info) or -1 (server unreachable) do something
			console.log(status);
		});
	}
	$scope.showResults = function (searchQuery) {
		$location.url('/search?q=' + encodeURIComponent(searchQuery));
	}

	$scope.profile = function () {
		$location.url('/dashboard');
	}

	$scope.getJobs = function () {
		$rootScope.searchQuery = '';
		$location.url('/search');
	}
}]);

//Dashboard Controller
classifindApp.controller('dashController', ['$scope', '$http', '$location', '$rootScope', function ($scope, $http, $location, $rootScope) {
	$scope.search = function () {
		$rootScope.searchQuery = $scope.searchQuery;
		$location.path('/search');
	}
}]);


classifindApp.controller('searchController', ['$scope', '$http', '$location', '$rootScope', function ($scope, $http, $location, $rootScope) {
	$scope.search = function () {
		$rootScope.searchQuery = $scope.searchQuery;
		$location.path('/search');
	}
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
		console.log(dataObj);
		var endURL = apiIP + 'classifindUsers';
		console.log(endURL);
		var response = $http.post(endURL, dataObj);
		response.success(function (data, status, headers, config) {
			//console.log($location.path('/dashboard'));
			//$location.path('/dashboard');
			console.log(data);
		});
		response.error(function (data, status, headers, config) {
			//If status is 401 (wrong info) or -1 (server unreachable) do something
			console.log(status);
		});
	}
	
	/*$scope.checkEmail = function() {
		var endURL = apiIP + 'classifindUsers/findOne?filter';
		console.log(endURL);
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			//console.log($location.path('/dashboard'));
			//$location.path('/dashboard');
			console.log(data);
		});
		response.error(function (data, status, headers, config) {
			//If status is 401 (wrong info) or -1 (server unreachable) do something
			console.log(status);
		});
		
	}*/
}]);

classifindApp.controller('searchResultsController', ['$scope', '$http', '$route', '$location', '$rootScope', 'timeAgo', function ($scope, $http, $route, $location, $rootScope, timeAgo) {
	console.log("results controller loaded");
	var oneDay = 60 * 60 * 24;
	timeAgo.settings.fullDateAfterSeconds = oneDay;
	$scope.$watch('$viewContentLoaded', function () {
		if ($rootScope.searchQuery == '') {
			var endURL = apiIP + "jobs/listAllJobs";
		}
		else {
			var endURL = apiIP + "jobs/searchJobs?searchQuery=" + $rootScope.searchQuery;
		}
		console.log(endURL);
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.searchResults = data.jobs;
			$scope.dataLength = $scope.searchResults.length;
			$location.path('/search');
			console.log($scope.searchResults);
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});

}]);
