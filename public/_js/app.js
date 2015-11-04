var classifindApp = angular.module('classifindApp', ['ngRoute', 'ngCookies', 'classifind.angular-timeago']);
var apiIP = 'http://classifind.cloudapp.net/api/';


classifindApp.config(function ($routeProvider, $locationProvider) {
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

		.when('/listing', {
            templateUrl: 'partials/listing.html',
            controller: 'listingController'
        })

		.when('/profile', {
            templateUrl: 'partials/profile.html',
            controller: 'profileController'
        })

		.when('/new-listing', {
            templateUrl: 'partials/create-listing.html',
            controller: 'createListingController'
        })

		.when('/bid', {
            templateUrl: 'partials/bid.html',
            controller: 'bidController'
        })

		.otherwise({
			redirectTo: '/'
		});

	if (window.history && window.history.pushState) {
		$locationProvider.html5Mode({
			enabled: true,
			requireBase: false
		});
	}
});


classifindApp.controller('loginController', ['$scope', '$route', '$http', '$location', '$rootScope', '$window', '$cookieStore', function ($scope, $route, $http, $location, $rootScope, $window, $cookieStore) {
	console.log('loginController loaded');
	$scope.loggedIn = $cookieStore.get('loggedIn');
	$scope.userName = $cookieStore.get('userName');
	if ($scope.loggedIn == 'true') {
		$scope.loggedOut = "";
		$scope.userName = $cookieStore.get('userName');
	}
	else {
		$scope.loggedOut = "true";
	}
	console.log('User ID: ' + $cookieStore.get('userId'));
	console.log('Logged In: ' + $cookieStore.get('loggedIn'));
	console.log('User Name: ' + $cookieStore.get('userName'));
	console.log('Logged Out: ' + $cookieStore.get('loggedOut'));
	console.log('Session Token: ' + $cookieStore.get('sessionToken'));

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
			$cookieStore.put('loggedIn', 'true');
			$cookieStore.put('sessionToken', data.id + '');
			$cookieStore.put('userId', data.userId + '');
			endpointURL = apiIP + 'classifindUsers/' + data.userId;
			response = $http.get(endpointURL);
			response.success(function (data, status, headers, config) {
				$cookieStore.put('userName', data.username);
				$window.location.href = 'http://classifind.ca/';
			});
			response.error(function (data, status, headers, config) {
				console.log(status);
			});
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

	$scope.register = function () {
		$location.url('/register');
	}

	$scope.logout = function () {
		if ($scope.loggedIn == 'true') {
			$cookieStore.remove('loggedIn');
			$cookieStore.remove('loggedOut');
			$cookieStore.remove('userName');
			$cookieStore.remove('userId');
			$cookieStore.remove('sessionToken');
			$window.location.href = 'http://classifind.ca/';
		}
		else {
			$scope.loggedOut = "";
		}
	}
}]);

