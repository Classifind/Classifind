var classifindApp = angular.module('classifindApp', ['ngRoute', 'ngCookies', 'classifind.angular-timeago', 'ngTagsInput']);
var apiIP = 'http://classifind-api.herokuapp.com/api/';


classifindApp.config(function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
	$routeProvider

        .when('/', {
            templateUrl: 'partials/splash.html'
        })

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

		.when('/manage-job', {
            templateUrl: 'partials/manage-job.html',
            controller: 'manageJobController'
        })

		.when('/create-review', {
            templateUrl: 'partials/create-review.html',
            controller: 'createReviewController'
        })

		.when('/bid', {
            templateUrl: 'partials/bid.html',
            controller: 'bidController'
        })

		.otherwise({
			redirectTo: '/'
		});
});

classifindApp.directive('starRating', starRating);

function starRating() {
    return {
      restrict: 'EA',
      template:
        '<ul class="star-rating" ng-class="{readonly: readonly}">' +
        '  <li ng-repeat="star in stars" class="star" ng-class="{filled: star.filled}" ng-click="toggle($index)">' +
        '    <i class="fa fa-star"></i>' + 
        '  </li>' +
        '</ul>',
      scope: {
        ratingValue: '=ngModel',
        max: '=?', 
        onRatingSelect: '&?',
        readonly: '=?'
      },
      link: function(scope, element, attributes) {
        if (scope.max == undefined) {
          scope.max = 5;
        }
        function updateStars() {
          scope.stars = [];
          for (var i = 0; i < scope.max; i++) {
            scope.stars.push({
              filled: i < scope.ratingValue
            });
          }
        };
        scope.toggle = function(index) {
          if (scope.readonly == undefined || scope.readonly === false){
            scope.ratingValue = index + 1;
            scope.onRatingSelect({
              rating: index + 1
            });
          }
        };
        scope.$watch('ratingValue', function(oldValue, newValue) {
          if (newValue) {
            updateStars();
          }
        });
      }
    };
  }

/***************************************************************************************************************************
 * 												   Login Controller                                                        *
 ***************************************************************************************************************************/
