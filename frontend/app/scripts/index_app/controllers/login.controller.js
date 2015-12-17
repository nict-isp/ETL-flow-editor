'use strict';

/**
 * @ngdoc function
 * @name tesiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the tesiApp
 */
angular.module('tesi.indexApp')
  .controller('LoginCtrl', ['$rootScope', '$scope', '$window','loginService', 'alertsManager',
   function ($rootScope, $scope, $window, loginService, alertsManager) {
	  
	  $scope.showLoading = false;
	  $scope.loadingURL = 'images/loading.GIF';
      $scope.alerts = alertsManager.alerts;
      $scope.closeAlert = function(index) {
          $scope.alerts.splice(index, 1);
      };

      $scope.login = function(){
		  $scope.showLoading = true;
          loginService.login($scope.user).then(
              function(response){
				  $scope.showLoading = false;
                  //TODO SAVE TOKEN
                  $window.localStorage['token'] = response.content.token;                 
                  $window.location.href = 'home.html';                  
              },
              function(error){
				  $scope.showLoading = false;
                  //TODO SHOW ALERT
                  if(error.content.code === 'AUTH101'){
                      alertsManager.clearAlerts();
                      alertsManager.addAlert(error.content.message, 'alert-danger');
                  }
                  else if(error.content.code === 'ERR100'){
                      alertsManager.clearAlerts();
                      alertsManager.addAlert(error.content.message, 'alert-danger');
                  }
              });                              			  			  			              
      };    

  }]);
