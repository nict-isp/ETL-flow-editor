'use strict';

angular.module('tesi.homeApp')
  .controller('OpenWorkflowCtrl', function ($rootScope, $scope, $timeout, $window, workflowService, alertsManager) {

    $scope.loadingURL = 'images/loading.GIF';
    $scope.workflows = [];
	/*
	 * GET USER'S WORKFLOWS
	 */
	function getWorkflows() {		
		// Mostra icona caricamento
		$scope.showLoading = true;
		workflowService.getWorkflows().then(
			  function(response){
				  var obj = response.content.workflowsData;				  
				  //$scope.workflows = response.content.workflowsData;
				  $scope.workflows = response.content.workflowsData.sort(function(a, b) {
						if (a.name < b.name)
							return -1;
						if (a.name > b.name)
							return 1;
						return 0;
				  });					  
                  // Nasconde gif caricamento
                  $scope.showLoading = false;				  
				  $rootScope.$broadcast('updateWorkflows', {workflows:obj});
			  },
			  function(error){
			  console.log(error.content.code);
				  if(error.content.code == "WOR100"){
					  alertsManager.addAlert(error.content.message, 'alert-danger');
				  }
				  else if(error.content.code == "ERR100"){
					  alertsManager.addAlert(error.content.message, 'alert-danger');
				  }
			  });
	  };

	 getWorkflows();


	/*
	 *  Questo metodo renderizza a video l'oggetto Workflow
	 */
	$scope.renderWorkflow = function(obj) {
		//$scope.workflow = obj.name;
		//$scope.setCy();
		$scope.workflow = obj;
		var cy = {};
		cy.style = [];
		cy.elements = {};
		cy.elements.cullspaces = [];
		cy.elements.culltimes = [];
		cy.elements.aggregates = [];
		cy.elements.destinations = [];
		cy.elements.sources = [];
		cy.elements.filters = [];
		cy.elements.edges = [];
		cy.elements.triggerActions = [];
		cy.elements.triggerEvents = [];
		
		var style = [];
		var cullspaces = [];
        var culltimes = [];		
        var aggregates = [];
		var sources = [];
		var destinations = [];		
		var filters = [];				
		var edges = [];		
		var triggerActions = [];		
		var triggerEvents = [];
				
		if(obj.cy.style.hasOwnProperty('styles')){
            style = obj.cy.style.styles;
		}		
		if(obj.cy.elements.hasOwnProperty('cullspaces')){
			cullspaces = obj.cy.elements.cullspaces;
		}		
		if(obj.cy.elements.hasOwnProperty('culltimes')){
		     culltimes = obj.cy.elements.culltimes;
	    }		
		if(obj.cy.elements.hasOwnProperty('aggregates')){
		     aggregates = obj.cy.elements.aggregates;
	    }	    
		if(obj.cy.elements.hasOwnProperty('destinations')){
			destinations = obj.cy.elements.destinations;
		}
		if(obj.cy.elements.hasOwnProperty('sources')){
            sources = obj.cy.elements.sources;
		}
		if(obj.cy.elements.hasOwnProperty('filters')){
		    filters = obj.cy.elements.filters;	
		}
        if(obj.cy.elements.hasOwnProperty('edges')){		
			edges = obj.cy.elements.edges;
		}
        if(obj.cy.elements.hasOwnProperty('triggerActions')){		
			triggerActions = obj.cy.elements.triggerActions;
		}
		if(obj.cy.elements.hasOwnProperty('triggerEvents')){
		    triggerEvents = obj.cy.elements.triggerEvents;	
		}		
		
		for(var x=0; x<style.length; x++) {
		   cy.style.push(style[x]);
		}
		for(var y=0;y<sources.length;y++) {
		  cy.elements.sources.push(sources[y]);
		}
		for(var y=0;y<edges.length;y++) {
		  cy.elements.edges.push(edges[y]);
		}
		for(var y=0;y<cullspaces.length;y++) {
		  cy.elements.cullspaces.push(cullspaces[y]);
		}
		for(var y=0;y<aggregates.length;y++) {
		  cy.elements.aggregates.push(aggregates[y]);
		}		
		for(var y=0;y<culltimes.length;y++) {
		  cy.elements.culltimes.push(culltimes[y]);
		}
		for(var y=0;y<destinations.length;y++) {
		  cy.elements.destinations.push(destinations[y]);
		}
		for(var y=0;y<filters.length;y++) {
		  cy.elements.filters.push(filters[y]);
		}	
		for(var y=0;y<triggerActions.length;y++) {
		  cy.elements.triggerActions.push(triggerActions[y]);
		}
		for(var y=0;y<triggerEvents.length;y++) {
		  cy.elements.triggerEvents.push(triggerEvents[y]);
		}						
		$rootScope.$broadcast('setWorkflow', {workflow:obj});
		$rootScope.$broadcast('renderCy', {cy:cy});
	};


    /*
     *  Carica un workflow
     */
    $scope.loadWorkflow = function(id) {
    workflowService.getWorkflow(id).then(
		  function(response){
			  // Alert
			  alertsManager.addAlert(response.content.workflowData.name + " loaded", 'alert-success');
			  $rootScope.$broadcast('updateCustomAlert', {show:true});
			  // Enable buttons
			  $rootScope.$broadcast('enableButtons');
			  // Render OBJ
			  //$scope.renderWorkflow(response.content.workflowData);
			  $rootScope.$broadcast('renderCy', {workflow:response.content.workflowData, cy:response.content.workflowData.workflow});
			  // Remove Alerts
			  $timeout(function() {
				  alertsManager.clearAlerts();
				  $rootScope.$broadcast('updateCustomAlert', {show:false});
				  //$scope.$root.$broadcast('setCustomAlert', {alerts:alertsManager.alerts});
			  }, 1000);
		  },
		  function(error){
			  if(error.content.code == "WOR100"){
				  alertsManager.addAlert(error.content.message, 'alert-danger');
			  }
			  else if(error.content.code == "ERR100"){
				  alertsManager.addAlert(error.content.message, 'alert-danger');
			  }
		  });
	};

  //$scope.getWorkflows();

});
