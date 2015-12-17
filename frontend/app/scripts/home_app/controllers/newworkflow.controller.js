'use strict';

angular.module('tesi.homeApp')
  .controller('NewWorkflowCtrl', function ($rootScope, $scope, $timeout, $location, workflowService) {

/*********************************************************
***             CREATE NEW WORKFLOW                    ***
*********************************************************/

$scope.createWorkflow = function() {
	if (!$scope.createWorkflow.$valid) {
		// Call API
		// Create new workflow
		workflowService.createWorkflow($scope.name).then(
		  function(response){						
			$rootScope.$broadcast('workflowCreated', {workflow:response.content.workflowData});
			$location.path('/');
        },
        function(error){

		});
	}
};

});