//Dashboard Controller
classifindApp.controller('dashController', ['$scope', '$route', '$http', '$location', '$rootScope', '$cookieStore', function ($scope, $route, $http, $location, $rootScope, $cookieStore) {
	$scope.loggedIn = $cookieStore.get('loggedIn');
	$scope.userName = $cookieStore.get('userName');
	if ($scope.loggedIn == 'true') {
		$scope.loggedOut = "";
		$scope.userName = $cookieStore.get('userName');
	}
	$scope.$watch('$viewContentLoaded', function () {
		var uID = $cookieStore.get('userId');
		var endURL = apiIP + "classifindUsers/" + uID;
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.profile = data;
			console.log($scope.profile);
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		endURL = apiIP + "classifindUsers/" + uID + "/requestedJobs";
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.cPage = 0;
			$scope.pSize = 3;
			$scope.jobs = data;
			$scope.numPages = function () {
				return Math.ceil($scope.jobs.length / $scope.pSize);
			}
			console.log($scope.jobs);
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});

	$scope.newListing = function () {
		$location.url('/new-listing');
	}

	$scope.viewListing = function (id) {
		console.log('ID Passed: ' + id);
		$rootScope.listingId = id;
		$location.url('/listing');
	}

	$scope.deleteListing = function (id) {
		console.log('ID Passed: ' + id);
		var endURL = apiIP + "jobs/" + id;
		var response = $http.delete(endURL);
		response.success(function (data, status, headers, config) {
			$route.reload();
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	}
}]);

classifindApp.controller('profileController', ['$scope', '$route', '$http', '$location', '$rootScope', '$cookieStore', function ($scope, $route, $http, $location, $rootScope, $cookieStore) {
	$scope.$watch('$viewContentLoaded', function () {
		var uID = $rootScope.userId;
		var endURL = apiIP + "classifindUsers/" + uID;
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.profile = data;
			console.log($scope.profile);
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		endURL = apiIP + "classifindUsers/" + uID + "/requestedJobs";
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.cPage = 0;
			$scope.pSize = 3;
			$scope.jobs = data;
			$scope.numPages = function () {
				return Math.ceil($scope.jobs.length / $scope.pSize);
			}
			console.log($scope.jobs);
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});


	$scope.viewListing = function (id) {
		console.log('ID Passed: ' + id);
		$rootScope.listingId = id;
		$location.url('/listing');
	}
}]);

classifindApp.directive('ngConfirmClick', [
	function () {
		return {
			priority: -1,
			restrict: 'A',
			link: function (scope, element, attrs) {
				element.bind('click', function (e) {
					var message = attrs.ngConfirmClick;
					if (message && !confirm(message)) {
						e.stopImmediatePropagation();
						e.preventDefault();
					}
				});
			}
		}
	}
]);


classifindApp.controller('searchController', ['$route', '$scope', '$http', '$location', '$rootScope', function ($route, $scope, $http, $location, $rootScope) {
	$scope.search = function () {
		$rootScope.searchQuery = $scope.searchQuery;
		if ($route.current.templateUrl == 'partials/search-results.html') {
			$route.reload();
		}
		else {
			$location.path('/search');
		}
	}
}]);

classifindApp.controller('registerController', ['$scope', '$http', '$location', '$rootScope', '$cookieStore', '$window', function ($scope, $http, $location, $rootScope, $cookieStore, $window) {
	console.log('registerController loaded');
	$scope.registerUser = function () {
		var dataObj = {
			userFullName: $scope.userFullName,
			userPhone: $scope.userPhone,
			userAddressStreet: $scope.userStreet,
			userAddressCity: $scope.userCity,
			userAddressCountry: $scope.userCountry,
			userAddressPostal: $scope.userPostal,
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

			var dataObj = {
				email: $scope.userEmail,
				password: $scope.userPassword
			};

			var endpointURL = apiIP + 'classifindUsers/login';
			var response = $http.post(endpointURL, dataObj);

			response.success(function (data, status, headers, config) {
				$rootScope.sessionToken = data.id;
				$rootScope.userId = data.userId;
				$cookieStore.put('loggedIn', 'true');
				$cookieStore.put('sessionToken', data.id + '');
				$cookieStore.put('userId', data.userId + '');
				endpointURL = apiIP + 'classifindUsers/' + data.userId;
				response = $http.get(endpointURL);
				response.success(function (data, status, headers, config) {
					$cookieStore.put('userName', data.username);
					$window.location.href = 'http://classifind.ca/';
				});
				response.error(function (data, status, headers, config) {
					console.log(status);
				});
			});
			response.error(function (data, status, headers, config) {
				console.log(status);
			});
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
	$scope.openListing = function (jobId) {
		console.log(jobId);
		$rootScope.listingId = jobId;
		$location.path('/listing');
	}
}]);


classifindApp.controller('listingController', ['$scope', '$http', '$route', '$location', '$rootScope', function ($scope, $http, $route, $location, $rootScope) {
	console.log("listing controller loaded");
	$scope.listingID = $rootScope.listingId;
	$scope.$watch('$viewContentLoaded', function () {

		var endURL = apiIP + "jobs/listingInformation?jobId=" + $scope.listingID;
		console.log(endURL);
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.listingInformation = data.listingInformation;
			$scope.bidList = data.listingInformation.submittedBids;
			console.log($scope.bidList);
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});

		endURL = apiIP + "jobs/" + $scope.listingID + "/jobRequestor";
		console.log(endURL);
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.requestor = data.userFullName;
			console.log($scope.requestor);
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});

		$scope.newBid = function (listingID) {
			$rootScope.listingId = listingID;
			$location.path('/bid');
		}
	});

	$scope.getProfile = function (id) {
		$rootScope.userId = id;
		$location.path('/profile');
	}
	
	$scope.searchCategory = function (query) {
		$rootScope.searchQuery = query;
		$location.path('/search');
	}
}]);