classifindApp.controller('loginController', ['$scope', '$route', '$http', '$location', '$rootScope', '$window', '$cookieStore', function ($scope, $route, $http, $location, $rootScope, $window, $cookieStore) {
	$scope.loggedIn = $cookieStore.get('loggedIn');
	$scope.userName = $cookieStore.get('userName');
	if ($scope.loggedIn == 'true') {
		$scope.loggedOut = "";
		$scope.userName = $cookieStore.get('userName');
	}
	else {
		$scope.loggedOut = "true";
	}

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

/***************************************************************************************************************************
 * 												 Dashboard Controller                                                      *
 ***************************************************************************************************************************/
classifindApp.controller('dashController', ['$scope', '$route', '$http', '$location', '$rootScope', '$cookieStore', 'timeAgo', '$document', '$timeout', function ($scope, $route, $http, $location, $rootScope, $cookieStore, timeAgo, $document, $timeout) {
	$scope.isRatingReadonly = true;
	var oneDay = 60 * 60 * 24;
	timeAgo.settings.fullDateAfterSeconds = oneDay;
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
			var endURL2 = apiIP + "classifindUsers/" + uID + "/userSkills";
			var response2 = $http.get(endURL2);
			response2.success(function (data, status, headers, config) {
				$scope.userSkills = data;
			});
			response2.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		endURL = apiIP + "classifindUsers/incompleteRequestedJobs?userId=" + uID;
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.requestorPage = 0;
			$scope.pSize = 3;
			$scope.requestedJobs = data.requestedJobInfo.requestedJobs;
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		endURL = apiIP + "classifindUsers/incompleteProvidedJobs?userId=" + uID;
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.providerPage = 0;
			$scope.pSize = 3;
			$scope.providedJobs = data.userJobsToReview.providedJobs;
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		endURL = apiIP + "reviews/receivedProviderReviews?userId=" + uID;
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.receivedProviderPage = 0;
			$scope.pSize = 3;
			$scope.receivedProviderReviews = data.reviewInfo;
			var count = 0;
			var receivedProviderAvg = 0;
			angular.forEach(data.reviewInfo, function(review) {
				receivedProviderAvg += review.reviewRating;
				count += 1;
			});
			var avg = receivedProviderAvg / count;
			$scope.receivedProviderAverage = (Math.round(avg * 100) / 100).toFixed(1);
			$scope.providerCount = count;
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		endURL = apiIP + "reviews/receivedRequestorReviews?userId=" + uID;
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.receivedRequestorPage = 0;
			$scope.pSize = 3;
			$scope.receivedRequestorReviews = data.reviewInfo;
			var count = 0;
			var receivedRequestorAvg = 0;
			angular.forEach(data.reviewInfo, function(review) {
				receivedRequestorAvg += review.reviewRating;
				count += 1;
			});
			var avg = receivedRequestorAvg / count;
			$scope.receivedRequestorAverage = (Math.round(avg * 100) / 100).toFixed(1);
			$scope.requestorCount = count;
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});

	$scope.newListing = function () {
		$location.url('/new-listing');
	}

	$scope.viewListing = function (id) {
		$rootScope.listingId = id;
		$location.url('/listing');
	}
	
	$scope.viewUser = function (id) {
		$rootScope.userId = id;
		$location.path('/profile');
	}

	$scope.manageJob = function (id, acceptedBidId) {
		$rootScope.listingId = id;
		$rootScope.acceptedBidId = acceptedBidId;
		$location.url('/manage-job');
	}

	$scope.reviewPage = function (id, acceptedBidId) {
		$rootScope.listingId = id;
		$rootScope.acceptedBidId = acceptedBidId;
		$location.url('/create-review');
	}

	$scope.deleteListing = function (id) {
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


/***************************************************************************************************************************
 * 											       Profile Controller                                                      *
 ***************************************************************************************************************************/
classifindApp.controller('profileController', ['$scope', '$route', '$http', '$location', '$rootScope', '$cookieStore', function ($scope, $route, $http, $location, $rootScope, $cookieStore) {
	$scope.$watch('$viewContentLoaded', function () {
		var uID = $rootScope.userId;
		var endURL = apiIP + "classifindUsers/" + uID;
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.profile = data;
			var endURL2 = apiIP + "classifindUsers/" + uID + "/userSkills";
			var response2 = $http.get(endURL2);
			response2.success(function (data, status, headers, config) {
				$scope.userSkills = data;
			});
			response2.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		endURL = apiIP + "classifindUsers/" + uID + "/requestedJobs?filter=%7B%22where%22%3A%7B%22jobStatus%22%3A%22Submitted%22%7D%7D";
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			console.log(data);
			$scope.requestorPage = 0;
			$scope.pSize = 3;
			$scope.requestedJobs = data;
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		endURL = apiIP + "reviews/receivedProviderReviews?userId=" + uID;
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.receivedProviderPage = 0;
			$scope.pSize = 3;
			$scope.receivedProviderReviews = data.reviewInfo;
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		endURL = apiIP + "reviews/receivedRequestorReviews?userId=" + uID;
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.receivedRequestorPage = 0;
			$scope.pSize = 3;
			$scope.receivedRequestorReviews = data.reviewInfo;
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});


	$scope.viewListing = function (id) {
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


/***************************************************************************************************************************
 * 												  Register Controller                                                      *
 ***************************************************************************************************************************/
classifindApp.controller('registerController', ['$scope', '$http', '$location', '$rootScope', '$cookieStore', '$window', function ($scope, $http, $location, $rootScope, $cookieStore, $window) {
	var endpointURL2 = apiIP + 'skillReferences';
	var response2 = $http.get(endpointURL2);
	response2.success(function (data, status, headers, config) {
		$scope.skillTags = data;
	});
	response2.error(function (data, status, headers, config) {
		console.log(status);
	});
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
		var endURL = apiIP + 'classifindUsers';
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
					var dataObj = new Array();
					
					angular.forEach($scope.tags, function(value) {
						dataObj.push({skillName: value.skillName, classifindUserId: data.id});
					});
					
					var endpointURL2 = apiIP + '/userSkills';
					var response2 = $http.post(endpointURL2, dataObj);
					
					response2.success(function (data, status, headers, config) {
						$window.location.href = 'http://classifind.ca/';
					});
					
					response.error(function (data, status, headers, config) {
						//If status is 401 (wrong info) or -1 (server unreachable) do something
						console.log(status);
					});
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
	$scope.submitForm = function() {
        if ($scope.registration.$valid) {
            
        }
    };
	$scope.loadTags = function($query) {
		return $scope.skillTags.filter(function(skill) {
			return skill.skillName.toLowerCase().indexOf($query.toLowerCase()) != -1;
		});
	};
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


/***************************************************************************************************************************
 * 												Search Results Controller                                                      *
 ***************************************************************************************************************************/
classifindApp.controller('searchResultsController', ['$scope', '$http', '$route', '$location', '$rootScope', 'timeAgo', function ($scope, $http, $route, $location, $rootScope, timeAgo) {
	var oneDay = 60 * 60 * 24;
	timeAgo.settings.fullDateAfterSeconds = oneDay;
	$scope.$watch('$viewContentLoaded', function () {
		if ($rootScope.searchQuery == '') {
			var endURL = apiIP + "jobs/listAllJobs";
		}
		else {
			var endURL = apiIP + "jobs/searchJobs?searchQuery=" + $rootScope.searchQuery;
		}
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.searchResults = data.jobs;
			$scope.dataLength = $scope.searchResults.length;
			$location.path('/search');
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});
	$scope.openListing = function (jobId) {
		$rootScope.listingId = jobId;
		$location.path('/listing');
	}
}]);


/***************************************************************************************************************************
 * 												  Listing Controller                                                       *
 ***************************************************************************************************************************/
classifindApp.controller('listingController', ['$scope', '$http', '$route', '$location', '$rootScope', '$cookieStore', function ($scope, $http, $route, $location, $rootScope, $cookieStore) {
	$scope.listingID = $rootScope.listingId;
	$scope.isOwner = false;
	$scope.$watch('$viewContentLoaded', function () {

		var endURL = apiIP + "jobs/listingInformation?jobId=" + $scope.listingID;
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.listingInformation = data.listingInformation;
			$scope.bidList = data.listingInformation.submittedBids;
			if ($cookieStore.get('userId') == data.listingInformation.requestorId) {
				$scope.isOwner = true;
			}
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});

		endURL = apiIP + "jobs/" + $scope.listingID + "/jobRequestor";
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.requestor = data.userFullName;
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});

		$scope.newBid = function (listingID) {
			$rootScope.listingId = listingID;
			$location.path('/bid');
		}
	});

	$scope.accept = function (bidId, bidProviderId) {
		var dataObj = {
			jobStatus: "In Progress",
			acceptedBidId: bidId,
			providerId: bidProviderId
		};

		var endpointURL = apiIP + 'jobs/' + $scope.listingID;
		var response = $http.put(endpointURL, dataObj);

		response.success(function (data, status, headers, config) {
			$rootScope.listingId = data.id;
			$rootScope.acceptedBidId = data.acceptedBidId;
			$location.path('/manage-job');
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	}

	$scope.getProfile = function (id) {
		$rootScope.userId = id;
		$location.path('/profile');
	}

	$scope.searchCategory = function (query) {
		$rootScope.searchQuery = query;
		$location.path('/search');
	}
}]);


/***************************************************************************************************************************
 * 												Manage Job Controller                                                      *
 ***************************************************************************************************************************/
classifindApp.controller('manageJobController', ['$scope', '$route', '$http', '$location', '$rootScope', '$cookieStore', function ($scope, $route, $http, $location, $rootScope, $cookieStore) {
	$scope.listingID = $rootScope.listingId;
	$scope.acceptedBid = $rootScope.acceptedBidId;
	$scope.$watch('$viewContentLoaded', function () {
		$('#starRating').rating({
			min: 1,
			max: 5,
			step: 1,
			size: 'xs',
			showClear: false
		});
		var endURL = apiIP + "jobs/managementInformation?jobId=" + $scope.listingID + "&bidId=" + $scope.acceptedBid;
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.managementInformation = data.managementInformation;
			$scope.acceptedBidList = data.managementInformation.submittedBids;

			endURL = apiIP + "classifindUsers/" + data.managementInformation.providerId;
			response = $http.get(endURL);
			response.success(function (data, status, headers, config) {
				$scope.providerInfo = data;
			});
			response.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});
	$scope.reviewProvider = function (jobId, requestorId, providerId) {
		var dataObj = {
			reviewComments: $scope.reviewComment,
			reviewRating: $("#starRating").val(),
			reviewType: "Provider",
			reviewDate: new Date(),
			reviewedJobId: jobId,
			submittingUserId: requestorId,
			receivingUserId: providerId
		};

		var endpointURL = apiIP + 'reviews';
		var response = $http.post(endpointURL, dataObj);

		response.success(function (data, status, headers, config) {
			var dataObj2 = {
				jobStatus: "Awaiting Review"
			};

			endpointURL = apiIP + 'jobs/' + jobId;
			response = $http.put(endpointURL, dataObj2);

			response.success(function (data, status, headers, config) {
				$location.url('/dashboard');
			});
			response.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	}
}]);


/***************************************************************************************************************************
 * 												Create Review Controller                                                   *
 ***************************************************************************************************************************/
classifindApp.controller('createReviewController', ['$scope', '$route', '$http', '$location', '$rootScope', '$cookieStore', function ($scope, $route, $http, $location, $rootScope, $cookieStore) {
	$scope.listingID = $rootScope.listingId;
	$scope.acceptedBid = $rootScope.acceptedBidId;
	$scope.$watch('$viewContentLoaded', function () {
		$('#starRating').rating({
			min: 1,
			max: 5,
			step: 1,
			size: 'xs',
			showClear: false
		});
		var endURL = apiIP + "jobs/managementInformation?jobId=" + $scope.listingID + "&bidId=" + $scope.acceptedBid;
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.managementInformation = data.managementInformation;
			$scope.acceptedBidList = data.managementInformation.submittedBids;

			endURL = apiIP + "classifindUsers/" + data.managementInformation.requestorId;
			response = $http.get(endURL);
			response.success(function (data, status, headers, config) {
				$scope.requestorInfo = data;
			});
			response.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});
	$scope.reviewProvider = function (jobId, requestorId, providerId) {
		var dataObj = {
			reviewComments: $scope.reviewComment,
			reviewRating: $("#starRating").val(),
			reviewType: "Requestor",
			reviewDate: new Date(),
			reviewedJobId: jobId,
			submittingUserId: providerId,
			receivingUserId: requestorId
		};

		var endpointURL = apiIP + 'reviews';
		var response = $http.post(endpointURL, dataObj);

		response.success(function (data, status, headers, config) {
			var dataObj2 = {
				jobStatus: "Completed"
			};

			endpointURL = apiIP + 'jobs/' + jobId;
			response = $http.put(endpointURL, dataObj2);

			response.success(function (data, status, headers, config) {
				$location.url('/dashboard');
			});
			response.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	}
}]);


/***************************************************************************************************************************
 * 										       Create Listing Controller                                                   *
 ***************************************************************************************************************************/
classifindApp.controller('createListingController', ['$scope', '$http', '$route', '$location', '$rootScope', '$cookieStore', function ($scope, $http, $route, $location, $rootScope, $cookieStore) {
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
	var endpointURL2 = apiIP + 'skillReferences';
	var response2 = $http.get(endpointURL2);
	response2.success(function (data, status, headers, config) {
		$scope.skillTags = data;
	});
	response2.error(function (data, status, headers, config) {
		console.log(status);
	});
	$scope.submitNewListing = function () {
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


		var endpointURL = apiIP + '/jobs';
		var response = $http.post(endpointURL, dataObj);

		response.success(function (data, status, headers, config) {
			$rootScope.listingId = data.id;
			var dataObj = new Array();
			
			angular.forEach($scope.tags, function(value) {
				dataObj.push({skillName: value.skillName, jobId: data.id});
			});
			
			var endpointURL2 = apiIP + '/jobSkills';
			var response2 = $http.post(endpointURL2, dataObj);
			
			response2.success(function (data, status, headers, config) {
				$location.path('/listing');
			});
			
			response.error(function (data, status, headers, config) {
				//If status is 401 (wrong info) or -1 (server unreachable) do something
				console.log(status);
			});
		});
		response.error(function (data, status, headers, config) {
			//If status is 401 (wrong info) or -1 (server unreachable) do something
			console.log(status);
		});
	}
	$scope.loadTags = function($query) {
		return $scope.skillTags.filter(function(skill) {
			return skill.skillName.toLowerCase().indexOf($query.toLowerCase()) != -1;
		});
	};
	$scope.submitForm = function() {
        if ($scope.createListing.$valid) {
            
        }
    };
}]);


/***************************************************************************************************************************
 * 												     Bid Controller                                                        *
 ***************************************************************************************************************************/
classifindApp.controller('bidController', ['$scope', '$http', '$route', '$location', '$rootScope', '$cookieStore', function ($scope, $http, $route, $location, $rootScope, $cookieStore) {
	$scope.listingID = $rootScope.listingId;
	$scope.$watch('$viewContentLoaded', function () {

		var endURL = apiIP + "jobs/listingInformation?jobId=" + $scope.listingID;
		var response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.listingInformation = data.listingInformation;
			$scope.bidList = data.listingInformation.submittedBids;
		});
		response.error(function (data, status, headers, config) {
			console.log(status);
		});

		endURL = apiIP + "jobs/" + $scope.listingID + "/jobRequestor";
		response = $http.get(endURL);
		response.success(function (data, status, headers, config) {
			$scope.requestor = data.userFullName;
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

