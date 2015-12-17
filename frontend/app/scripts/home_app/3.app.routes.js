(function () {

    'use strict';

    angular.module('tesi.homeApp')
        .config(function ($routeProvider, $locationProvider) {
	    $routeProvider
	      .when('/', {
			resolve: {
				auth: ["$q", "authService", function($q, authService) {
					if (authService.checkAuth()) {
						return $q.when({authenticated: true});
					} 
					else {
						return $q.reject({ authenticated: false });
					}
				}]
			}		    
	      })
	      .when('/preferences', {
		    templateUrl: 'views/preferences.template.html',
		    controller: 'HomeCtrl',
			resolve: {
				auth: ["$q", "authService", function($q, authService) {
					if (authService.checkAuth()) {
						return $q.when({authenticated: true});
					} 
					else {
						return $q.reject({ authenticated: false });
					}
				}]
			}
	      })
	      .when('/security', {
		    templateUrl: 'views/password.template.html',
		    controller: 'HomeCtrl',
			resolve: {
				auth: ["$q", "authService", function($q, authService) {
					if (authService.checkAuth()) {
						return $q.when({authenticated: true});
					} 
					else {
						return $q.reject({ authenticated: false });
					}
				}]
			}
	      })
	      .when('/open', {
		      templateUrl: 'views/openworkflows.template.html',
		      controller: 'OpenWorkflowCtrl',
			resolve: {
				auth: ["$q", "authService", function($q, authService) {
					if (authService.checkAuth()) {
						return $q.when({authenticated: true});
					} 
					else {
						return $q.reject({ authenticated: false });
					}
				}]
			}
	      })
	      .when('/dcn', {
		      templateUrl: 'views/dcn.template.html',
			resolve: {
				auth: ["$q", "authService", function($q, authService) {
					if (authService.checkAuth()) {
						return $q.when({authenticated: true});
					} 
					else {
						return $q.reject({ authenticated: false });
					}
				}]
			}
	      })	 
	      .when('/new', {
		      templateUrl: 'views/newworkflow.template.html',
		      controller: 'NewWorkflowCtrl',
			resolve: {
				auth: ["$q", "authService", function($q, authService) {
					if (authService.checkAuth()) {
						return $q.when({authenticated: true});
					} 
					else {
						return $q.reject({ authenticated: false });
					}
				}]
			}
	      })	           
	      .otherwise({
			redirectTo: '/'
	      });
	      
	      $locationProvider.html5Mode(false);
	})
	.config(['ngClipProvider', function(ngClipProvider) {
		ngClipProvider.setPath("bower_components/zeroclipboard/dist/ZeroClipboard.swf");
	  }]);
	
	angular.module('tesi.homeApp').run(["$route", "$rootScope", "$window", "env_config", function($route, $rootScope, $window) {
		$rootScope.$on("$routeChangeSuccess", function(authenticated) {
		});
	 
		$rootScope.$on("$routeChangeError", function(event, current, previous, eventObj) {
			if (eventObj.authenticated === false) {
				$window.location.href = '/index.html';
			}
		});	
		
	}]);


})();
