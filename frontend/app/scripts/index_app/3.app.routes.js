(function () {

    'use strict';

    angular
        .module('tesi.indexApp')
        .config(function ($routeProvider) {
	    $routeProvider
	      .when('/', {
		templateUrl: 'views/login.template.html',
		controller: 'LoginCtrl'
	      })
	      .when('/about', {
		templateUrl: 'views/about.html',
		controller: 'AboutCtrl'
	      })  
	      .when('/signup', {
		templateUrl: 'views/signup.template.html',
		controller: 'SignupCtrl'
	      })
	    .when('/password-recovery', {
		templateUrl: 'views/recovery.template.html',
		controller: 'PasswordRecoveryCtrl'
	      })
	    .when('/recovery/:emailAddress/:userID/:token', {
		  templateUrl: 'views/setPasswordRecovery.template.html',
		  controller: 'CheckRecoveryCtrl'
	    })	      	       
	      .otherwise({
		redirectTo: '/'
	      });
});

})();