classifindApp.controller('createListingController', ['$scope', '$http', '$route', '$location', '$rootScope', '$cookieStore', function ($scope, $http, $route, $location, $rootScope, $cookieStore) {
	console.log("create listing controller loaded");
	var endpointURL = apiIP + 'classifindUsers/' + $cookieStore.get("userId");
	var response = $http.get(endpointURL);
	response.success(function (data, status, headers, config) {
		$scope.listingCity = data.userAddressCity;
		//$(".newListingCountry").val(data.userAddressCountry);
		$scope.listingPostal = data.userAddressPostal;
		$scope.listingStreet = data.userAddressStreet;
	});
	response.error(function (data, status, headers, config) {
		console.log(status);
	});
	$scope.createListing = function () {
		var dataObj = {
			requestorId: $cookieStore.get('userId'),
			jobTitle: $scope.listingTitle,
			jobDescription: $scope.listingDesc,
			jobCategory: $scope.listingCategory,
			jobAddressStreet: $scope.listingStreet,
			jobAddressPostal: $scope.listingPostal,
			jobAddressCity: $scope.listingCity,
			jobAddressCountry: $scope.listingCountry,
			jobPostingDate: new Date(),
			jobStatus: 'Submitted'
		};

		console.log(dataObj);

		var endpointURL = apiIP + '/jobs';
		var response = $http.post(endpointURL, dataObj);

		response.success(function (data, status, headers, config) {
			$rootScope.listingId = data.id;
			$location.path('/listing');
		});
		response.error(function (data, status, headers, config) {
			//If status is 401 (wrong info) or -1 (server unreachable) do something
			console.log(status);
		});
	}
}]);

classifindApp.controller('bidController', ['$scope', '$http', '$route', '$location', '$rootScope', '$cookieStore', function ($scope, $http, $route, $location, $rootScope, $cookieStore) {
	console.log("bid controller loaded");
	$scope.listingID = $rootScope.listingId;
	$scope.$watch('$viewContentLoaded', function () {

		var endURL = apiIP + "jobs/listingInformation?jobId=" + $scope.listingID;
		console.log(endURL);
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.listingInformation = data.listingInformation;
			$scope.bidList = data.listingInformation.submittedBids;
			console.log($scope.bidList);
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});

		endURL = apiIP + "jobs/" + $scope.listingID + "/jobRequestor";
		console.log(endURL);
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.requestor = data.userFullName;
			console.log($scope.requestor);
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});

	$scope.placeBid = function () {
		var dataObj = {
			bidDate: new Date(),
			bidPrice: $scope.bidPrice,
			providerId: $cookieStore.get('userId'),
			jobId: $rootScope.listingId
		};

		var endpointURL = apiIP + '/bids';
		var response = $http.post(endpointURL, dataObj);

		response.success(function (data, status, headers, config) {
			$location.path('/listing');
		});
		response.error(function (data, status, headers, config) {
			//If status is 401 (wrong info) or -1 (server unreachable) do something
			console.log(status);
		});
	}
}]);

classifindApp.filter('startFrom', function () {
    return function (input, start) {
		if (!input || !input.length) { return; }
        start = +start; //parse to int
        return input.slice(start);
    }
});

