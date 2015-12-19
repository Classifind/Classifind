var classifindApp = angular.module('classifindApp', ['ngRoute', 'ngCookies', 'classifind.angular-timeago', 'ngTagsInput', 'ngFileUpload', 'ngImgCrop']);
var apiIP = 'http://classifind-api.herokuapp.com/api/';


classifindApp.config(function ($routeProvider, $locationProvider) {
    //Enable refreshing on your current page
	$locationProvider.html5Mode(true).hashPrefix('!');
	//Routing Information
	$routeProvider
        .when('/', {
            templateUrl: 'partials/splash.html',
			controller: 'splashController'
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

//Custom directive for Star Ratings
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
  
//Custom directive to confirm deletion as an alert in browser
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


/***************************************************************************************************************************
 * 												   Login Controller                                                        *
 ***************************************************************************************************************************/
classifindApp.controller('loginController', ['$scope', '$route', '$http', '$location', '$rootScope', '$window', '$cookieStore', function ($scope, $route, $http, $location, $rootScope, $window, $cookieStore) {
	//Retrieve cookie information to check login status
	$scope.loggedIn = $cookieStore.get('loggedIn');
	$scope.userName = $cookieStore.get('userName');
	if ($scope.loggedIn == 'true') {
		$scope.loggedOut = "";
		$scope.userName = $cookieStore.get('userName');
	}
	else {
		$scope.loggedOut = "true";
	}
	
	//Function to handle login
	$scope.login = function () {
		//Data object for API
		var dataObj = {
			email: $scope.userEmail,
			password: $scope.userPassword
		};
		//API information (Post)
		var endpointURL = apiIP + 'classifindUsers/login';
		var response = $http.post(endpointURL, dataObj);
		
		//On success retrieve user information with another API call (Get)
		response.success(function (data, status, headers, config) {
			$rootScope.sessionToken = data.id;
			$rootScope.userId = data.userId;
			$cookieStore.put('loggedIn', 'true');
			$cookieStore.put('sessionToken', data.id + '');
			$cookieStore.put('userId', data.userId + '');
			endpointURL = apiIP + 'classifindUsers/' + data.userId;
			response = $http.get(endpointURL);
			//On success store login information in cookie and redirect to home
			response.success(function (data, status, headers, config) {
				$cookieStore.put('userName', data.username);
				$window.location.href = 'http://classifind.ca/';
			});
			response.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		response.error(function (data, status, headers, config) {
			//If status is 401 (wrong info) or -1 (server unreachable) output error details
			console.log(status);
		});
	}
	
	//Function to redirect + handle search queries
	$scope.showResults = function (searchQuery) {
		$location.url('/search?q=' + encodeURIComponent(searchQuery));
	}
	
	//Function to redirect to dashboard
	$scope.profile = function () {
		$location.url('/dashboard');
	}
	
	//Function to show all listings with no query
	$scope.getJobs = function () {
		$rootScope.searchQuery = '';
		$location.url('/search');
	}
	
	//Function to redirect to register page
	$scope.register = function () {
		$location.url('/register');
	}

	//Function to handle logout button, remove cookie information and go home
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
 * 												 Splash Controller                                        	               *
 ***************************************************************************************************************************/
classifindApp.controller('splashController', ['$scope', '$route', '$http', '$location', '$rootScope', '$cookieStore', 'timeAgo', '$document', '$timeout', function ($scope, $route, $http, $location, $rootScope, $cookieStore, timeAgo, $document, $timeout) {
	//Initialize TimeAgo plugin to display xx hours ago when listings are less than 24 hours old
	var oneDay = 60 * 60 * 24;
	timeAgo.settings.fullDateAfterSeconds = oneDay;
	
	//Retrieve cookie information
	$scope.loggedIn = $cookieStore.get('loggedIn');
	$scope.userName = $cookieStore.get('userName');
	$scope.uID = $cookieStore.get('userId');
	
	//On page load
	$scope.$watch('$viewContentLoaded', function () {
		console.log($scope.uID);
		console.log($scope.loggedIn);
		//If logged in, suggest jobs to user by retrieving from API (Get with user ID)
		if ($scope.loggedIn == 'true') {
			var endURL = apiIP + "classifindUsers/jobSuggestions?userId=" + $scope.uID;
			var response = $http.get(endURL);
			response.success(function (data, status, headers, config) {
				//On success output retrieved data to scope variable
				$scope.suggested = data.data;
			});
			response.error(function (data, status, headers, config) {
				//Else output error
				console.log(status);
			});
		}
	});
	
	//Function to handle redirection to listing if one is clicked
	$scope.viewListing = function (id) {
		$rootScope.listingId = id;
		$location.url('/listing');
	}
}]);

/***************************************************************************************************************************
 * 												 Dashboard Controller                                                      *
 ***************************************************************************************************************************/
classifindApp.controller('dashController', ['$scope', '$route', '$http', '$location', '$rootScope', '$cookieStore', 'timeAgo', '$document', '$timeout', function ($scope, $route, $http, $location, $rootScope, $cookieStore, timeAgo, $document, $timeout) {
	
	//Scope boolean to specify star ratings should be read only
	$scope.isRatingReadonly = true;
	
	//Initialize TimeAgo plugin to display xx hours ago when listings are less than 24 hours old
	var oneDay = 60 * 60 * 24;
	timeAgo.settings.fullDateAfterSeconds = oneDay;
	
	//Retrieve cookie information to get logged in username
	$scope.loggedIn = $cookieStore.get('loggedIn');
	$scope.userName = $cookieStore.get('userName');
	if ($scope.loggedIn == 'true') {
		$scope.loggedOut = "";
		$scope.userName = $cookieStore.get('userName');
	}
	
	//On page load
	$scope.$watch('$viewContentLoaded', function () {
		
		//Retrieve cookie information to get logged in user
		var uID = $cookieStore.get('userId');
		
		//API call to retrieve logged in user's information (Get)
		var endURL = apiIP + "classifindUsers/" + uID;
		var response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Store profile data in scope variable
			$scope.profile = data;
			
			//API call to retrieve skills of user (Get)
			var endURL2 = apiIP + "classifindUsers/" + uID + "/userSkills";
			var response2 = $http.get(endURL2);
			
			//On success
			response2.success(function (data, status, headers, config) {
				//Store user skills in scope variable
				$scope.userSkills = data;
			});
			
			//Else output error
			response2.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		
		//Else output error
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		
		//API call to retrieve jobs the user has listed that a bid has not been accepted for (Get)
		endURL = apiIP + "classifindUsers/incompleteRequestedJobs?userId=" + uID;
		response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Output jobs into scope variable
			$scope.requestorPage = 0;
			$scope.pSize = 3;
			$scope.requestedJobs = data.requestedJobInfo.requestedJobs;
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		
		//API call to retrieve jobs the user is currently working on (Get)
		endURL = apiIP + "classifindUsers/incompleteProvidedJobs?userId=" + uID;
		response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Output jobs into scope variable
			$scope.providerPage = 0;
			$scope.pSize = 3;
			$scope.providedJobs = data.userJobsToReview.providedJobs;
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		
		//API call to retrieve received reviews as a job completer (Get)
		endURL = apiIP + "reviews/receivedProviderReviews?userId=" + uID;
		response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Output reviews to scope variable
			$scope.receivedProviderPage = 0;
			$scope.pSize = 3;
			$scope.receivedProviderReviews = data.reviewInfo;
			
			//Calculate user's average rating for job provider category
			var count = 0;
			var receivedProviderAvg = 0;
			angular.forEach(data.reviewInfo, function(review) {
				receivedProviderAvg += review.reviewRating;
				count += 1;
			});
			var avg = receivedProviderAvg / count;
			
			//Output average and number of reviews to scope variables
			$scope.receivedProviderAverage = Number((Math.round(avg * 100) / 100).toFixed(1));
			$scope.providerCount = count;
			
			//Instantiate star plugin to show stars
			$("#completedRating").rating({
				size: 'xs',
				readonly: true,
				showClear: false,
				showCaption: false
			});
			//Update stars to show the user's average
			$("#completedRating").rating('update', $scope.receivedProviderAverage);
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		
		//API call to retrieve received reviews as a job lister (Get)
		endURL = apiIP + "reviews/receivedRequestorReviews?userId=" + uID;
		response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Output reviews to scope variable
			$scope.receivedRequestorPage = 0;
			$scope.pSize = 3;
			$scope.receivedRequestorReviews = data.reviewInfo;
			
			//Calculate user's average rating for job requestor category
			var count = 0;
			var receivedRequestorAvg = 0;
			angular.forEach(data.reviewInfo, function(review) {
				receivedRequestorAvg += review.reviewRating;
				count += 1;
			});
			var avg = receivedRequestorAvg / count;
			
			//Output average and number of reviews to scope variables
			$scope.receivedRequestorAverage = Number((Math.round(avg * 100) / 100).toFixed(1));
			$scope.requestorCount = count;
			
			//Instantiate star plugin to show stars
			$("#postedRating").rating({
				size: 'xs',
				readonly: true,
				showClear: false,
				showCaption: false
			});
			
			//Update stars to show the user's average
			$("#postedRating").rating('update', $scope.receivedRequestorAverage);
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});
	
	//Function to redirect to new listing
	$scope.newListing = function () {
		$location.url('/new-listing');
	}

	//Function to redirect to selected listing
	$scope.viewListing = function (id) {
		$rootScope.listingId = id;
		$location.url('/listing');
	}
	
	//Function to redirect to selected profile
	$scope.viewUser = function (id) {
		$rootScope.userId = id;
		$location.path('/profile');
	}
	
	//Function to redirect to selected job's management page when bid has already been accepted
	$scope.manageJob = function (id, acceptedBidId) {
		$rootScope.listingId = id;
		$rootScope.acceptedBidId = acceptedBidId;
		$location.url('/manage-job');
	}

	//Function to redirect to review requestor page when job has been completed by you, and reviewed by requestor
	$scope.reviewPage = function (id, acceptedBidId) {
		$rootScope.listingId = id;
		$rootScope.acceptedBidId = acceptedBidId;
		$location.url('/create-review');
	}
	
	//Function to handle deletion of selected listing
	$scope.deleteListing = function (id) {
		//API call to delete listing (Delete)
		var endURL = apiIP + "jobs/" + id;
		var response = $http.delete(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Refresh view
			$route.reload();
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	}
}]);


/***************************************************************************************************************************
 * 											       Profile Controller                                                      *
 ***************************************************************************************************************************/
classifindApp.controller('profileController', ['$scope', '$route', '$http', '$location', '$rootScope', '$window', '$cookieStore', function ($scope, $route, $http, $location, $rootScope, $cookieStore, $window) {
	//On page load
	$scope.$watch('$viewContentLoaded', function () {
		//Get passed user ID from previous controller
		var uID = $rootScope.userId;
		
		//API call to get user information (Get)
		var endURL = apiIP + "classifindUsers/" + uID;
		var response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Store profile data in scope variable
			$scope.profile = data;
			
			//API call to get user skills
			var endURL2 = apiIP + "classifindUsers/" + uID + "/userSkills";
			var response2 = $http.get(endURL2);
			
			//On success
			response2.success(function (data, status, headers, config) {
				//Store user's skills in scope variable
				$scope.userSkills = data;
			});
			
			//Else output error information
			response2.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		
		//API call to get requested jobs and filter out jobs that are already in progress
		endURL = apiIP + "classifindUsers/" + uID + "/requestedJobs?filter=%7B%22where%22%3A%7B%22jobStatus%22%3A%22Submitted%22%7D%7D";
		response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Output job list to scope variable
			$scope.requestorPage = 0;
			$scope.pSize = 3;
			$scope.requestedJobs = data;
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		
		//API call to retrieve selected user's reviews as a job completer (Get)
		endURL = apiIP + "reviews/receivedProviderReviews?userId=" + uID;
		response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Store reviews in scope variable
			$scope.receivedProviderPage = 0;
			$scope.pSize = 3;
			$scope.receivedProviderReviews = data.reviewInfo;
			
			//Calculate selected user's average as completer
			var count = 0;
			var receivedProviderAvg = 0;
			angular.forEach(data.reviewInfo, function(review) {
				receivedProviderAvg += review.reviewRating;
				count += 1;
			});
			var avg = receivedProviderAvg / count;
			
			//Store average in scope variable
			$scope.receivedProviderAverage = (Math.round(avg * 100) / 100).toFixed(1);
			$scope.providerCount = count;
			
			//Initialize star plugin on page
			$("#completedRating").rating({
				size: 'xs',
				readonly: true,
				showClear: false,
				showCaption: false
			});
			
			//Update stars to show average
			$("#completedRating").rating('update', $scope.receivedProviderAverage);	
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
		
		//API call to retrieve selected user's reviews as a job lister (Get)
		endURL = apiIP + "reviews/receivedRequestorReviews?userId=" + uID;
		response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Store reviews in scope variable
			$scope.receivedRequestorPage = 0;
			$scope.pSize = 3;
			$scope.receivedRequestorReviews = data.reviewInfo;
			
			//Calculate selected user's average as completer
			var count = 0;
			var receivedRequestorAvg = 0;
			angular.forEach(data.reviewInfo, function(review) {
				receivedRequestorAvg += review.reviewRating;
				count += 1;
			});
			var avg = receivedRequestorAvg / count;
			
			//Store average in scope variable
			$scope.receivedRequestorAverage = (Math.round(avg * 100) / 100).toFixed(1);
			$scope.requestorCount = count;
			
			//Initialize star plugin on page
			$("#postedRating").rating({
				size: 'xs',
				readonly: true,
				showClear: false,
				showCaption: false
			});
			
			//Update stars to show average
			$("#postedRating").rating('update', $scope.receivedRequestorAverage);
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});
	
	//Function to redirect to selected profile
	$scope.viewProfile = function (id) {
		console.log("viewProfile called, id: " + id);
		$rootScope.userId = id;
		$route.reload();
	}
	
	//Function to redirect to selected listing
	$scope.viewListing = function (id) {
		$rootScope.listingId = id;
		$location.url('/listing');
	}
}]);

/***************************************************************************************************************************
 * 												  Search Controller                             	                       *
 ***************************************************************************************************************************/
classifindApp.controller('searchController', ['$route', '$scope', '$http', '$location', '$rootScope', function ($route, $scope, $http, $location, $rootScope) {
	//Function to handle search
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
classifindApp.controller('registerController', ['$scope', '$http', '$location', '$rootScope', '$cookieStore', '$window', 'Upload', function ($scope, $http, $location, $rootScope, $cookieStore, $window, Upload) {
        //API call to get skill suggestions (Get)
		var endpointURL2 = apiIP + 'skillReferences';
        var response2 = $http.get(endpointURL2);
		
		//On success output to scope variable
        response2.success(function (data, status, headers, config) {
                $scope.skillTags = data;
        });
		
		//Else output errors
        response2.error(function (data, status, headers, config) {
                console.log(status);
        });
		
		//Function to process registration
        $scope.registerUser = function (croppedDataUrl) {
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
				
				//API call to store new user (Post)
                var endURL = apiIP + 'classifindUsers';
                var response = $http.post(endURL, dataObj);
                response.success(function (data, status, headers, config) { //Successful user creation
                     	var userId = data.id;
						
						//Process file upload (avatar)
						var file = $scope.file;
						$scope.upload = Upload.upload({
								url: 'upload.php',
								data: { file: file, username: $scope.userName }
						}).success(function (data, status, headers, config) { //On success
								//API Call to store link to uploaded file in new user
								var endpointURL = apiIP + 'classifindUsers/' + userId;
								console.log(userId);
								var dataObj = {
										profilePic: data
								};
								var response = $http.put(endpointURL, dataObj);
								
								//On success
								response.success(function (data, status, headers, config) {
									//Retrieve skill tags from form
									var dataObj = new Array();
									angular.forEach($scope.tags, function (value) {
											dataObj.push({ skillName: value.skillName, classifindUserId: data.id });
									});
									
									//API call to store skills
									var endpointURL2 = apiIP + '/userSkills';
									var response2 = $http.post(endpointURL2, dataObj);
									
									//On success
									response2.success(function (data, status, headers, config) { 
											var dataObj = {
													email: $scope.userEmail,
													password: $scope.userPassword
											};
											
											//API call to login as created user (Post)
											var endpointURL = apiIP + 'classifindUsers/login';
											var response = $http.post(endpointURL, dataObj);
											
											//On success
											response.success(function (data, status, headers, config) {
													//Store cookie information and pass user in root scope
													$rootScope.sessionToken = data.id;
													$rootScope.userId = data.userId;
													$cookieStore.put('loggedIn', 'true');
													$cookieStore.put('sessionToken', data.id + '');
													$cookieStore.put('userId', data.userId + '');
													
													//API call to get user information (Get)
													endpointURL = apiIP + 'classifindUsers/' + data.userId;
													response = $http.get(endpointURL);
													
													//On success
													response.success(function (data, status, headers, config) {
															//Store cookie and go to homepage
															$cookieStore.put('userName', data.username);
															$window.location.href = 'http://classifind.ca/';
													});
													
													//Else output error information
													response.error(function (data, status, headers, config) {
															console.log(status);
													});
											});
											
											//Else output error information
											response.error(function (data, status, headers, config) {
													console.log(status);
											});
									});
									 
									//Else output error information
									response.error(function (data, status, headers, config) {
											//If status is 401 (wrong info) or -1 (server unreachable) output error
											console.log(status);
									});             
								});
								
								//Output errors
								response.error(function (data, status, headers, config) {
								});
								
						//You guessed it
						}).error(function (data, status) {
								console.log(data);
						});
                });
				
				//Yup
                response.error(function (data, status, headers, config) {
                        console.log(status);
                });
        }
	
        $scope.submitForm = function () {
			if ($scope.registration.$valid) {

			}
        };
		
		//Function to load skill tags
        $scope.loadTags = function ($query) {
                return $scope.skillTags.filter(function (skill) {
                        return skill.skillName.toLowerCase().indexOf($query.toLowerCase()) != -1;
                });
        };
       
}]);


/***************************************************************************************************************************
 * 												Search Results Controller                                                      *
 ***************************************************************************************************************************/
classifindApp.controller('searchResultsController', ['$scope', '$http', '$route', '$location', '$rootScope', 'timeAgo', function ($scope, $http, $route, $location, $rootScope, timeAgo) {
	//Initialize time ago plugin to show age of job as xx hours ago if under 24 hours
	var oneDay = 60 * 60 * 24;
	timeAgo.settings.fullDateAfterSeconds = oneDay;
	
	//On page load
	$scope.$watch('$viewContentLoaded', function () {
		//API calls to search based on whether there's a query or not (Get)
		if ($rootScope.searchQuery == '') {
			var endURL = apiIP + "jobs/listAllJobs";
		}
		else {
			var endURL = apiIP + "jobs/searchJobs?searchQuery=" + $rootScope.searchQuery;
		}
		var response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Store jobs in scope variables and show search page
			$scope.searchResults = data.jobs;
			$scope.dataLength = $scope.searchResults.length;
			$location.path('/search');
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});
	
	//Function to handle selection of a listing
	$scope.openListing = function (jobId) {
		$rootScope.listingId = jobId;
		$location.path('/listing');
	}
}]);


/***************************************************************************************************************************
 * 												  Listing Controller                                                       *
 ***************************************************************************************************************************/
classifindApp.controller('listingController', ['$scope', '$http', '$route', '$location', '$rootScope', '$cookieStore', function ($scope, $http, $route, $location, $rootScope, $cookieStore) {
        //Retrieve logged in user information and selected listing
		$scope.listingID = $rootScope.listingId;
        $scope.loggedIn = $cookieStore.get('loggedIn');
        $scope.isOwner = false;
		
		//On page load
        $scope.$watch('$viewContentLoaded', function () {
				//API call to retrieve listing information (Get)
                var endURL = apiIP + "jobs/listingInformation?jobId=" + $scope.listingID;
                var response = $http.get(endURL);
				
				//On success
                response.success(function (data, status, headers, config) {
						//Store listing information in scope variable
                        $scope.listingInformation = data.listingInformation;
						
						//For each bid, retrieve bidder's information
                        var bidList = data.listingInformation.submittedBids;
                        var dataObj = new Array();
                        if(bidList.length > 0) {
                                angular.forEach(bidList, function (value) {
										//API call to retrieve provider
                                        endURL = apiIP + "reviews/receivedProviderReviews?userId=" + value.bidProvider.id;
                                        response = $http.get(endURL);
										
										//On success
                                        response.success(function (data, status, headers, config) {
												//Calculate average
                                                var count = 0;
                                                var receivedProviderAvg = 0;
                                                angular.forEach(data.reviewInfo, function (review) {
                                                                receivedProviderAvg += review.reviewRating;
                                                                count += 1;
                                                });
												
												//Store number of reviews, average in bid list, and store bid list in scope variable
												$scope.reviewNum = count;
                                                var avg = receivedProviderAvg / count;
                                                receivedProviderAvg = Number((Math.round(avg * 100) / 100).toFixed(1));
                                                dataObj.push({ bidPrice: value.bidPrice, bidDate: value.bidDate, id: value.id, providerId: value.providerId, jobId: value.jobId, bidProvider: value.bidProvider, bidProviderAvg: receivedProviderAvg });
                                                $scope.bidList = dataObj;
                                        });
                                });
                        }
                       	
						//Boolean to check if logged in user is owner of listing
                        if ($cookieStore.get('userId') == data.listingInformation.requestorId) {
                                $scope.isOwner = true;
                        }
                });
				
				//Else output error information
                response.error(function (data, status, headers, config) {
                        console.log(status);
                });
 				
				//API call to retrieve information of job requestor
                endURL = apiIP + "jobs/" + $scope.listingID + "/jobRequestor";
                response = $http.get(endURL);
                response.success(function (data, status, headers, config) {
                        $scope.requestor = data.userFullName;
						$scope.requestorPicture = data.profilePic;
                });
				
				//Else output error information
                response.error(function (data, status, headers, config) {
                        console.log(status);
                });
 				
				//Function to handle creation of a new bid on current listing
                $scope.newBid = function (listingID) {
                        $rootScope.listingId = listingID;
                        $location.path('/bid');
                }
        });
       
	   	//Function to allow owner of listing to accept a bid
        $scope.accept = function (bidId, bidProviderId) {
                var dataObj = {
                        jobStatus: "In Progress",
                        acceptedBidId: bidId,
                        providerId: bidProviderId
                };
 				
				//API call to update listing status and store accepted bid (Put)
                var endpointURL = apiIP + 'jobs/' + $scope.listingID;
                var response = $http.put(endpointURL, dataObj);
 				
				//On success
                response.success(function (data, status, headers, config) {
						//Redirect to manage job page
                        $rootScope.listingId = data.id;
                        $rootScope.acceptedBidId = data.acceptedBidId;
                        $location.path('/manage-job');
                });
				
				//Else output error information
                response.error(function (data, status, headers, config) {
                        console.log(status);
                });
        }
       	
		//Function to handle selection of profile
        $scope.getProfile = function (id) {
                $rootScope.userId = id;
                $location.path('/profile');
        }
		
       	//Function to handle search by category
        $scope.searchCategory = function (query) {
                $rootScope.searchQuery = query;
                $location.path('/search');
        }
}]);


/***************************************************************************************************************************
 * 												Manage Job Controller                                                      *
 ***************************************************************************************************************************/
classifindApp.controller('manageJobController', ['$scope', '$route', '$http', '$location', '$rootScope', '$cookieStore', function ($scope, $route, $http, $location, $rootScope, $cookieStore) {
	//Retrieve passed listing/bid id from previous controller
	$scope.listingID = $rootScope.listingId;
	$scope.acceptedBid = $rootScope.acceptedBidId;
	
	//On page load
	$scope.$watch('$viewContentLoaded', function () {
		//Initialize star rating plugin to allow user to enter a rating
		$('#starRating').rating({
			min: 1,
			max: 5,
			step: 1,
			size: 'xs',
			showClear: false
		});
		
		//API call to retrieve job management information (Get)
		var endURL = apiIP + "jobs/managementInformation?jobId=" + $scope.listingID + "&bidId=" + $scope.acceptedBid;
		var response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Store job management information in scope variables
			$scope.managementInformation = data.managementInformation;
			$scope.acceptedBidList = data.managementInformation.submittedBids;
			
			//API call to retrieve job provider's information (Get)
			endURL = apiIP + "classifindUsers/" + data.managementInformation.providerId;
			response = $http.get(endURL);
			
			//On success store information in scope variable
			response.success(function (data, status, headers, config) {
				$scope.providerInfo = data;
			});
			
			//Else output error information
			response.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});
	
	//Function to process review creation
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
		
		//API call to create reviews (Post)
		var endpointURL = apiIP + 'reviews';
		var response = $http.post(endpointURL, dataObj);
		
		//On success
		response.success(function (data, status, headers, config) {
			var dataObj2 = {
				jobStatus: "Awaiting Review"
			};
			
			//API call to update job status
			endpointURL = apiIP + 'jobs/' + jobId;
			response = $http.put(endpointURL, dataObj2);
			
			//On success return to dashboard
			response.success(function (data, status, headers, config) {
				$location.url('/dashboard');
			});
			
			//Else output error information
			response.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	}
}]);


/***************************************************************************************************************************
 * 												Create Review Controller                                                   *
 ***************************************************************************************************************************/
classifindApp.controller('createReviewController', ['$scope', '$route', '$http', '$location', '$rootScope', '$cookieStore', function ($scope, $route, $http, $location, $rootScope, $cookieStore) {
	//Retrieve root scope information
	$scope.listingID = $rootScope.listingId;
	$scope.acceptedBid = $rootScope.acceptedBidId;
	
	//On page load
	$scope.$watch('$viewContentLoaded', function () {
		//Initializing star rating plugin
		$('#starRating').rating({
			min: 1,
			max: 5,
			step: 1,
			size: 'xs',
			showClear: false
		});
		
		//API call to retrieve job and accepted bid information (Get)
		var endURL = apiIP + "jobs/managementInformation?jobId=" + $scope.listingID + "&bidId=" + $scope.acceptedBid;
		var response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Store information in scope variable
			$scope.managementInformation = data.managementInformation;
			$scope.acceptedBidList = data.managementInformation.submittedBids;
			
			//API call to retrieve requestor information (Get)
			endURL = apiIP + "classifindUsers/" + data.managementInformation.requestorId;
			response = $http.get(endURL);
			
			//On success
			response.success(function (data, status, headers, config) {
				//Store requestor information in scope variable
				$scope.requestorInfo = data;
			});
			
			//Else output error information
			response.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});
	
	//Function to handle review processing
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
		
		//API call to create new review (Post)
		var endpointURL = apiIP + 'reviews';
		var response = $http.post(endpointURL, dataObj);
		
		//On success
		response.success(function (data, status, headers, config) {
			var dataObj2 = {
				jobStatus: "Completed"
			};
			
			//API call to update job status (Put)
			endpointURL = apiIP + 'jobs/' + jobId;
			response = $http.put(endpointURL, dataObj2);
			
			//On success redirect to dashboard
			response.success(function (data, status, headers, config) {
				$location.url('/dashboard');
			});
			
			//Else output error information
			response.error(function (data, status, headers, config) {
				console.log(status);
			});
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	}
}]);


/***************************************************************************************************************************
 * 										       Create Listing Controller                                                   *
 ***************************************************************************************************************************/
classifindApp.controller('createListingController', ['$scope', '$http', '$route', '$location', '$rootScope', '$cookieStore', 'Upload', function ($scope, $http, $route, $location, $rootScope, $cookieStore, Upload) {
        //API call to create listing under specific user stored in cookie
		var endpointURL = apiIP + 'classifindUsers/' + $cookieStore.get("userId");
        var response = $http.get(endpointURL);
		
		//On success retrieve user address store in scope (Get)
        response.success(function (data, status, headers, config) {
                $scope.listingCity = data.userAddressCity;
                //$(".newListingCountry").val(data.userAddressCountry);
                $scope.listingPostal = data.userAddressPostal;
                $scope.listingStreet = data.userAddressStreet;
        });
        response.error(function (data, status, headers, config) {
                console.log(status);
        });
		//API call to get list of skills
        var endpointURL2 = apiIP + 'skillReferences';
        var response2 = $http.get(endpointURL2);
		//On success add skills to scope
        response2.success(function (data, status, headers, config) {
                $scope.skillTags = data;
        });
        response2.error(function (data, status, headers, config) {
                console.log(status);
        });
       
	    //Function to submit new listing
        $scope.submitNewListing = function () {
				//Create job listing object
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
 
				//API call to post job 
                var endpointURL = apiIP + '/jobs';
                var response = $http.post(endpointURL, dataObj);
				
				//On success 
                response.success(function (data, status, headers, config) {
                        $rootScope.listingId = data.id;
                        var jobId = data.id;
								//Handle image upload
                                var file = $scope.file;
                                $scope.upload = Upload.upload({
                                                url: 'uploadListing.php',
                                                data: { file: file, jobId: jobId }
                                })
                                .success(function (data, status, headers, config) { //On success
										//API call to update image for job (Put)
                                        var endpointURL = apiIP + 'jobs/' + jobId;
                                        var dataObj = {
                                                jobImage: data
                                        };
                                        var response = $http.put(endpointURL, dataObj);
										//On success 
                                        response.success(function (data, status, headers, config) {
                                                var dataObj = new Array();
												
                                                angular.forEach($scope.tags, function(value) {
                                                        dataObj.push({skillName: value.skillName, jobId: data.id});
                                                });
												
												//API call to update skills and job listing (Post)
                                                var endpointURL2 = apiIP + '/jobSkills';
                                                var response2 = $http.post(endpointURL2, dataObj);
                                               
											    //On success go to listing page
                                                response2.success(function (data, status, headers, config) {
                                                        $location.path('/listing');
                                                });
                                                
												//Else output error information
                                                response2.error(function (data, status, headers, config) {
                                                        console.log(status);
                                                });
                                       });
                                });
                });
				//Else output error information
                response.error(function (data, status, headers, config) {
                        console.log(status);
                });
        }
		
		//Function to handle skill comparison
        $scope.loadTags = function($query) {
                return $scope.skillTags.filter(function(skill) {
                        return skill.skillName.toLowerCase().indexOf($query.toLowerCase()) != -1;
                });
        };
		
		//Form validation
        $scope.submitForm = function() {
        if ($scope.createListing.$valid) {
		
        }
    };
}]);


/***************************************************************************************************************************
 * 												     Bid Controller                                                        *
 ***************************************************************************************************************************/
classifindApp.controller('bidController', ['$scope', '$http', '$route', '$location', '$rootScope', '$cookieStore', function ($scope, $http, $route, $location, $rootScope, $cookieStore) {
	//Get listing ID from root scope
	$scope.listingID = $rootScope.listingId;
	//On page load
	$scope.$watch('$viewContentLoaded', function () {
		
		//API call to get listing information (Get)
		var endURL = apiIP + "jobs/listingInformation?jobId=" + $scope.listingID;
		var response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Store listing/bid list data in scope variable
			$scope.listingInformation = data.listingInformation;
			$scope.bidList = data.listingInformation.submittedBids;
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});

		//API call to get job requestor
		endURL = apiIP + "jobs/" + $scope.listingID + "/jobRequestor";
		response = $http.get(endURL);
		
		//On success
		response.success(function (data, status, headers, config) {
			//Store requestor full name and profile picture in scope variable
			$scope.requestor = data.userFullName;
			$scope.requestorPicture = data.profilePic;
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	});

	//Function to place bid
	$scope.placeBid = function () {
		var dataObj = {
			bidDate: new Date(),
			bidPrice: $scope.bidPrice,
			providerId: $cookieStore.get('userId'),
			jobId: $rootScope.listingId
		};

		//API call to store bid information
		var endpointURL = apiIP + '/bids';
		var response = $http.post(endpointURL, dataObj);

		//On success
		response.success(function (data, status, headers, config) {
			$location.path('/listing');
		});
		
		//Else output error information
		response.error(function (data, status, headers, config) {
			console.log(status);
		});
	}
}]);

//Custom filter to slice arrays
classifindApp.filter('startFrom', function () {
    return function (input, start) {
		if (!input || !input.length) { return; }
        start = +start; //parse to int
        return input.slice(start);
    }
});