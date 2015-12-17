'use strict';

angular.module('tesi.homeApp')
  .controller('HomeCtrl', function ($scope, $window, $timeout, userService, workflowService, alertsManager) {
	$scope.unimiLogo = "images/logo_unimi.jpg";
	$scope.userPic = "images/user.svg";
	$scope.showNewWorkflowModal = true;
	$scope.showCreateWorkflowMsg = false;
	$scope.showPasswordForm = true;
	$scope.showChangePasswordForm = false;
	$scope.alerts = alertsManager.alerts;

    $scope.$on('updateUser', function(event, args) {
		console.log("called updateCUser");
		$scope.user = args.user;
	});

    $scope.$on('showHidePasswordWizard', function(event, args) {
		$scope.showPasswordForm = args.showPasswordForm;
		$scope.showChangePasswordForm = args.showChangePasswordForm;
	});

	// GET USER DATA
    userService.getUser()
          .then(
          function(response){
              $scope.user = response.content.userData;
          },
          function(error){
              console.log("error");
          }
    );

	$scope.update = function() {
		userService.update($scope.user)
			.then(
			function(response){
				if(response.content.updated == 'true') {
					$scope.$root.$broadcast('updateUser', {user:response.content.userData});
					var msg = 'Account updated';
					alertsManager.addAlert(msg, 'alert-success');
				    $timeout(function() {
					  alertsManager.clearAlerts();
				    }, 1500);
			    }
			},
			function(error){
			  // Remove Alerts
			  $timeout(function() {
				  alertsManager.clearAlerts();
				  alertsManager.addAlert(error.content.message, 'alert-danger');
				  alertsManager.clearAlerts();
			  }, 2000);
			}
		);
	};

	$scope.checkPassword = function() {
		userService.checkPassword($scope.user.password)
			.then(
			function(response){
				if(response.content.valid == 'true') {
					console.log(response.content.valid);
					$scope.showPasswordForm = false;
					$scope.showChangePasswordForm = true;
				}
			},
			function(error){
			  // Remove Alerts
			  console.log(error);
			  alertsManager.addAlert('Password not correct', 'alert-danger');
			  // Remove Alerts
			  $timeout(function() {
				  alertsManager.clearAlerts();
				  $scope.$root.$broadcast('updateCustomAlert', {show:false});
			  }, 2000);			  
			}
		);
	};

	$scope.updatePassword = function() {
		userService.updatePassword($scope.user.newPass)
			.then(
			function(response){
				if(response.content.updated == 'true') {
					console.log(response.content.valid);
					$scope.showPasswordForm = true;
					$scope.showChangePasswordForm = false;
					var msg = 'Password changed';
					alertsManager.addAlert(msg, 'alert-success');
				    $timeout(function() {
					  alertsManager.clearAlerts();
				    }, 1500);
				}
			},
			function(error){
			  // Remove Alerts
			  console.log(error);
			  $timeout(function() {
				  alertsManager.clearAlerts();
				  alertsManager.addAlert(error.content.message, 'alert-danger');
				  alertsManager.clearAlerts();
			  }, 2000);
			}
		);
	};

    /*
     * LOGOUT
     */

    $scope.logout = function(){
      $window.localStorage.removeItem("token");
      $window.location.href = "/index.html";
    }

  });
