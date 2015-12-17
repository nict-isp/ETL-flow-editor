'use strict';

angular.module('tesi.homeApp')
  .controller('WorkflowCtrl', function ($document, $scope, $timeout, $window, $sce, $websocket, $compile, ModalService, workflowService, dcnService, alertsManager, FileUploader, env_config) {

	$scope.alerts = alertsManager.alerts;
	
	$scope.workflows = [];	
	$scope.sizes = [ {code: 1, name: 'n1'}, {code: 2, name: 'n2'}];	

  // Get Source Categories
  workflowService.getCategories().then(
      function(response){
        $scope.sourceCategories = angular.copy(response.content.categoriesData);
      },
      function(error){
        if(error.content.code == "WOR102"){
          alertsManager.addAlert(error.content.message, 'alert-danger');
        }
        else if(error.content.code == "ERR100"){
          alertsManager.addAlert(error.content.message, 'alert-danger');
        }
      });
      
  // Get Schemas
  workflowService.getSchemas().then(
      function(response){
        $scope.schemas = JSON.parse(JSON.stringify(eval("(" + response.content.schemas + ")")));		
      },
      function(error){
		  console.log(error);
      }); 
      
  // Get Tranform Functions
  workflowService.getTransformFunctions().then(
      function(response){
        $scope.transform_functions = JSON.parse(JSON.stringify(eval("(" + response.content.functions + ")")));	        	
      },
      function(error){
		  console.log(error);
      }); 
      
  // Get Tranform Functions
  workflowService.getVirtualFunctions().then(
      function(response){
        $scope.virtual_functions = JSON.parse(JSON.stringify(eval("(" + response.content.functions + ")")));	        	
      },
      function(error){
		  console.log(error);
      }); 
      
  // Avvio server WebSocket
  /*workflowService.openWebSocket().then(
      function(response){
        console.log(response);	        	
      },
      function(error){
		  console.log(error);
      });*/                        

  function getCyScope() {
	  return cytoscape({
		  // very commonly used options:
		  container: document.getElementById('cy'),
		  elements: [ /* ... */ ],
		  style: [ /* ... */ ],
		  layout: { name: 'grid' /* , ... */ },
		  ready: function(evt){ /* ... */ },

		  // initial viewport state:
		  zoom: 1,
		  pan: { x: 0, y: 0 },
		  // interaction options:
		  minZoom: 1e-50,
		  maxZoom: 1e50,
		  zoomingEnabled: true,
		  userZoomingEnabled: true,
		  panningEnabled: true,
		  userPanningEnabled: true,
		  boxSelectionEnabled: false,
		  //selectionType: (isTouchDevice ? 'additive' : 'single'),
		  //touchTapThreshold: 8,
		  desktopTapThreshold: 4,
		  autolock: false,
		  autoungrabify: false,
		  autounselectify: false,
		  // rendering options:
		  headless: false,
		  styleEnabled: true,
		  hideEdgesOnViewport: false,
		  hideLabelsOnViewport: false,
		  textureOnViewport: false,
		  motionBlur: false,
		  motionBlurOpacity: 0.2,
		  wheelSensitivity: 1,
		  pixelRatio: 1,
		  initrender: function(evt){ /* ... */ },
		  renderer: { /* ... */ }
		});
  }

	function setCyStyle() {
		cy.style()
		.resetToDefault()
		.selector('node')
		  .css({
			'shape': 'data(faveShape)',
			'width': '60',
			'height' : '60',
			'content': 'data(name)',
			'text-valign': 'center',
			'text-outline-width': 2,
			'text-outline-color': 'data(faveColor)',
			'background-color': 'data(faveColor)',
			'color': '#fff',
			'pie-size': '80%',
			'pie-1-background-color': '#E8747C',
			'pie-1-background-size': 'mapData(foo, 0, 10, 0, 100)',
			'pie-2-background-color': '#74CBE8',
			'pie-2-background-size': 'mapData(bar, 0, 10, 0, 100)',
			'pie-3-background-color': '#74E883',
			'pie-3-background-size': 'mapData(baz, 0, 10, 0, 100)'
		  })
		.selector(':selected')
		  .css({
			'border-width': 3,
			'border-color': '#4cae4c'
		  })
		.selector('edge')
		  .css({
			'opacity': 0.666,
			'width': 'mapData(strength, 70, 100, 2, 6)',
			'target-arrow-shape': 'triangle',
			'source-arrow-shape': 'circle',
			'line-color': 'data(faveColor)',
			'source-arrow-color': 'data(faveColor)',
			'target-arrow-color': 'data(faveColor)'
		  })
		.selector('edge.questionable')
		  .css({
			'line-style': 'dotted',
			'target-arrow-shape': 'diamond'
		  })
		.selector('.faded')
		  .css({
			'opacity': 0.25,
			'text-opacity': 0
		  })
		.update();
	}
		
/*********************************************************
***                   INIT                             ***
*********************************************************/
$scope.loadingURL = 'images/loading.GIF';
window.cy = {};
window.cyRefresh = {};
window.nodes = [];
window.last2nodesClicked = [];
$scope.node = {}; 
$scope.edge = {};
var node = {};
$scope.workflow = {};
$scope.selectedSourceCategories = [];
$scope.selectedDestinationCategories = [];
$scope.selectedSourceTypes = [];
$scope.selectedDestinationTypes = [];


$scope.schemaPropertiesSelected = []; // [[]],[[]]
// Variabile che mostra la traduzione del DCN
$scope.dcn = '';
// Mostra/Nasconde form per aggiunta condition nei filtri
$scope.showFilterForm = false;
// Mostra/Nasconde form per aggiunta condition nei trigger
$scope.showTriggerEventOnForm = false;
$scope.showTriggerEventOffForm = false;

$scope.source = {};
$scope.target = {};
// '<', '=', '>', '<=', '>='
$scope.operators = [
    {
      'symbol': '<',
      'name'  : 'minus'
    },
    { 
      'symbol' : '=',
      'name'   : 'equal'
    },
    {
      'symbol' : '>',
      'name'   : 'greater'
    }, 
    {
      'symbol' : '>=',
      'name'   : 'greater_equal'
    }, 
    {
      'symbol' : '<=',
      'name'   : 'minus_equal'
    },
    {
      'symbol' : '!=',
      'name'   : 'not_equal'
    },
    {
      'symbol' : 'LIKE',
      'name'   : 'like'
    },
    {
      'symbol' : 'NOT LIKE',
      'name'   : 'not_like'
    },
    {
      'symbol' : 'RANGE',
      'name'   : 'range'
    },
    {
      'symbol' : 'NOT RANGE',
      'name'   : 'not_range'
    }   
];

$scope.count_operators = [
    {
      'symbol': '<',
      'name'  : 'minus'
    },
    { 
      'symbol' : '=',
      'name'   : 'equal'
    },
    {
      'symbol' : '>',
      'name'   : 'greater'
    }, 
    {
      'symbol' : '>=',
      'name'   : 'greater_equal'
    }, 
    {
      'symbol' : '<=',
      'name'   : 'minus_equal'
    },
    {
      'symbol' : '!=',
      'name'   : 'not_equal'
    }    
];

$scope.csv_delimiters = [
    {
      'symbol' : ',',
      'name'   : 'Comma'
    },
    {
      'symbol' : ';',
      'name'   : 'Semi Colon'
    }
];
$scope.sourceConditions = new Array([]);
$scope.sourceCondition = {};
$scope.filterConditions = new Array([]);
$scope.filterConditionsLogicOperator = []; // Mostrato graficamente come AND o OR tra le condizioni
$scope.filter = {};
$scope.triggerEventOnConditions = [];
$scope.triggerEventOffConditions = [];
$scope.triggerOnSettings = []; // si riferisce a triggerEventOn
$scope.triggerOffSettings = []; // si riferisce a triggerEventOff
$scope.triggerEvent = {};
$scope.triggerActionOnEvents = []; // triggerActionOn
$scope.triggerActionOffEvents = []; // triggerActionOff
$scope.triggerONConditionsLogicOperator = []; // Mostrato graficamente come AND o OR tra le condizioni
$scope.triggerOFFConditionsLogicOperator = []; // Mostrato graficamente come AND o OR tra le condizioni
$scope.sourceTypes = [
	//{id:1, name:'Application'},
	//{id:2, name:'Sensor'}
	{id:1, 'name':'rain'},
	{id:2, 'name':'rainfall'},
	{id:3, 'name':'twitter'},
	{id:4, 'name':'traffic'}
	//{id:4, 'name':'DataStore'}
];	
$scope.destinationSourceTypes = [
    {id:1, 'name':'DataStore'}
];
$scope.destinationSourceCategories = [
    {id:1, 'name':'application'}
];
$scope.timeUnit = [
	{id:1, 'name':'day'},
	{id:2, 'name':'hour'},
	{id:3, 'name':'minute'},
	{id:4, 'name':'second'}
]
$scope.culltimeSettings = []; 
$scope.cullspaceSettings = [];
$scope.aggregateSettings = [];
// Operatore Transform
$scope.transformFunctionsSettings = [];
$scope.virtualFunctionsSettings = [];
$scope.virtualSelections = [];
$scope.virtualNameAS = [];
$scope.propertyNamesAS = [];
$scope.addToDate = [];

$scope.showCustomAlert = false;
$scope.canCreateEdge = false;
$scope.showTab = false;
$scope.showEdgeTab = false;
$scope.disableButtons = false;
$scope.showDetails = true;
$scope.showANDbutton = [];
$scope.showORbutton = [];
$scope.showTEONANDbutton = []; // per trigger event
$scope.showTEONORbutton = []; // per trigger event
$scope.showTEOFFANDbutton = []; // per trigger event
$scope.showTEOFFORbutton = []; // per trigger event
$scope.selectedSchemaProperties = [];
$scope.errors = [];
$scope.dcnEnabled = true;
window.drawlines = [];
$scope.joinlines = [];
$scope.joinSchemaProperties = [];
$scope.allJoinProperties = [];
$scope.connections = new Array([]); // oggetti $.connect
$scope.csv_delimiter = [];

window.nodeCount = {
	source : 0, 
	filter:0, 
	culltime:0, 
	cullspace:0,
	aggregate:0, 
	destination:0,
	trigger:0,
	triggerOn:0,
	triggerOff:0,
	child:0,
	join:0,
	sax:0,
	csvjoin:0,
	transf:0
	};
window.nodeCoords = {
	source: {x:0, y:0}, // Initial coords
	filter: {x:100, y:100},
	culltime: {x:100, y:100},
	cullspace: {x:100, y:100},
	aggregate: {x:100, y:100},
	destination: {x:100, y:100},
	trigger: {x:100, y:100},
	child: {x:100, y:100},
	join: {x:100, y:100},
	sax: {x:100, y:100},
	csvjoin: {x:100, y:100},
	transf: {x:100, y:100}
}
window.panzoom = ({
	zoomFactor: 0.05, // zoom factor per zoom tick
	zoomDelay: 45, // how many ms between zoom ticks
	minZoom: 0.1, // min zoom level
	maxZoom: 10, // max zoom level
	fitPadding: 50, // padding when fitting
	panSpeed: 10, // how many ms in between pan ticks
	panDistance: 10, // max pan distance per tick
	panDragAreaSize: 75, // the length of the pan drag box in which the vector for panning is calculated (bigger = finer control of pan speed and direction)
	panMinPercentSpeed: 0.25, // the slowest speed we can pan by (as a percent of panSpeed)
	panInactiveArea: 8, // radius of inactive area in pan drag box
	panIndicatorMinOpacity: 0.5, // min opacity of pan indicator (the draggable nib); scales from this to 1.0
	autodisableForMobile: true, // disable the panzoom completely for mobile (since we don't really need it with gestures like pinch to zoom)
	
	// icon class names
	sliderHandleIcon: 'fa fa-minus',
	zoomInIcon: 'fa fa-plus',
	zoomOutIcon: 'fa fa-minus',
	resetIcon: 'fa fa-expand'
});

$scope.Utils = {
 keys : Object.keys
};

function keydownHandler(e) {
  var evt = e ? e:event;
  var keyCode = evt.keyCode;
  var sModifiers = ''
      +(evt.ctrlKey  ? 'Ctrl ' :'')
      +(evt.shiftKey ? 'Shift ':'')
      +(evt.altKey   ? 'Alt '  :'') ;

  if(keyCode == 46){
	  var element = window.cy.$(':selected');
	  // Se ho un focus su un elemento, non devo eliminare,
	  // potri voler premere canc per eliminare un valore da un campo
	  if($("input").is(":focus")){ return; }
	  
	  if(element.group() == 'nodes'){	
		  // se passo element non riesce a eliminarlo.	  
		  $scope.deleteNode($scope.node);
		  $scope.showTab = false;
		  $scope.$apply();
	  }
	  else if(element.group() == 'edges'){
		  $scope.deleteEdge(element); 
		  $scope.showEdgeTab = false;
		  $scope.$apply();
	  }
  }
  return true;
}

function startMouseEvent(){  
  //Register the keydown event handler:
  document.onkeydown=keydownHandler;
  
  var tappedBefore = null;
  window.cy.on('mousedown', function(evt) {	  	  	  
	var obj = evt.cyTarget;	
	setTimeout(function(){ tappedBefore = null; }, 300);
	try {
		if(obj === window.cy) {
			$scope.$root.$broadcast('showTab', {show:false});
			$scope.showEdgeTab = false;
			$scope.$apply();	
			$scope.state_tab = "canvas";
			console.log($scope.state_tab);
		}
		else if(obj.group() == 'edges') {
			var pedge = obj.data();
			var edge = window.cy.$("#"+pedge.id);
			if(tappedBefore === obj){
			    $scope.showTab = false;
			    $scope.showEdgeTab = true;				
				tappedBefore = null;
				$scope.source = edge.source();
				$scope.target = edge.target();
			}
			else {
				tappedBefore = obj;
			}			
			// Setto il nodo cliccato, da cui ricavo i dettagli
			$scope.$root.$broadcast('setClickedEdge', {edge:edge});
			$scope.$apply();			
		}
		else if(obj.group() == 'nodes') {
            obj.trigger('doubleTap');		
			var node = getItemData(obj.id());
			window.cy.$("node[id='"+node.data.id+"']").style('border-color', '#4cae4c');
            $scope.nodoid = node;
            $scope.state_tab = node.data.object;
            console.log($scope.state_tab);
			
			if(node != false) {			
				if(tappedBefore === obj){
					$scope.$root.$broadcast('showTab', {show:true});
					tappedBefore = null;
				}
				else {
					tappedBefore = obj;
				}				
				// Mostro il Tab con i dettagli sul nodo
				$scope.showEdgeTab = false;				
				// Setto il nodo cliccato, da cui ricavo i dettagli
				setClickedNode(node);
				if(node.data.object == 'join') {
					// Nascondo le linee degli altri operatori e mostro
					// solo quelle appartenenti all'operatore selezionato
                    var htmlCLASS = '.join-table'+$scope.node.data.pos;
                    $('.connector').not(htmlCLASS).hide();
                    $(htmlCLASS).show();
                    // 
				    $scope.getConnectedNodes(node);
				    $scope.getConnectedNodesSchema(node);
				    //
				    //$scope.setJoinProperties(node.data.join_schema);
				    drawLines();
			    }
                try {
				    $scope.$apply();				
				} catch(err){}				
			}			
		}
		else {
		   alert("error");
		}
	}
	catch(err) {
		console.log(err);
	}
 });		
}

function init(workflow_name) {
  // Quando accede, creo un workflow di default
  $scope.workflow.name = workflow_name != false ? workflow_name : "unknown";
  $scope.workflow.isDefault = workflow_name != false ? false : true;  
  // Set Cy Scope
  window.cy = getCyScope();
  //window.cyRefresh = window.cy;
  setCyStyle();
  
  $('#cy').cytoscapePanzoom(panzoom); 
  
  startMouseEvent();
}

function initRendered(workflow_name) {
  // Quando accede, creo un workflow di default
  $scope.workflow.name = workflow_name != false ? workflow_name : "unknown";
  $scope.workflow.isDefault = workflow_name != false ? false : true;  
  // Set Cy Scope
  //window.cy = getCyScope();
  //window.cyRefresh = window.cy;
  setCyStyle();    
 startMouseEvent();
}

init(false);

/*********************************************************
***             CREATE NEW WORKFLOW                    ***
*********************************************************/
function cleanVars() {
	//console.log("clean vars");
	window.nodes = [];
    $scope.node = {};    
	window.nodeCount = {
		source : 0, 
		filter:0, 
		culltime:0, 
		cullspace:0,
		aggregate:0, 
		destination:0,
		trigger:0,
	    triggerOn:0,
	    triggerOff:0,		
		child:0,
		join:0,
		sax:0,
		csvjoin:0,
		transf:0
		};
	window.nodeCoords = {
		source: {x:100, y:100}, // Initial coords
		filter: {x:100, y:100},
		culltime: {x:100, y:100},
		cullspace: {x:100, y:100},
		aggregate: {x:100, y:100},
		destination: {x:100, y:100},
		trigger: {x:100, y:100},
		child: {x:100, y:100},
		join: {x:100, y:100},
		sax: {x:100, y:100},
		csvjoin: {x:100, y:100},
		transf: {x:100, y:100}
	} 
	$scope.selectedSourceCategories = [];
	$scope.selectedDestinationCategories = [];
	$scope.selectedAggregateAttribute = [];
	$scope.selectedSourceTypes = [];
	$scope.selectedDestinationTypes = [];
	$scope.sourceConditions = new Array([]);
	$scope.sourceCondition = {};
	$scope.filterConditions = new Array([]);
	$scope.triggerEventOnConditions = [];
	$scope.triggerEventOffConditions = [];
	$scope.triggerOnSettings = []; // si riferisce a triggerEventOn
	$scope.triggerOffSettings = []; // si riferisce a triggerEventOff
	$scope.triggerActionOnEvents = []; // triggerActionOn
	$scope.triggerActionOffEvents = []; // triggerActionOff	
	$scope.culltimeSettings = []; 
	$scope.cullspaceSettings = [];
	$scope.aggregateSettings = [];
	$scope.transformFunctionsSettings = [];
	$scope.virtualFunctionsSettings = [];
    $scope.virtualSelections = [];
    $scope.virtualNameAS = [];
	$scope.propertyNamesAS = [];
	window.last2nodesClicked = [];
	$scope.showANDbutton = [];
	$scope.showORbutton = [];
    $scope.showTEONANDbutton = []; // per trigger event
    $scope.showTEONORbutton = []; // per trigger event
    $scope.showTEOFFANDbutton = []; // per trigger event
    $scope.showTEOFFORbutton = []; // per trigger event
	$scope.filterConditionsLogicOperator = [];
	$scope.triggerONConditionsLogicOperator = [];
	$scope.triggerOFFConditionsLogicOperator = [];
	$scope.schemaPropertiesSelected = [];
    window.drawlines = [];
    $scope.joinlines = [];    
    $scope.joinSchemaProperties = [];	
    $scope.allJoinProperties = [];
    $scope.addToDate = [];
}

$scope.$on('workflowCreated', function(event, args) {
	// Se in precedenza stavo lavorando su un workflow
	// nascondo il tab dei dettagli
	$scope.$root.$broadcast('showTab', {show:false});
	// Se ho salvato il documento di default, nascondo il DIV
	$scope.showSaveDefaultWorkflow = false;
    $scope.workflow = args.workflow;
    // Ripulisco variabili settate nel vecchio workflow
    cleanVars();
    // Creo nuovo CY
    init($scope.workflow.name);  
    // Mostro alert di avvenuta creazione
    alertsManager.addAlert($scope.workflow.name + " created", 'alert-success');   
    $scope.showCustomAlert = true;     
    // Abilito pulsanti
    $scope.disableButtons = false;
    // Mostro i dettagli del progetto sulla sidebar sinistra
    $scope.showDetails = true;
    // Nascondo alert dopo 1,5 secondi
	$timeout(function() {
	  alertsManager.clearAlerts();
	  $scope.showCustomAlert = true;
	}, 1500);    
});

$scope.$on('workflowSaved', function(event, args) {
	// Se in precedenza stavo lavorando su un workflow
	// nascondo il tab dei dettagli
	$scope.$root.$broadcast('showTab', {show:false});
	// Se ho salvato il documento di default, nascondo il DIV
	$scope.showSaveDefaultWorkflow = false;
    $scope.workflow = args.workflow; 
    alertsManager.clearAlerts(); 
    // Mostro alert di avvenuta creazione
    alertsManager.addAlert($scope.workflow.name + " saved", 'alert-success');   
    $scope.showCustomAlert = true;     
    // Abilito pulsanti
    $scope.disableButtons = false;
    // Mostro i dettagli del progetto sulla sidebar sinistra
    $scope.showDetails = true;
    // Nascondo alert dopo 1,5 secondi
	$timeout(function() {
	  alertsManager.clearAlerts();
	  $scope.showCustomAlert = true;
	}, 1500);    
});

function generateCoordinates() {	
   var min_x;
   var min_y;
   for(var x=0; x<window.nodes.length; x++) {
       if(x==0) {
		    min_x = window.nodes[x].position.x;   
		    min_y = window.nodes[x].position.y;   
	   }  
	   else {
		   if(window.nodes[x].position.x < min_x) {
		       min_x = window.nodes[x].position.x;  
		   }		   		     
		   if(window.nodes[x].position.y < min_y) {
		       min_x = window.nodes[x].position.y;  
		   }		   		     
	   }
   }
   
   min_x >= 0 ? min_x -= 100 : min_x += 100;
   min_y >= 0 ? min_y -= 100 : min_y += 100;
   
   var position = {x: min_x, y: min_y};
   return position;
}

/*********************************************************
***                  CREATE NODES                      ***
*********************************************************/
function getSourceObj()  {
		var source = {
		  group: 'nodes', // 'nodes' for a node, 'edges' for an edge

		  // NB: id fields must be strings
		  data: { // element data (put dev data here)
			  id: 's' + (window.nodeCount.source+1).toString(), // mandatory for each element, assigned automatically on undefined
			name : 'Source',
			faveColor : '#449d44',
			faveShape : 'ellipse',
			//type : 'Rainfall',
			//category : $scope.sourceCategories[0].name,
			object:'source',
			table: '',
			conditions : [
				{
                     "attribute":"category",
                     "operator":"=",
                     "value": $scope.sourceCategories[0].name
                },
				{
				 "attribute":"type",
				 "operator":"=",
				 "value":"rainfall"
				}                
			],
			foo: 1, bar: 1, baz: 8
		  },
		  // scratchpad data (usually temp or nonserialisable data)
		  scratch: {
			foo: 'bar'
		  },
		  renderedPosition: { // the model position of the node (optional on init, mandatory after)
			  x: window.nodeCoords.source.x,
			  y: window.nodeCoords.source.y
		  },
		  selected: false, // whether the element is selected (default false)
		  selectable: true, // whether the selection state is mutable (default true)
		  locked: false, // when locked a node's position is immutable (default false)
		  grabbable: true, // whether the node can be grabbed and moved by the user
		  classes: 'foo bar' // a space separated list of class names that the element has
		  // NB: you should only use `style`/`css` for very special cases; use classes instead
		  //style: { 'background-color': 'red' } // overriden style properties
		}
		// Incremento i count
		window.nodeCount.source += 1; // Serve ad assegnare l'id del nodo
		return source;
}

function getFilterObj() {
		var filter = { // node n1
		  group: 'nodes', // 'nodes' for a node, 'edges' for an edge
		  // NB: id fields must be strings
		  data: { // element data (put dev data here)
			id: 'f' + (window.nodeCount.filter+1).toString(), // mandatory for each element, assigned automatically on undefined
			name : 'Filter',
			faveColor : '#BDBDBD',
			faveShape : 'triangle', //'triangle',
			object : 'filter',
			conditions : []
			//foo: 3, bar: 5, baz: 2
		  },
		  // scratchpad data (usually temp or nonserialisable data)
		  scratch: {
			foo: 'bar'
		  },
		  position: { // the model position of the node (optional on init, mandatory after)
			x: window.nodeCoords.filter.x,
			y: window.nodeCoords.filter.y
		  },
		  selected: false, // whether the element is selected (default false)
		  selectable: true, // whether the selection state is mutable (default true)
		  locked: false, // when locked a node's position is immutable (default false)
		  grabbable: true, // whether the node can be grabbed and moved by the user
		  classes: 'foo bar', // a space separated list of class names that the element has
		}
		// Incremento i count
		window.nodeCount.filter += 1;
		return filter;
}

function getCulltimeObj() {
		var obj = {
		  group: 'nodes', // 'nodes' for a node, 'edges' for an edge

		  // NB: id fields must be strings
		  data: { // element data (put dev data here)
			id: 'ct' + (window.nodeCount.culltime+1).toString(), // mandatory for each element, assigned automatically on undefined
			name : 'cull_time',
			faveColor : '#BDBDBD',
			faveShape : 'roundrectangle',
			object : 'cull_time',
			settings : {}
		  },
		  // scratchpad data (usually temp or nonserialisable data)
		  scratch: {
			foo: 'bar'
		  },
		  position: { // the model position of the node (optional on init, mandatory after)
			x: window.nodeCoords.culltime.x,
			y: window.nodeCoords.culltime.y
		  },
		  selected: false, // whether the element is selected (default false)
		  selectable: true, // whether the selection state is mutable (default true)
		  locked: false, // when locked a node's position is immutable (default false)
		  grabbable: true, // whether the node can be grabbed and moved by the user
		  classes: 'foo bar' // a space separated list of class names that the element has
		  // NB: you should only use `style`/`css` for very special cases; use classes instead
		  //style: { 'background-color': 'red' } // overriden style properties
		}
		// Incremento i count
		window.nodeCount.culltime += 1;
		return obj;
}
	
function getCullSpaceObj() {
		var obj = {
		  group: 'nodes', 
		  // NB: id fields must be strings
		  data: { // element data (put dev data here)
			id: 'cs' + (window.nodeCount.cullspace+1).toString(), // mandatory for each element, assigned automatically on undefined
			name : 'cull_space',
			faveColor : '#BDBDBD',
			faveShape : 'rectangle',
			object : 'cull_space'
		  },			  			 
		  // scratchpad data (usually temp or nonserialisable data)
		  scratch: {
			foo: 'bar'
		  },
		  position: { // the model position of the node (optional on init, mandatory after)
			x: window.nodeCoords.cullspace.x,
			y: window.nodeCoords.cullspace.y
		  },
		  selected: false, // whether the element is selected (default false)
		  selectable: true, // whether the selection state is mutable (default true)
		  locked: false, // when locked a node's position is immutable (default false)
		  grabbable: true, // whether the node can be grabbed and moved by the user
		  classes: 'foo bar' // a space separated list of class names that the element has
		}
		// Incremento i count
		window.nodeCount.cullspace += 1;
		return obj;
}	

function getAggregateObj() {
		var obj = {
		  group: 'nodes', // 'nodes' for a node, 'edges' for an edge

		  // NB: id fields must be strings
		  data: { // element data (put dev data here)
			id: 'ag' + (window.nodeCount.aggregate+1).toString(), // mandatory for each element, assigned automatically on undefined
			name : 'aggregate',
			faveColor : '#BDBDBD',
			faveShape : 'hexagon',
			object : 'aggregate',
			schemas : []
		  },			  			 
		  // scratchpad data (usually temp or nonserialisable data)
		  scratch: {
			foo: 'bar'
		  },
		  position: { // the model position of the node (optional on init, mandatory after)
			x: window.nodeCoords.aggregate.x,
			y: window.nodeCoords.aggregate.y
		  },
		  selected: false, // whether the element is selected (default false)
		  selectable: true, // whether the selection state is mutable (default true)
		  locked: false, // when locked a node's position is immutable (default false)
		  grabbable: true, // whether the node can be grabbed and moved by the user
		  classes: 'foo bar' // a space separated list of class names that the element has
		}
		// Incremento i count
		window.nodeCount.aggregate += 1;
		return obj;
}
	
function getDestinationObj() {
		var obj = {
		  group: 'nodes', // 'nodes' for a node, 'edges' for an edge

		  // NB: id fields must be strings
		  data: { // element data (put dev data here)
			id: 'd' + (window.nodeCount.destination+1).toString(), // mandatory for each element, assigned automatically on undefined
			name : 'Destination',
			faveColor : '#f0ad4e',
			faveShape : 'ellipse',
			object : 'destination',
			schemas : [],
			conditions : [
				{
					 "attribute":"category",
					 "operator":"=",
					 "value": "application"
				},
				{
				 "attribute":"type",
				 "operator":"=",
				 "value":"Datastore"
				}                
			],
			foo: 3, bar: 5, baz: 2
		  },			  			 
		  // scratchpad data (usually temp or nonserialisable data)
		  scratch: {
			foo: 'bar'
		  },
		  position: { // the model position of the node (optional on init, mandatory after)
			x: window.nodeCoords.destination.x,
			y: window.nodeCoords.destination.y
		  },
		  selected: false, // whether the element is selected (default false)
		  selectable: true, // whether the selection state is mutable (default true)
		  locked: false, // when locked a node's position is immutable (default false)
		  grabbable: true, // whether the node can be grabbed and moved by the user
		  classes: 'foo bar' // a space separated list of class names that the element has
		}
		// Incremento i count
		window.nodeCount.destination += 1;
		return obj;
}		
	
function getTriggerEventObj() {
	// Creo oggetto composto da Trigger + Nodo di uscita		
	// Creo oggetto Trigger					
	var trigger = {
	  group: 'nodes', // 'nodes' for a node, 'edges' for an edge

	  // NB: id fields must be strings
	  data: { // element data (put dev data here)
		id: 'te' + (window.nodeCount.trigger+1).toString(),
		name : 'TriggerEvent',
		faveColor : '#BDBDBD',
		faveShape : 'diamond',
		object : 'triggerEvent',
		triggerOn : {},
		triggerOff : {}
	  },
	  // scratchpad data (usually temp or nonserialisable data)
	  scratch: {
		foo: 'bar'
	  },
	  position: { // the model position of the node (optional on init, mandatory after)
		x: window.nodeCoords.trigger.x,
		y: window.nodeCoords.trigger.y
	  },
	  selected: false, // whether the element is selected (default false)
	  selectable: true, // whether the selection state is mutable (default true)
	  locked: false, // when locked a node's position is immutable (default false)
	  grabbable: true, // whether the node can be grabbed and moved by the user
	  classes: 'foo bar' // a space separated list of class names that the element has
	}
	// Incremento i count
	window.nodeCount.trigger += 1;					
	return trigger;
}

function getTriggerOnOff(type) {
	// Creo oggetto composto da Trigger + Nodo di uscita		
	// Creo oggetto Trigger					
	var trigger = {
	  group: 'nodes', // 'nodes' for a node, 'edges' for an edge

	  // NB: id fields must be strings
	  data: { // element data (put dev data here)
		id: type==='on' ? 'ton' + (window.nodeCount.triggerOn+1).toString() :'toff' + (window.nodeCount.triggerOff+1).toString() ,
		name : type==='on' ? 'ActionON' : 'ActionOFF',
		faveColor : '#BDBDBD', //type==='on' ? '#0BA310' : '#DA1710',
		faveShape : 'rhomboid',
		object : 'triggerAction',
		schemas : [],
		event : '',
		event_state : type
	  },
	  scratch: {
		foo: 'bar'
	  },
	  position: { // the model position of the node (optional on init, mandatory after)
		x: window.nodeCoords.trigger.x,
		y: window.nodeCoords.trigger.y
	  },
	  selected: false, // whether the element is selected (default false)
	  selectable: true, // whether the selection state is mutable (default true)
	  locked: false, // when locked a node's position is immutable (default false)
	  grabbable: true, // whether the node can be grabbed and moved by the user
	  classes: 'foo bar' // a space separated list of class names that the element has
	}
	// Incremento i count
	type==='on' ? window.nodeCount.triggerOn += 1 : window.nodeCount.triggerOff += 1;				
	return trigger;
}	

function getSaxObj() {
		var sax = { // node n1
		  group: 'nodes', // 'nodes' for a node, 'edges' for an edge
		  // NB: id fields must be strings
		  data: { // element data (put dev data here)
			id: 'sax' + (window.nodeCount.sax+1).toString(), // mandatory for each element, assigned automatically on undefined
			name : 'Sax',
		    faveColor : '#BDBDBD',
		    faveShape : 'vee',
			object : 'sax',
			alphabet: 1,
			window: 1			
		  },
		  // scratchpad data (usually temp or nonserialisable data)
		  scratch: {
			foo: 'bar'
		  },
		  position: { // the model position of the node (optional on init, mandatory after)
			x: window.nodeCoords.sax.x,
			y: window.nodeCoords.sax.y
		  },
		  selected: false, // whether the element is selected (default false)
		  selectable: true, // whether the selection state is mutable (default true)
		  locked: false, // when locked a node's position is immutable (default false)
		  grabbable: true, // whether the node can be grabbed and moved by the user
		  classes: 'foo bar', // a space separated list of class names that the element has
		}
		// Incremento i count
		window.nodeCount.sax += 1;
		return sax;
}

function getJoinObj() {
		var join = { // node n1
		  group: 'nodes', // 'nodes' for a node, 'edges' for an edge
		  // NB: id fields must be strings
		  data: { // element data (put dev data here)
			id: 'j' + (window.nodeCount.join+1).toString(), // mandatory for each element, assigned automatically on undefined
			name : 'Join',
		    faveColor : '#BDBDBD',
		    faveShape : 'octagon',
			object : 'join',
			join_schema : []
		  },
		  // scratchpad data (usually temp or nonserialisable data)
		  scratch: {
			foo: 'bar'
		  },
		  position: { // the model position of the node (optional on init, mandatory after)
			x: window.nodeCoords.join.x,
			y: window.nodeCoords.join.y
		  },
		  selected: false, // whether the element is selected (default false)
		  selectable: true, // whether the selection state is mutable (default true)
		  locked: false, // when locked a node's position is immutable (default false)
		  grabbable: true, // whether the node can be grabbed and moved by the user
		  classes: 'foo bar', // a space separated list of class names that the element has
		}
		// Incremento i count
		window.nodeCount.join += 1;
		return join;
}

function getCSVJoinObj() {
		var join = { // node n1
		  group: 'nodes', // 'nodes' for a node, 'edges' for an edge
		  // NB: id fields must be strings
		  data: { // element data (put dev data here)
			id: 'csv' + (window.nodeCount.csvjoin+1).toString(), // mandatory for each element, assigned automatically on undefined
			name : 'Join CSV',
		    faveColor : '#BDBDBD',
		    faveShape : 'pentagon',
			object : 'csv_join',
			join_schema : [],
			delimiter: {}
		  },
		  // scratchpad data (usually temp or nonserialisable data)
		  scratch: {
			foo: 'bar'
		  },
		  position: { // the model position of the node (optional on init, mandatory after)
			x: window.nodeCoords.join.x,
			y: window.nodeCoords.join.y
		  },
		  selected: false, // whether the element is selected (default false)
		  selectable: true, // whether the selection state is mutable (default true)
		  locked: false, // when locked a node's position is immutable (default false)
		  grabbable: true, // whether the node can be grabbed and moved by the user
		  classes: 'foo bar', // a space separated list of class names that the element has
		}
		// Incremento i count
		window.nodeCount.join += 1;
		return join;
}

function getTransformObj() {
		var transf = { // node n1
		  group: 'nodes', // 'nodes' for a node, 'edges' for an edge
		  // NB: id fields must be strings
		  data: { // element data (put dev data here)
			id: 'transf' + (window.nodeCount.transf+1).toString(), // mandatory for each element, assigned automatically on undefined
			name : 'Transform',
		    faveColor : '#BDBDBD',
		    faveShape : 'star',
			object : 'transform'
		  },
		  // scratchpad data (usually temp or nonserialisable data)
		  scratch: {
			foo: 'bar'
		  },
		  position: { // the model position of the node (optional on init, mandatory after)
			x: window.nodeCoords.transf.x,
			y: window.nodeCoords.transf.y
		  },
		  selected: false, // whether the element is selected (default false)
		  selectable: true, // whether the selection state is mutable (default true)
		  locked: false, // when locked a node's position is immutable (default false)
		  grabbable: true, // whether the node can be grabbed and moved by the user
		  classes: 'foo bar', // a space separated list of class names that the element has
		}
		// Incremento i count
		window.nodeCount.transf += 1;
		return transf;
}
	
	// Add Source
$scope.addNode = function(type) {
	if(type == 'Source') {
		node = getSourceObj();		
		var index = $scope.sourceConditions.length;
		$scope.sourceConditions[index] = [];
	}
	else if(type == 'Filter') {
		node = getFilterObj();
		var index = $scope.filterConditions.length;
		$scope.filterConditions[index] = [];
		$scope.showANDbutton.push(true);
		$scope.showORbutton.push(true);
		$scope.filterConditionsLogicOperator.push('');
	}
	else if(type == 'CullTime') {
		node = getCulltimeObj();		
		var index = $scope.culltimeSettings.length;
		$scope.culltimeSettings[index] = [];		
	}
	else if(type == 'CullSpace') {
		node = getCullSpaceObj();
		var index = $scope.cullspaceSettings.length;
		$scope.cullspaceSettings[index] = [];			
	}
	else if(type == 'Aggregate') {
		node = getAggregateObj();
		var index = $scope.aggregateSettings.length;
		$scope.aggregateSettings[index] = [];			
	}	
	else if(type == 'Destination') {
		node = getDestinationObj();
	}
	else if(type == 'TriggerEvent') {		
		node = getTriggerEventObj();
		var indexOn = $scope.triggerEventOnConditions.length;
		var indexOff = $scope.triggerEventOffConditions.length;
		$scope.triggerEventOnConditions[indexOn] = [];		
		$scope.triggerEventOffConditions[indexOff] = [];		
		$scope.triggerOnSettings[indexOn] = {'trigger_interval':0};
		$scope.triggerOffSettings[indexOff] = {'trigger_interval':0};
		$scope.showTEONANDbutton.push(true);
		$scope.showTEONORbutton.push(true);
		$scope.showTEOFFANDbutton.push(true);
		$scope.showTEOFFORbutton.push(true);		
		$scope.triggerONConditionsLogicOperator.push('');		
		$scope.triggerOFFConditionsLogicOperator.push('');		
	}
	else if(type == 'TriggerOn') {
		node = getTriggerOnOff('on');
	}		
	else if(type == 'TriggerOff') {
		node = getTriggerOnOff('off');
	}	
	else if(type == 'Sax'){
        node = getSaxObj();		
        // Disabilito il pulsante DSN
        $scope.dcnEnabled = false;
    }
	else if(type == 'Join') {
		node = getJoinObj();
		$scope.joinlines[$scope.joinlines.length] = new Array();
		$scope.joinSchemaProperties[$scope.joinSchemaProperties.length] = new Array();
		$scope.connections[$scope.connections.length] = new Array();
		$scope.allJoinProperties[$scope.allJoinProperties] = new Array();
		$scope.schemaPropertiesSelected.push([]);
        // Disabilito il pulsante DSN
        $scope.dcnEnabled = false;	
	}	
	else if(type == 'CSVJoin'){
		node = getCSVJoinObj();
		$scope.joinlines[$scope.joinlines.length] = new Array();
		$scope.joinSchemaProperties[$scope.joinSchemaProperties.length] = new Array();
		$scope.connections[$scope.connections.length] = new Array();
		$scope.allJoinProperties[$scope.allJoinProperties] = new Array();
		$scope.schemaPropertiesSelected.push([]);
		$scope.csv_delimiter.push([]);
		if($scope.workflow.id == undefined){
		    showSingleError("Please save the project before proceeding.");		    
		}
        // Disabilito il pulsante DSN
        $scope.dcnEnabled = false;	
	}
	else if(type == 'Transform') {
		node = getTransformObj();
		var indexFunc = $scope.transformFunctionsSettings.length;
		var indexVirt = $scope.virtualFunctionsSettings.length;
		var indexSelect = $scope.virtualSelections.length;
		var indexVirtName = $scope.virtualNameAS.length;
		var indexName = $scope.propertyNamesAS.length;
		$scope.schemaPropertiesSelected.push([]);
		$scope.transformFunctionsSettings[indexFunc] = [];							
		$scope.virtualFunctionsSettings[indexVirt] = [];							
		$scope.virtualSelections[indexSelect] = [];							
		$scope.propertyNamesAS[indexName] = [];							
		$scope.virtualNameAS[indexVirtName] = [];						
		$scope.addToDate.push(new Array());						
        // Disabilito il pulsante DSN
        $scope.dcnEnabled = false;	
	}		
	// Add node to workflow
	window.cy.startBatch();
	window.cy.add(node);
	window.cy.style().update();
	window.cy.endBatch();
	// Add node to scope for DB saving
	nodes.push(node);
	node = setIdxPos(node.data.id);
	// Se ho un nodo attualmente cliccato, lo deseleziono
	if($scope.node.hasOwnProperty('data')){
	    window.cy.$("node[id='"+$scope.node.data.id+"']").unselect();
    }
	// Setto il nuovo nodo cliccato
	$scope.node = node;
	window.cy.$("node[id='"+node.data.id+"']").renderedPosition({x:100, y:50});
	window.cy.$("node[id='"+node.data.id+"']").select();
}

/*********************************************************
***                  CREATE EDGES                      ***
*********************************************************/
// Add Edges
$scope.enableEdge = function() {
	// Se clicco sul pulsante già attivo, disattivo
	if($scope.canCreateEdge) {
		$scope.canCreateEdge = false;
	}
	else {
		// Inizio a vuoto l'array dei nodi da collegare
		//window.last2nodesClicked = [];
		// Abilito la creazione archi
		$scope.canCreateEdge = true;
    }
	// Inizio a vuoto l'array dei nodi da collegare
	window.last2nodesClicked = [];    
};

function getEdgeObj(obj) {
	var edge = {
		group : 'edges',
		data : {
			faveColor : obj.data.faveColor,
			id : obj.data.id,
			weight : obj.data.weight,
			source : obj.data.source,
			target : obj.data.target
		}
	};
	return edge;
}

$scope.validateNumber = function(value, min, max, obj_id, elem_name){
	var elem_id = elem_name + '_' + obj_id;	
	if(value == undefined){ 
        $("#"+elem_id).css("border", "1px solid #c9302c");			
        return; 
     }
    if(isNaN(value)){
        showSingleError("Only numeric values are admitted");
        $("#"+elem_id).css("border", "1px solid #c9302c");	
        return;
	}
	if(min != false){
        if(value<min){ 
            showSingleError("Minimum value admitted is " + min);             
            $("#"+elem_id).css("border", "1px solid #c9302c");	
            return; 
        }			
	}
	if(max != false){
        if(value>max){ 
            showSingleError("Maximum value admitted is " + max); 
            $("#"+elem_id).css("border", "1px solid #c9302c");
            return; 
        }
	}
	// Se supero la validazione, coloro il bordo di verde
	$("#"+elem_id).css("border", "1px solid #398439");
    $timeout(function() {
		$("#"+elem_id).css("border", "1px solid #CCC");        
    }, 500);
    	
	
};

$scope.changeSAXElement = function(value, min, max, obj_id, elem_name){
	var elem_id = elem_name + '_' + obj_id;	
	if(value == undefined){ 
        $("#"+elem_id).css("border", "1px solid #c9302c");			
        return; 
     }
    if(isNaN(value)){
        showSingleError("Only numeric values are admitted");
        $("#"+elem_id).css("border", "1px solid #c9302c");	
        return;
	}
	if(min != false){
        if(value<min){ 
            showSingleError("Minimum value admitted is " + min);             
            $("#"+elem_id).css("border", "1px solid #c9302c");	
            return; 
        }			
	}
	if(max != false){
        if(value>max){ 
            showSingleError("Maximum value admitted is " + max); 
            $("#"+elem_id).css("border", "1px solid #c9302c");
            return; 
        }
	}
	// Se supero la validazione, coloro il bordo di verde
	$("#"+elem_id).css("border", "1px solid #398439");
	
	if(elem_name == 'alphabet'){
	    // Applico il nuovo alfabeto
	    window.cy.$("node[id='"+obj_id+"']").data('alphabet', value);
	}
	else if(elem_name == 'window'){
	    // Applico il nuovo valore di finestra
	    window.cy.$("node[id='"+obj_id+"']").data('window', value);		
    }
    
    $timeout(function() {
		$("#"+elem_id).css("border", "1px solid #CCC");        
    }, 500);	
};

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function countNodes(eles){
    var count = 0;
    eles.forEach(function(elem){
        if(elem.data().target == undefined){ 
			count+=1;
		}		
    });
    return count;	
}

function satisfyDataflowConditions(source_node, target_node){
    var connected_edges = window.cy.$("node[id='"+source_node.data.id+"']").connectedEdges();	
    var incoming_target_edges = countNodes(window.cy.$("node[id='"+target_node.data.id+"']").incomers());
    var outcoming_source_edges = window.cy.$("node[id='"+source_node.data.id+"']").outgoers();
    // Se source è Source
    if(source_node.data.object == 'source'){        
        // Non può essere collegata ad un'altra sorgente
        if(target_node.data.object == 'source') { 
            showSingleError("Sources can't be connected");     
            return false; 
        }
        // Un solo arco in uscita
        else if(outcoming_source_edges.length > 0) { 
            showSingleError(source_node.data.name + " admits only one outcoming edge");     
            return false; 			
        }    	
	}
    // se target è Source, non può essere collegato
    if(target_node.data.object == 'source'){
        showSingleError(target_node.data.name + " can't admit incoming edges");     
        return false; 		
    }	    
	// se source è Filter
    if(source_node.data.object == 'filter'){
		// Un solo arco in uscita
        if(outcoming_source_edges.length > 2) { 
            showSingleError(source_node.data.name + " admits only one outcoming edge");       
            return false; 			
        }
        // Non può essere collegato a Sorgenti
        else if(target_node.data.object == 'source'){
            showSingleError("Filters can't be connected to sources");
            return false; 			
        }
        // Non può essere collegato ad un altro filtro
        else if(target_node.data.object == 'filter'){
            showSingleError("Filters can't be connected to filters");
            return false; 			
        }
    }
    // se target è Filter
    if(target_node.data.object == 'filter' && 
       incoming_target_edges.length > 0){
        showSingleError(target_node.data.object + ' admits only one incoming edge');
        return false; 	        
    }  
	// se source è CullTime
    if(source_node.data.object == 'cull_time'){
		// Un solo arco in uscita
        if(outcoming_source_edges.length > 0) { 
            showSingleError(source_node.data.name + " admits only one outcoming edge");       
            return false; 			
        }
        if(target_node.data.object == 'cull_time'){
            showSingleError(source_node.data.name + " can't be connected to other culltimes");
            return false;			  
        }
    } 
    // se target è CullTime
    if(target_node.data.object == 'cull_time' && 
       incoming_target_edges.length > 0){
        showSingleError(target_node.data.object + ' admits only one incoming edge');
        return false; 	        
    }
	// se source è CullSpace
    if(source_node.data.object == 'cull_space'){
		// Un solo arco in uscita
        if(outcoming_source_edges.length > 0) { 
            showSingleError(source_node.data.name + " admits only one outcoming edge");       
            return false; 			
        }
        if(target_node.data.object == 'cull_space'){
            showSingleError(source_node.data.name + " can't be connected to other cullspaces");
            return false;			  
        }
    } 
    // se target è CullSpace
    if(target_node.data.object == 'cull_space' && 
       incoming_target_edges.length > 0){
        showSingleError(target_node.data.object + ' admits only one incoming edge');
        return false; 	        
    }
    // se source è Aggregate
    if(source_node.data.object == 'aggregate'){
        // Posso avere più archi in uscita solo se collego altri aggregate
        if(outcoming_source_edges.length > 0){
			if(target_node.data.object != 'aggregate'){
				showSingleError(source_node.data.object + " admits multiple edges only against other aggregates");
				return false;
            }            
        }
    } 
    // se source è Destination
    if(source_node.data.object == 'destination'){
        // Non può avere archi in uscita
        showSingleError(source_node.data.object + " can't admit outcoming edges");		
        return false;
    }  
    // se source è TriggerEvent
    if(source_node.data.object == 'triggerEvent'){
        // Può avere archi in uscita solo verso triggerActionON e triggerActionOFF
        if(target_node.data.object != 'triggerAction'){
		    showSingleError(source_node.data.object + " admits outcoming edges against triggerActions");
		    return false;			
        }		
    }
    // se source è TriggerAction
    if(source_node.data.object == 'triggerAction'){
        // Può avere un solo arco in uscita
        if(outcoming_source_edges.length > 0){
		    showSingleError(source_node.data.object + " admits one outcoming edge against a destination");
		    return false;
        }		
        // Può essere collegato solo ad un destination
        if(target_node.data.object != 'destination'){
            showSingleError(source_node.data.object + " admits one outcoming edge against a destination");
            return false;			
        }		
    }
    // Può avere in ingresso TriggerEvent o Sources
    if(target_node.data.object == 'triggerAction') {
		var edges = window.cy.$("node[id='"+target_node.data.id+"']").connectedEdges();
		// Può ricevere archi da sources o un triggerEvent
        if(source_node.data.object != 'source' &&
           source_node.data.object != 'filter' && 
           source_node.data.object != 'triggerEvent'){
            showSingleError(target_node.data.object + " admits only incoming edges from sources and triggerEvent");
            return false;
        }        
        if(source_node.data.object == 'triggerEvent'){
            // Se ho già collegato un triggerAction sollevo errore
            for(var x=0; x<edges.length; x++){
                var source_data = edges[x].source().data();				
                if(source_data.object == 'triggerEvent'){
			        showSingleError(target_node.data.object + " has already a triggerEvent connected");
			        return false;		
                }	   
            }
        }
    }
    // Un csv_join può avere un solo nodo in ingresso
    if(target_node.data.object == 'csv_join') {
        if(getConnectedNodes(target_node).length > 0){
			showSingleError(target_node.data.name + " accept only one incoming node.");
			return false;				
		}
	}
    // Un elemento definito sul dataflow non può essere collegato 
    // ad un altro elemento appartenente allo stesso percorso  
    var successors = window.cy.$("node[id='"+source_node.data.id+"']").successors();
    for(var x=0; x<successors.length; x++){
        var elem = successors[x];
        if(elem.data() != undefined){
            //
            console.log("conn id: " + elem.data().id + " | source_id: " + source_node.data.id); 
            var data = elem.data();
            if(elem.data().id == target_node.data.id){	
				showSingleError("cycle detected. Can't connect nodes");		
				return false;				
            }			
        }		  
    }   
    $scope.$digest()        
    return true; 	

}



function connectNodes() {
	var mustPropagate = false;
	var TargetEqualToSource = false;
	var old_schema = false;
	var source = window.last2nodesClicked[0];
	var target = window.last2nodesClicked[1];
	var edge = {
		group : 'edges',
		data : {
			faveColor : '#527BAB',
			id : source + target,
			weight : 4,
			source : source,
			target : target
		}
	};
    // Assegno l'eventuale schema del source al nodo target
    var source_node = cloneObject(getItemData(source)); //window.cy.$("node[id='"+source+"']").json();
    var target_node = getItemData(target);
    var canSetSchema = false;
    var canSetMultipleSchema = false;  
    
    if(satisfyDataflowConditions(source_node, target_node)){			  
		// Controllo che il target non sia destination, aggregation,
		// TriggerON, TriggerOFF
		if(target_node.data.object == 'filter' ||
		   target_node.data.object == 'cull_time' ||
		   target_node.data.object == 'cull_space' ||
		   target_node.data.object == 'triggerEvent') {
			// Verifico che non ho già degli archi in ingresso sul target node
			var connected_edges = window.cy.$("node[id='"+target_node.data.id+"']").connectedEdges();
			// Se ho più connected_edges potrebbe trattarsi di  un TriggerAction 
			if(connected_edges.length > 0){
				var elem = connected_edges.sources();
				if(elem.length == 1 && elem.id() == target_node.data.id){ 
					// pass
				}
				else {				
					alertsManager.clearAlerts();			
					alertsManager.addAlert(target_node.data.object + ' admits only one incoming edge', 'alert-danger');
					$scope.showCustomAlert = true;		  		  
					return;
				}						
			}
		}
		if(target_node.data.object == 'join'){
			// Se Source non ha definito il Type sollevo errore
			if($scope.selectedSourceTypes[source_node.data.pos]==undefined){
				alertsManager.clearAlerts();			
				alertsManager.addAlert('Please specify Type in ' + source_node.data.name, 'alert-danger');
				$scope.showCustomAlert = true;		  		  
				return;				
			}
            if(source_node.data.schema != undefined){	
				// Se il source_node è di tipo Source
				if(source_node.data.object == 'source'){												
					// Prendo le proprietà dello schema della sorgente e le inserisco
					// in un array 
					var obj = {};      
					var key = source_node.data.id;    
					var j_schema = {};
					try{
						j_schema.m2m_data_schema = window.cy.$("node[id='"+$scope.node.data.id+"']").data().schema.m2m_data_schema;
					} catch(err){
						j_schema.m2m_data_schema = [];
					}
					
					// Inserisco per ogni proprietà dello schema, selected:true|false
					var connected_nodes = getConnectedNodes($scope.node);
					var connected_schemas = getConnectedNodesSchema2(target_node.data);					
					if(connected_nodes.length == 0 || connected_nodes.indexOf(key)==-1){ connected_nodes.push(key); }
					// Il nodo non risulta ancora tra i connected_schemas per cui lo aggiungo manualmente
					connected_schemas.push(source_node.data);
					// Applico modifiche su $scope.schemaPropertiesSelected
					setPropertySelected(connected_nodes, getNodeIDXById(target_node.data.id), true);			
					
					obj[key] = source_node.data.schema.m2m_data_schema;
					$scope.joinSchemaProperties[target_node.data.pos].push(obj);
					if(target_node.idx >= $scope.schemaPropertiesSelected.length){
						$scope.schemaPropertiesSelected.push([]);
					}     
					if(j_schema.sensor_type != source_node.data.schema.sensor_type) {
						j_schema.sensor_type = 'joined';
						source_node.data.schema.m2m_data_schema.forEach(function(elem){							
							$scope.schemaPropertiesSelected[target_node.idx].push(true);
							elem.enabled = true;
							elem.selected = true;
						});
					}                                              
					for(var x=0; x<source_node.data.schema.m2m_data_schema.length; x++){						
						source_node.data.schema.m2m_data_schema[x].node_name = source_node.data.name;
						j_schema.m2m_data_schema.push(source_node.data.schema.m2m_data_schema[x]);
						j_schema.m2m_data_schema[j_schema.m2m_data_schema.length-1].id = key;
					}                                
					// Setto lo schema a cui ho aggiunto le proprietà del nuovo nodo collegato.
					window.cy.$("node[id='"+$scope.node.data.id+"']").data('schema', j_schema);   
					window.cy.$("node[id='"+target_node.data.id+"']").data('connected_schemas', connected_schemas);   
					mustPropagate=true;
					// Devo far propagare il nuovo schema del Join, per cui associo a
					// source_node, il nodo Join
					TargetEqualToSource = true;	
					old_schema = target_node.data.schema;					        
				}           			
				else {
					// Se il Join ha già uno schema, appendo quello della sorgente
					if(target_node.data.schema != undefined){
						var sourceSchemaCopy = $.extend(true, {}, source_node.data.schema.m2m_data_schema);
						Array.prototype.push.apply(target_node.data.schema.m2m_data_schema, sourceSchemaCopy);					
					}
					// Altrimenti associo quello del nodo in ingresso
					else {
						target_node.data.schema = {};
						target_node.data.schema.m2m_data_schema = source_node.data.schema.m2m_data_schema;
						target_node.data.schema.sensor_type = 'joined';
						target_node.data.schema.connected_nodes = new Array();
					}
					target_node.data.schema.connected_nodes.push(source_node.data.id);
					window.cy.$("node[id='"+target_node.data.id+"']").data('data', target_node.data);
				}				
			}
			// Se la sorgente non ha settato il type
			// sollevo errore
			else if($scope.selectedSourceTypes[source_node.data.pos] == undefined){
				showSingleError('Please set the source type');
				return;						
			}			
        }
        /////////////////
        // SE CSV_JOIN
        /////////////////
		if(target_node.data.object == 'csv_join'){
			// Se Source non ha definito il Type sollevo errore
			if($scope.selectedSourceTypes[source_node.data.pos]==undefined){
				alertsManager.clearAlerts();			
				alertsManager.addAlert('Please specify Type in ' + source_node.data.name, 'alert-danger');
				$scope.showCustomAlert = true;		  		  
				return;				
			}
            if(source_node.data.schema != undefined){	
				// Se il source_node è di tipo Source
				if(source_node.data.object == 'source'){												
					// Prendo le proprietà dello schema della sorgente e le inserisco
					// in un array 
					var obj = {};      
					var key = source_node.data.id;    
					var j_schema = {};
					try{
						j_schema.m2m_data_schema = window.cy.$("node[id='"+$scope.node.data.id+"']").data().schema.m2m_data_schema;
						//target_node.data.schema.m2m_data_schema;
					} catch(err){
						j_schema.m2m_data_schema = [];
					}
					
					// Inserisco per ogni proprietà dello schema, selected:true|false
					var connected_nodes = getConnectedNodes($scope.node);
					var connected_schemas = getConnectedNodesSchema2(target_node.data);					
					if(connected_nodes.length == 0 || connected_nodes.indexOf(key)==-1){ connected_nodes.push(key); }
					// Il nodo non risulta ancora tra i connected_schemas per cui lo aggiungo manualmente
					connected_schemas.push(source_node.data);
					// Applico modifiche su $scope.schemaPropertiesSelected
					setPropertySelected(connected_nodes, getNodeIDXById(target_node.data.id), true);			
					
					obj[key] = source_node.data.schema.m2m_data_schema;
					$scope.joinSchemaProperties[target_node.data.pos].push(obj);
					if(target_node.idx >= $scope.schemaPropertiesSelected.length){
						$scope.schemaPropertiesSelected.push([]);
					}     
					if(j_schema.sensor_type != source_node.data.schema.sensor_type) {
						j_schema.sensor_type = 'joined';
						source_node.data.schema.m2m_data_schema.forEach(function(elem){							
							$scope.schemaPropertiesSelected[target_node.idx].push(true);
							elem.enabled = true;
							elem.selected = true;
						});
					}                                              
					for(var x=0; x<source_node.data.schema.m2m_data_schema.length; x++){						
						source_node.data.schema.m2m_data_schema[x].node_name = source_node.data.name;
						j_schema.m2m_data_schema.push(source_node.data.schema.m2m_data_schema[x]);
						j_schema.m2m_data_schema[j_schema.m2m_data_schema.length-1].id = key;
					}                                
					// Setto lo schema a cui ho aggiunto le proprietà del nuovo nodo collegato.
					window.cy.$("node[id='"+$scope.node.data.id+"']").data('schema', j_schema);   
					window.cy.$("node[id='"+target_node.data.id+"']").data('connected_schemas', connected_schemas);   
					mustPropagate=true;
					// Devo far propagare il nuovo schema del Join, per cui associo a
					// source_node, il nodo Join
					TargetEqualToSource = true;	
					old_schema = target_node.data.schema;					        
				}           			
				else {
					// Se il Join ha già uno schema, appendo quello della sorgente
					if(target_node.data.schema != undefined){
						var sourceSchemaCopy = $.extend(true, {}, source_node.data.schema.m2m_data_schema);
						Array.prototype.push.apply(target_node.data.schema.m2m_data_schema, sourceSchemaCopy);					
					}
					// Altrimenti associo quello del nodo in ingresso
					else {
						target_node.data.schema = {};
						target_node.data.schema.m2m_data_schema = cloneObject(source_node.data.schema.m2m_data_schema);
						//target_node.data.schema.m2m_data_schema.reverse();
						target_node.data.schema.sensor_type = 'joined';
						target_node.data.schema.connected_nodes = new Array();
					}
					target_node.data.schema.connected_nodes.push(source_node.data.id);
					window.cy.$("node[id='"+target_node.data.id+"']").data('data', target_node.data);
				}				
			}
			// Se la sorgente non ha settato il type
			// sollevo errore
			else if($scope.selectedSourceTypes[source_node.data.pos] == undefined){
				showSingleError('Please set the source type');
				return;						
			}			
        }         
        ///////////////////////
        // END IF CSV_JOIN   
        //////////////////////  
        if(target_node.data.object == 'transform'){		    
		    // Popolo $scope.functionsSettings[target_data.pos] con valori vuoti
		    var pos = getNodePositionById(target_node.data.id);
		    source_node.data.schema.m2m_data_schema.forEach(function(elem){
			    $scope.transformFunctionsSettings[pos].push(true);
			    $scope.schemaPropertiesSelected[target_node.idx].push(elem.enabled);
			    $scope.propertyNamesAS[pos].push("");
			});	
		}
		// Il triggerAction non può avere un arco entrante su un triggerEvent
		if(source_node.data.object == 'triggerAction' &&
		   target_node.data.object == 'triggerEvent') {			
			alertsManager.clearAlerts();			
			alertsManager.addAlert('triggerEvent doesn\'t admit incoming edges from triggerActions', 'alert-danger');
			$scope.showCustomAlert = true;		  		  
			return;
		}         	
    
		if(source_node.data.hasOwnProperty('schema') || source_node.data.hasOwnProperty('schemas')){
			// Se ho collegati Source e Filter, cancellando l'arco e collegando
			// una nuova sorgente, verifico se gli schema sono compatibili
			if(target_node.data.hasOwnProperty('schema')){		
				try {			
					if(target_node.data.schema.sensor_type != source_node.data.schema.sensor_type &&
					   target_node.data.object == 'filter'){	    	
						// Verifico che che gli attributi di S1 su cui ho messo 
						// delle condizioni siano presenti in S2 con lo stesso tipo
						// Ciclo le proprietà dello schema e verifico che l'attributo settato 
						// nel filtro abbiamo stesso name e type  
						for(var conditions of $scope.filterConditions[target_node.data.pos]){
							var found = 0;
							for(var property of source_node.data.schema.m2m_data_schema){                        
								if(conditions.attribute.name == property.name &&
								   conditions.attribute.type == property.type){
									found += 1;	   
								}                    
							}
							if(found == 0){
								// L'attributo settato non ha riferimenti sul nuovo schema
								// sollevo errre e blocco ciclo.
								canSetSchema = false;
								alertsManager.clearAlerts();			
								alertsManager.addAlert('Filter conditions properties are not compatible \nwith new schema.\nPlease remove filter conditions.', 'alert-danger');
								$scope.showCustomAlert = true;								 
							}					
					  }      
					  mustPropagate = true;                           
				   }
			   } catch(error){
					if(source_node.data.hasOwnProperty('schema')){
						canSetSchema = source_node.data.schema != null ? true : false;				    
					}
					else if(source_node.data.hasOwnProperty('schema')){
						canSetMultipleSchema = source_node.data.schemas != null ? true : false; 
					}
					mustPropagate = true;
			   }
			} 
			else { 
				// Se il soure_node è un triggerEvent allora il triggerAction può assurmerne lo schema
				if(target_node.data.object == 'triggerAction' && source_node.data.object != 'triggerEvent'){
					canSetMultipleSchema = true;
				}
				else if(target_node.data.object == 'aggregate'){
					canSetMultipleSchema = true;
				}   		
				else if(target_node.data.object == 'destination'){
					// può avere più schemi
					canSetMultipleSchema = true;			 
				}				
				else if(target_node.data.object != 'triggerAction' && source_node.data.object != 'destination'){
					canSetSchema = true;	
				} 
				else if(target_node.data.object == 'sax'){
					canSetSchema = true;
				}        
				else {
					canSetSchema = false;	
				}
			}
		}
	}
	else {
	    return;	
	}    	 
    if(canSetSchema){	
		if(source_node.data.hasOwnProperty('schema')){	
			var schema = {};
			if(source_node.data.schema.sensor_type == 'joined'){
                schema = source_node.data.schema;  				
                if(source_node.data.object == 'join'){
					// Compongo lo schema su cui è stato fatto join                
					convertAllJoinPropertiesToAttrs2(source_node);
					schema.m2m_data_schema = source_node.data.schema.m2m_data_schema; //convertAllJoinPropertiesToAttrs2(source_node);
					schema.connected_nodes = source_node.data.connected_nodes;
					// Riordino lo schema
					schema.m2m_data_schema = $scope.sortSchemaObj2(schema);
					schema.sensor_type = 'joined';  					
				} 
                else if(source_node.data.object == 'csv_join'){
					// Compongo lo schema su cui è stato fatto join                  
					console.log(source_node.data.schema.m2m_data_schema);
					convertAllJoinPropertiesToAttrs2(source_node);
					schema.m2m_data_schema = source_node.data.schema.m2m_data_schema; //convertAllJoinPropertiesToAttrs2(source_node);
					if(source_node.data.connected_nodes == undefined){
						source_node.data.connected_nodes = [];
					    source_node.data.connected_schemas.forEach(function(elem){
						    source_node.data.connected_nodes.push(elem.id);
						});	
					}
					schema.connected_nodes = source_node.data.connected_nodes;
					// Riordino lo schema
					schema.m2m_data_schema = $scope.sortSchemaObj2(schema);
					schema.sensor_type = 'joined';  					
				} 				                             
			}
			else {
                schema = $.extend(true, {}, source_node.data.schema);
                schema.source_id = source_node.data.id;                               
            }
            $scope.schemaPropertiesSelected[target_node.idx] = $.extend(true, {}, $scope.schemaPropertiesSelected[source_node.idx]); 
            window.cy.$("node[id='"+target_node.data.id+"']").data('schema', schema); 
        }
    }      
    if(canSetMultipleSchema){
		// Se il source_node ha una lista di schemi
		if(source_node.data.hasOwnProperty('schemas')){
			var source_schemas = cloneObject(source_node.data.schemas);			
			var node_data = window.cy.$("node[id='"+target_node.data.id+"']").data();
			var target_schemas = node_data.schemas;
			var total_schemas = source_schemas.concat(target_schemas);
			window.cy.$("node[id='"+target_node.data.id+"']").data('schemas', total_schemas);		
		}		
		else {			
			mustPropagate = true;			
		}
    }      	    
	window.cy.startBatch();
	window.cy.add(edge);
	window.cy.style().update();
	window.cy.endBatch();	
	if(TargetEqualToSource){
		source_node = target_node;	
	}
	if(mustPropagate == true){
		var successors = window.cy.$("node[id='"+source_node.data.id+"']").successors();
		var old_schema = source_node.data.hasOwnProperty('schema') ? source_node.data.schema : false;
		var idx = getNodeIDXById(source_node.data.id);
		propagateSchema(source_node, successors, source_node.data.schema.sensor_type, idx, old_schema);					
    }     	
}
	
/*********************************************************
***               SET CLICKED NODE                     ***
*********************************************************/		
function setClickedNode(pnode) {	
	$scope.node = pnode;
	if(pnode.data.object == 'join'){
		var connected_nodes = getConnectedNodes($scope.node);		
		setPropertySelected(connected_nodes, false, false);		
	}
	if(pnode.data.object == 'csv_join'){	    
		var connected_nodes = getConnectedNodes($scope.node);		
		setPropertySelected(connected_nodes, false, false);		    	
		drawLines2(pnode.data);
	}
	if(pnode.data.object == 'transform'){
	    $scope.drawVirtual(pnode);	
	}
	if($scope.canCreateEdge == true) {
		// if element not in array
		if(window.last2nodesClicked.indexOf(pnode.data.id) == -1) {
			window.last2nodesClicked.push(pnode.data.id);
		}
		// If I have exactly 2 elements in array
		if(window.last2nodesClicked.length == 2) {
			// Create edge between nodes
			connectNodes();
			$scope.canCreateEdge = false;
			window.last2nodesClicked = [];			
		}
	}
}	

/*********************************************************
***               SET CLICKED EDGE                     ***
*********************************************************/	
$scope.$on('setClickedEdge', function(event, args) {
	$scope.edge = args.edge;
});	
	
	
/*********************************************************
***            GET CLICKED NODE INFO                   ***
*********************************************************/	
	function getItemData(id) {
		if(id != undefined) {
			for(var x=0; x<window.nodes.length; x++){
			   if(window.nodes[x].data.id == id) {			       	       
				   return window.nodes[x];
			   }
			}
			return false;
		}
		return false;
	}
	
function setJoinSchemaPropertyID(id, property_name, m2m_data_schema){
	for(var x=0; x<m2m_data_schema.length; x++){
        if(m2m_data_schema[x].name == property_name	&&
           !m2m_data_schema[x].hasOwnProperty('id')){
		       break;
		       m2m_data_schema.id = id;	   
		}						
	}
	return m2m_data_schema;
}	

function removeFromJoinSchema(join_data, delete_data){
    var join_m2m_schema = join_data.schema.m2m_data_schema;
    var join_schema = join_data.join_schema;
    var delete_schema = delete_data.schema.m2m_data_schema;
    var pos = 0;
    delete_schema.forEach(function(elem){
		var isJoin = isJoinProperty3(join_data, delete_data.id, elem.name);
        if(isJoin[0]==true){
            // Controllo join_ids,
            var join_element = join_schema[isJoin[1]];	   
            if(join_element.ids.length==2){
				// Elimino l'intero oggetto
			    join_schema.splice(isJoin[1], 1);
			    // Assegno alla proprietà come id elemento il nodo restante
			    join_m2m_schema = setJoinSchemaPropertyID(join_element.ids[0], elem.name, join_m2m_schema);			    
			}
			else {
				// Elimino da ids l'id del nodo
				for(var x=0; x<join_element.ids.length; x++){
				    if(join_element.ids[x]==delete_data.id){
					    join_element.ids.splice(x, 1);	
					}	
				}
			}			
            join_schema[isJoin[1]] = join_element;           
		}
		else {
			for(var y=0; y<join_m2m_schema.length; y++){
				if(join_m2m_schema[y].id == delete_data.id &&
				   join_m2m_schema[y].name == elem.name){
				       join_m2m_schema.splice(y, 1);
				   }
			}		
		}
		pos+=1;		
	});
	return join_m2m_schema;
}
	
/*********************************************************
***                  DELETE NODE                       ***
*********************************************************/	
$scope.deleteNode = function(pnode) {	
	/* devo ridare idx agli elementi, altrimenti mi sfasa tutto 
		in selectedNode devo riordinare gli elementi
	*/
	var deletionErrors = [];	
	var id = pnode.data.id;
	// Lo elimino da CY
	var toDelete = window.cy.$("node[id='"+id+"']");
	var hasJoin = false; // se c'è un join sul dataflow
	var connected_schemas = null;
	// Devo controllare se ho collegati nodi che hanno schemi multipli
	// in tal caso devo rimuovere lo schema
	var delete_data = toDelete.data();
	var target_data = null;
	var old_schema = null;
	var toPropagateID = null;
	var successors = null;
	var previous = {};
	if(toDelete.connectedEdges().length > 0){
		if(delete_data.hasOwnProperty('schema')){
			successors = toDelete.successors();
            successors.every(function(elem){
                var elem_data = $.extend(true, {}, elem.data()); // Deep copy
                if(elem_data.target == undefined){
					// Se è un triggerAction ed il precedente non devo eliminare lo schema, salto il ciclo					
					if(previous.object == 'triggerEvent' && elem_data.object == 'triggerAction'){ return false; } 					

					// Assegno il previous all'oggetto corrente
					previous = elem_data;
					target_data = window.cy.$("node[id='"+elem_data.id+"']").data();               	
					// Se ho collegato un nodo con schemi multipli
					if(target_data.hasOwnProperty('schemas')){					
						var count = 0; 
						var pos = 0;  
						for(var el of target_data.schemas){
							if(delete_data.schema.sensor_type == el.sensor_type && count == 0){
								target_data.schemas.splice(pos, 1);							
								count += 1;
							}
							pos += 1;
						} 										
					}
					// se ho collegato un nodo con schema unico
					else {
						if(target_data.object == "join"){
						    // Elimino lo schema del nodo eliminato dal Join
						    target_data.schema.m2m_data_schema = removeFromJoinSchema(elem_data, delete_data)
						    target_data.connected_nodes = getConnectedNodes2(target_data);
						    connected_schemas = getConnectedNodesSchema2(target_data);
						    // Non è stato ancora eliminato il nodo per cui risulta ancora collegato
						    // Elimino dai connected_schemas, lo schema del nodo Source
						    var position = 0;
						    connected_schemas.every(function(elem){
								if(elem.id == delete_data.id){
								    return true;	
								}
								position += 1;
							});
							// Elimino lo schema dall'elenco dei connected_schemas
							connected_schemas.splice(position, 1);
							// Associo i connected_schemas al nodo
							target_data.connected_schemas = connected_schemas;
						    window.cy.$("node[id='"+target_data.id+"']").data('data', target_data); 
						    // Propago il nuovo schema
						    hasJoin = true;
						    toPropagateID = target_data.id;
						    old_schema = $.extend({}, target_data.schema);
						    drawLines2(target_data);
					    }
					    else if(hasJoin){
							//
						}
						else { 
							// Da decidere se il target deve perdere lo schema.
							// Per il momento lo setto a vuoto
							//delete target_data.schema;
							target_data.schema = null;
							//deletionErrors.push({'id' : target_data.id, 'name' : target_data.name}); 
					    }                                    	                                   
					}

					// Se il nodo ha settato condizioni sullo schema eliminato,
					// devo eliminare lo schema ma sollevare un'eccezione
					var idx = getNodeIDXById(target_data.id);
					if(target_data.object == 'filter'){
					    $scope.showORbutton[target_data.pos] == true;
                        if($scope.filterConditions[target_data.pos].length > 0){													
                            deletionErrors.push({'id' : target_data.id, 'name' : target_data.name});       
                        } 						
					} 
					else if(target_data.object == 'triggerEvent') {
						if($scope.triggerEventOnConditions[target_data.pos].length > 0){
							deletionErrors.push({'id' : target_data.id, 'name' : target_data.name + ' ON'});       
						}
						if($scope.triggerEventOffConditions[target_data.pos].length > 0){
							deletionErrors.push({'id' : target_data.id, 'name' : target_data.name + ' OFF'});                                     	                                   
					    }						
					} 					
				} 
				return true;                    	                
            });			
		}		        
        if(delete_data.hasOwnProperty('schemas')){
			var connected_edges = toDelete.successors();
            connected_edges.forEach(function(elem){
                var elem_data = elem.data();
                if(elem_data.target != undefined){                
					// Se è un nodo
					var target_data = window.cy.$("node[id='"+elem_data.target+"']").data();
					// Se ho collegato un nodo con schemi multipli
					if(target_data.hasOwnProperty('schemas')){
						var sensor_types = [];
						for(var s of delete_data.schemas){
							sensor_types.push(s.sensor_type);	
						}
						var pos = 0;    
						for(var el of target_data.schemas){
							if(sensor_types.indexOf(el.sensor_type) != -1){
								target_data.schemas.splice(pos, 1);
								sensor_types.splice(pos, 1);
							}
							pos += 1;
						} 										
					}
					else {
						var elem_data = elem.data();
						// Se è un nodo
						var target_data = window.cy.$("node[id='"+elem_data.target+"']").data();                	
						// cerco lo schema da eliminare
						var sensor_type = delete_data.schema.sensor_type;
						var count = 0;
						for(var x=0; x<target_data.schemas.length; x++){
							// Elimino il primo schema che combacia
							if(target_data.schemas[x].sensor_type == sensor_type && count == 0){
								target_data.schemas.splice(x, 1);				
								count += 1;
							}					 
						} 					
					}
					
					// Se il nodo ha settato condizioni sullo schema eliminato,
					// devo eliminare lo schema ma sollevare un'eccezione
					var idx = getNodeIDXById(target_data.id);
					if(target_data.object == 'trigger'){
                        if($scope.filterConditions[target_data.pos].length > 0){
                            deletionErrors.push({'id' : target_data.id, 'name' : target_data.name});       
                        } 						
					} 
					else if(target_data.object == 'triggerEvent') {
						if($scope.triggerEventOnConditions[target_data.pos].length > 0){
							deletionErrors.push({'id' : target_data.id, 'name' : target_data.name + ' ON'});       
						}
						if($scope.triggerEventOffConditions[target_data.pos].length > 0){
							deletionErrors.push({'id' : target_data.id, 'name' : target_data.name + ' OFF'});                                     	                                   
					    }						
					} 
				}                                     	                
            });
        }		
		
	}
	if(delete_data.object == 'sax' || delete_data.object == 'join'){ 
		// Controllo che non ci siano altri sax o join sul dataflow
		var saxs = window.cy.$("node[object='sax']");
		var joins = window.cy.$("node[object='join']");
		var activate = false;
		// Se ho solo l'elemento che verrà eliminato
		if(saxs.length == 1 && joins.length == 0 ||
		   saxs.length == 0 && joins.length == 1){
            activate = true;
        }
        if(activate==true){
			// Riabilito il link al DSN converter
            $scope.dcnEnabled = true;			
        }
    }  
	window.cy.remove(toDelete);		
	// Riordina elementi
	rewrite(pnode);
	$scope.showTab = false;
	if(hasJoin){
		var fake_node = window.cy.$("node[id='"+toPropagateID+"']").json();		
		successors = window.cy.$("node[id='"+toPropagateID+"']").successors();		
		propagateSchema(fake_node, successors, 'joined', getNodeIDXById(toPropagateID), old_schema);
	}
	if(deletionErrors.length > 0){   
		var msg1 = '<b>' + delete_data.name + ' removed</b>.<br/>' +
	              'The following operators still have setted conditions,' +
	              ' please remove them manually or connect a new schema of the same type to keep them:';
	    var msg2 = '<ul>' + deletionErrors.map(function(elem){return '<li>'+elem.name+'</li>';}) + '</ul>';
	  	showErrorAlert(deletionErrors, msg1+msg2.split(',').join(''), delete_data.name);	  					 
	} 	
}	

function showSingleError(msg){
	alertsManager.clearAlerts();			
	alertsManager.addAlert(msg, 'alert-danger');
	$scope.showCustomAlert = true;		
}
// Messaggio in verde
function showSingleMessage(msg){
	alertsManager.clearAlerts();			
	alertsManager.addAlert(msg, 'alert-success');
	$scope.showCustomAlert = true;		
}
// La uso per chiamare la funzione dalle direttive
$scope.showSingleError = function(msg){
	alertsManager.clearAlerts();			
	alertsManager.addAlert(msg, 'alert-danger');
	$scope.showCustomAlert = true;		
};

function showErrorAlert(array_msgs, msg, node_name){
	array_msgs.map(function(elem){
		window.cy.$("node[id='"+elem.id+"']").style('border-color', '#d9534f').select();      
	});
	
	alertsManager.clearAlerts();			
	alertsManager.addAlert(msg, 'alert-danger');
	$scope.showCustomAlert = true;		
}

// Uso questa funzione per eliminare le proprietà di un nodo
// contenute nelle varie strutture dati, quando questo viene
// eliminato.
function rewrite(deleted) {
	var idx = deleted.idx;	
	var pos = deleted.data.pos;
	var count = pos;
	var type;
	var nodes = [];	
	if(deleted.data.object==='source') { type='source';}
	else if(deleted.data.object==='filter') {type='filter';}
	else if(deleted.data.object==='destination') { type='destination';}
	else if(deleted.data.object==='cull_time') { type='cull_time';}
	else if(deleted.data.object==='cull_space') { type='cull_space';}
	else if(deleted.data.object==='aggregate') { type='aggregate';}
    else if(deleted.data.object==='triggerEvent') { type='triggerEvent';}	
    else if(deleted.data.object==='triggerAction') { type='triggerAction';}	
    else if(deleted.data.object==='join') { type='join';}	
    else if(deleted.data.object==='csv_join') { type='csv_join';}	
    else if(deleted.data.object==='sax') { type='sax';}	
    else if(deleted.data.object==='transform') { type='transform';}	

	// Elimino il nodo da nodes
	window.nodes.splice(idx, 1);	
	// Ciclo in window.nodes, ed assegno ai nodi con idx superiore
	// a quello eliminato, il nuovo idx
	for(var x=idx; x<window.nodes.length; x++) {
		window.nodes[x].idx = x;
	}
	if(deleted.data.hasOwnProperty('event_state')){
		if(deleted.data.event_state === 'on') {
			for(var x=0; x<window.nodes.length; x++) {
				if(window.nodes[x].data.event_state==='on'
				   && window.nodes[x].data.id != deleted.data.id
				   && window.nodes[x].data.pos > pos) {
					  window.nodes[x].data.pos = count;
					  count+=1;
				}
			}							
		}
		else if(deleted.data.event_state === 'off') {
			for(var x=0; x<window.nodes.length; x++) {
				if(window.nodes[x].data.event_state==='off'
				   && window.nodes[x].data.id != deleted.data.id
				   && window.nodes[x].data.pos > pos) {
					  window.nodes[x].data.pos = count;
					  count+=1;
				}
			}	
		}
	}
	else {	
	    for(var x=0; x<window.nodes.length; x++) {
	        if(window.nodes[x].data.object===type
	           && window.nodes[x].data.id != deleted.data.id
	           && window.nodes[x].data.pos > pos) {
			      window.nodes[x].data.pos = count;
			      count+=1;
		    }
        }
    }
	
	if(type === 'source') {
		// BUG
		// quando elimino una sorgente, o l'OR o l'AND rimangono nascosti
		// forzo la visualizzazione
		$scope.showORbutton[deleted.data.pos] = true;
		$scope.showANDbutton[deleted.data.pos] = true;
		// Elimino da selectedSourceCategories
		$scope.selectedSourceCategories.splice(pos, 1);	
		// Elimino da selectedSourceTypes
		$scope.selectedSourceTypes.splice(pos, 1);
		$scope.schemaPropertiesSelected.splice(idx, 1);
    }
    else if(type === 'destination') {
		// Elimino da selectedDestinationCategories
		$scope.selectedDestinationCategories.splice(pos, 1);	
		// Elimino da selectedDestinationTypes
		$scope.selectedDestinationTypes.splice(pos, 1);		
		$scope.schemaPropertiesSelected.splice(idx, 1);
	}
	else if(type === 'cull_time') {
		$scope.culltimeSettings.splice(pos, 1);
	}	
	else if(type === 'cull_space') {
		$scope.cullspaceSettings.splice(pos, 1);
	}
	else if(type === 'aggregate') {
		$scope.aggregateSettings.splice(pos, 1);
	}
	else if(type === 'filter') {
		$scope.filterConditions.splice(pos, 1);
		$scope.showORbutton.splice(pos, 1);
		$scope.showANDbutton.splice(pos, 1);
		$scope.filterConditionsLogicOperator.splice(pos, 1);
		$scope.schemaPropertiesSelected.splice(idx, 1);
	}		
	else if(type === 'triggerEvent') {
		$scope.triggerEventOnConditions.splice(pos, 1);
		$scope.triggerEventOffConditions.splice(pos, 1);
		$scope.triggerOnSettings.splice(pos, 1);
		$scope.triggerOffSettings.splice(pos, 1);
		$scope.showTEONORbutton.splice(pos, 1);
		$scope.showTEONANDbutton.splice(pos, 1);
		$scope.showTEOFFORbutton.splice(pos, 1);
		$scope.showTEOFFANDbutton.splice(pos, 1);		
		$scope.triggerONConditionsLogicOperator.splice(pos, 1);		
		$scope.triggerOFFConditionsLogicOperator.splice(pos, 1);		
				
	}
	else if(type === 'triggerAction') {
		if(deleted.data.event_state==='on') {
            $scope.triggerActionOnEvents.splice(pos, 1);	
	    }
	    else {
            $scope.triggerActionOffEvents.splice(pos, 1);	
		}
	}	
	else if(type === 'join'){
        $scope.connections.splice(pos, 1);    
        $scope.joinlines.splice(pos, 1);    
        $scope.joinSchemaProperties.splice(pos, 1);
        $scope.allJoinProperties.splice(pos, 1);            
        $scope.schemaPropertiesSelected.splice(idx, 1);
    }	
	else if(type === 'csv_join'){
        $scope.connections.splice(pos, 1);    
        $scope.joinlines.splice(pos, 1);    
        $scope.joinSchemaProperties.splice(pos, 1);
        $scope.allJoinProperties.splice(pos, 1);            
        $scope.schemaPropertiesSelected.splice(idx, 1);
        $scope.csv_delimiter.splice(pos, 1);
    }    
	else if(type === 'sax'){        
        $scope.schemaPropertiesSelected.splice(idx, 1);
    } 
	else if(type === 'transform') {
		$scope.transformFunctionsSettings.splice(pos, 1);
		$scope.virtualFunctionsSettings.splice(pos, 1);
		$scope.virtualSelections.splice(pos, 1);
		$scope.propertyNamesAS.splice(pos, 1);
		$scope.virtualNameAS.splice(pos, 1);
		$scope.addToDate.splice(pos, 1);
	}     
	else if(type == 'aggregate'){
        $scope.selectedAggregateAttribute.splice(pos, 1);		
	}  	
}

function allowed(father_data, child_data){
    if(father_data.object == 'triggerEvent' && 
       child_data.object == 'triggerAction')
        return false;
    if(father_data.object == 'triggerEvent' &&
       child_data.object == 'destination')
        return false;
    // Se il child non è un nodo
    if(child_data.object == undefined)
        return false;        
    return true;
}

/*********************************************************
***                  DELETE EDGE                       ***
*********************************************************/	
$scope.deleteEdge = function(pedge) {	
	var id = pedge.data.id;
	var deletionErrors = [];
	// Lo elimino da CY
	var toDelete = window.cy.$(":selected");
	// Se elimindo un edge collegato ad un nodo che ha schemi
	// multipli, elimino lo schema dal nodo
	var delete_node = toDelete.target();
	var delete_data = delete_node.data();
	var target_node = toDelete.target();
    var target_data = target_node.data();	
	var source_node = toDelete.source();
	var source_data = source_node.data();			
	
    // Devo rifare lo stesso discorso per la rimozione di un nodo,
    // se elimino l'arco, su tutto il dataflow va rimosso lo schema dagli 
    // operatori, qualora il nodo source collegato all'arco avesse uno
    // schema settato.
    //var previous = target_data;
    var previous = source_data;
    // Se il source dell'arco ha più archi in uscita, devo lavorare
    // solo sui successori dell'arco da rimuovere.
    var successors = toDelete.source().successors();
	successors.every(function(elem){
		var elem_data = elem.data();
		if(allowed(previous, elem_data)){
			// Se il nodo di corrente ha schema singolo
			if(elem_data.hasOwnProperty('schema')){
				previous = $.extend(true, {}, elem_data);
				elem_data.schema = null;				
				// Se il nodo ha settato condizioni sullo schema eliminato,
				// devo eliminare lo schema ma sollevare un'eccezione
				var idx = getNodeIDXById(elem_data.id);
				if(elem_data.object == 'filter'){
					//$scope.showORbutton[elem_data.pos] == true;
					if($scope.filterConditions[elem_data.pos].length > 0){													
						deletionErrors.push({'id' : elem_data.id, 'name' : elem_data.name});       
					} 						
				} 
				else if(elem_data.object == 'triggerEvent') {
					if($scope.triggerEventOnConditions[elem_data.pos].length > 0){
						deletionErrors.push({'id' : elem_data.id, 'name' : elem_data.name + ' ON'});       
					}
					if($scope.triggerEventOffConditions[target_data.pos].length > 0){
						deletionErrors.push({'id' : elem_data.id, 'name' : elem_data.name + ' OFF'});                                     	                                   
					}						
				}	
			}
			else if(elem_data.hasOwnProperty('schemas')){
				// Se il nodo precedente ha schema multiplo
				if(previous.hasOwnProperty('schemas')){
					var sensor_types = [];
					for(var s of previous.schemas){
						sensor_types.push(s.sensor_type);	
					}
					previous = $.extend(true, {}, elem_data);
					var pos = 0;    
					for(var el of elem_data.schemas){
						if(sensor_types.indexOf(el.sensor_type) != -1){
							elem_data.schemas.splice(pos, 1);
							sensor_types.splice(pos, 1);
						}
						pos += 1;
					} 
				}													
				// Se ha schema singolo
				else {             	
					// cerco lo schema da eliminare
					if(previous.hasOwnProperty('schema')){
						var sensor_type = previous.schema.sensor_type;
						previous = $.extend(true, {}, elem_data);
						
						var count = 0;
						for(var x=0; x<elem_data.schemas.length; x++){
							// Elimino il primo schema che combacia
							if(elem_data.schemas[x].sensor_type == sensor_type && count == 0){
								elem_data.schemas.splice(x, 1);				
								count += 1;
							}					 
						} 
					}					
				}								
				
				// Se il nodo ha settato condizioni sullo schema eliminato,
				// devo eliminare lo schema ma sollevare un'eccezione
				var idx = getNodeIDXById(elem_data.id);
				if(elem_data.object == 'trigger'){
					if($scope.filterConditions[elem_data.pos].length > 0){
						deletionErrors.push({'id' : elem_data.id, 'name' : elem_data.name});       
					} 						
				} 
				else if(elem_data.object == 'triggerEvent') {
					if($scope.triggerEventOnConditions[elem_data.pos].length > 0){
						deletionErrors.push({'id' : elem_data.id, 'name' : elem_data.name + ' ON'});       
					}
					if($scope.triggerEventOffConditions[elem_data.pos].length > 0){
						deletionErrors.push({'id' : elem_data.id, 'name' : elem_data.name + ' OFF'});                                     	                                   
					}						
				}
			}	
		}
		return true;                    	                
	});    	
	
	// Gestisco rimozione arco tra nodo con un solo schema e target con più schema
	if(allowed(source_data, target_data)){
		if(target_data.hasOwnProperty('schemas') && !source_data.hasOwnProperty('schemas')){
			if(target_data.schemas.length > 0){
				var sensor_type = source_data.schema.sensor_type;
				var count = 0;
				for(var x=0; x<target_data.schemas.length; x++){
					// Elimino il primo schema che combacia
					if(target_data.schemas[x].sensor_type == sensor_type && count == 0){
						target_data.schemas.splice(x, 1);				
						count += 1;
					}					 
				}        	
			}      	
		}   
		// Gestisco rimozione arco tra nodo con più schemi e target con più schema
		else if(target_data.hasOwnProperty('schemas') && source_data.hasOwnProperty('schemas')){        
			var sensor_types = [];
			for(var s of source_data.schemas){
				sensor_types.push(s.sensor_type);	
			}
			var pos = 0;    
			for(var el of target_data.schemas){
				if(sensor_types.indexOf(el.sensor_type) != -1){
					target_data.schemas.splice(pos, 1);
					sensor_types.splice(pos, 1);
				}
				pos += 1;
			}                
		}
		else if(target_data.hasOwnProperty('schema')){
			target_data.schema = null;	
		}  
    }  
	
	if(deletionErrors.length > 0){   
		var msg1 = '<b>Edge removed</b>.<br/>' +
	              'The following operators still have setted conditions on ' + source_data.name 
	              + ' schema, please remove them manually or connect a new schema of the same type to keep them:';
        var msg2 = '<ul>' + deletionErrors.map(function(elem){return '<li>'+elem.name+'</li>';}) + '</ul>';
	  	showErrorAlert(deletionErrors, msg1+msg2.split(',').join(''), delete_data.name);	  					 
	}	

	window.cy.startBatch();
	window.cy.remove(toDelete);	
	window.cy.style().update();
	window.cy.endBatch();		
	$scope.showEdgeTab = false;
}

/*********************************************************
***                DELETE WORKFLOW                     ***
*********************************************************/	
$scope.deleteWorkflow = function() {
	workflowService.deleteWorkflow($scope.workflow.id).then(
		function(response){
			// Alert
			alertsManager.clearAlerts();			
			alertsManager.addAlert('Project deleted', 'alert-success');
			// CHIAMA L'INIT
			init(false);						
			$scope.showCustomAlert = true;
			$scope.$root.$broadcast('showTab', {show:false});	
			$scope.$root.$broadcast('showEdgeTab', {show:false});			
			$scope.showDetails = false; // Nasconde Info sul progetto a sinistra
			$scope.disableButtons = true;
			// Remove Alerts
			$timeout(function() {
				$scope.$root.$broadcast('setWorkflow', {workflow:{}});
				$scope.$root.$broadcast('showDetails', {show:false});
			}, 500);

			$timeout(function() {
			  $scope.showCustomAlert = false;
			  alertsManager.clearAlerts();
			}, 3000);
		},
		function(error){
		  if(error.content.code != undefined){
			  $scope.showCustomAlert = true;
			  alertsManager.addAlert(error.content.message, 'alert-danger');
		}
	});
 };	
	
/*********************************************************
***                NODE MANIPULATION                   ***
*********************************************************/		
$scope.changeNodeName = function(pnode) {	
	var idx = pnode.idx;
	// Se il nome già è applicato ad un altro elemento
	// notifico l'errore
	var nodes = window.cy.$("node[name='"+pnode.data.name+"']");
	if(nodes.length > 1) { 
        showSingleError("Name " + pnode.data.name + " is used by another node. Choose another name."); 
        $("#name_" + pnode.data.id).css("border", "1px solid #c9302c");
    }
    else {
		$("#name_" + pnode.data.id).css("border", "1px solid #CCC");
	}
	window.cy.startBatch();
	window.cy.nodes()[idx].data( name, pnode.name );
	window.cy.style().update();
	window.cy.endBatch();			
};

$scope.changeNodeTable = function(pnode) {	
	var idx = pnode.idx;
	window.cy.startBatch();
	window.cy.nodes()[idx].data( 'table', pnode.table );
	window.cy.style().update();
	window.cy.endBatch();			
};

$scope.addSourceFilterCondition = function(pnode) {	
	var idx = pnode.idx;
	window.cy.startBatch();
	window.cy.nodes()[idx].data( filterConditions, pnode.filterConditions );
	window.cy.style().update();
	window.cy.endBatch();			
};	

// Aggiunge le condizioni di filtraggio alla lista dei filtri per ogni sorgente
$scope.addSourceCondition = function(pnode) {
	var idx = getNodePositionByType(pnode.data.id, 'source'); //pnode.idx;
    try {	
	    if($scope.sourceConditions[idx].indexOf($scope.sourceCondition)==-1) {	
            $scope.sourceConditions[idx].push(
               {
				    attribute:$scope.sourceCondition.attribute, 
				    operator:$scope.sourceCondition.operator, 
				    value:$scope.sourceCondition.value
			    }
		    );
            $scope.sourceCondition = {};
        }
	}
	catch(error) {
		
	}
}

$scope.removeSourceCondition = function(pnode, conditions) {
    var idx = getNodePositionByType(pnode.data.id, 'source'); //pnode.idx;
    var pos = $scope.sourceConditions[idx].indexOf(conditions);
    if($scope.sourceConditions[idx][pos] != undefined) {
	    $scope.sourceConditions[idx].splice(pos, 1);
	}
};

$scope.changeType = function(value) {
    var id = $scope.node.data.id;
    var idx = $scope.node.idx;
    $scope.cy.startBatch();
    $scope.$root.$broadcast('updateNode', {idx:idx, type:value.name});
		$scope.cy.nodes()[idx].data( 'type', value.type );
		$scope.$root.$broadcast('updateCy', {cy:$scope.cy});
		$scope.cy.endBatch();
};

$scope.changeCategory = function(categoryObj, _node) {

	var idx = $scope.node.idx;
	window.cy.startBatch();
	window.cy.nodes()[idx].data( 'category', categoryObj );
	window.cy.style().update();
	window.cy.endBatch();	
	//console.log(_node.idx);
	$scope.selectedCategories[_node.data.pos].category = categoryObj.id;
	var pos = getCategoryPos(categoryObj.id);
	$scope.selectedCategories[_node.data.pos].pos = pos;
		
};
	
function getCategoryPos(id) {
	for(var x=0; x<$scope.sourceCategories.length; x++){
		if($scope.sourceCategories[x].id == id) {
			return x;
		}
	}
}	

/*********************************************************
***             TRIGGER  EVENT CONDITIONS              ***
*********************************************************/	
$scope.addTriggerEventOnCondition = function(operator, pnode) {
	var idx = getNodePositionByType(pnode.data.id, 'triggerEvent');
	if($scope.triggerEventOnConditions.length>0) {
		if($scope.triggerEventOnConditions[idx].indexOf($scope.triggerEvent)==-1) {
			$scope.triggerEventOnConditions[idx].push(
				{
					attribute:$scope.triggerEvent.attribute,
					operator:$scope.triggerEvent.operator,
					value:$scope.triggerEvent.value
				}
			);
			$scope.triggerEvent = {};
		}
    }
    else {
		$scope.triggerEventOnConditions[idx].push(
			{
				attribute:$scope.triggerEvent.attribute,
				operator:$scope.triggerEvent.operator,
				value:$scope.triggerEvent.value
			}
		);
		$scope.triggerEvent = {};	    	
	}
    if(operator == 'AND'){ 
        $scope.showTEONORbutton[pnode.data.pos] = false;
        $scope.triggerONConditionsLogicOperator[pnode.data.pos] = 'AND';
    }
    if(operator == 'OR'){ 
        $scope.showTEONANDbutton[pnode.data.pos] = false;
        $scope.triggerONConditionsLogicOperator[pnode.data.pos] = 'OR'; 
    }		
}

$scope.addTriggerEventOffCondition = function(operator, pnode) {
	var idx = getNodePositionByType(pnode.data.id, 'triggerEvent'); //pnode.idx;
	if($scope.triggerEventOffConditions.length>0) {
		if($scope.triggerEventOffConditions[idx].indexOf($scope.triggerEvent)==-1) {
			$scope.triggerEventOffConditions[idx].push(
				{
					attribute:$scope.triggerEvent.attribute,
					operator:$scope.triggerEvent.operator,
					value:$scope.triggerEvent.value
				}
			);
			$scope.triggerEvent = {};
		}
    }
    else {
		$scope.triggerEventOffConditions[idx].push(
			{
				attribute:$scope.triggerEvent.attribute,
				operator:$scope.triggerEvent.operator,
				value:$scope.triggerEvent.value
			}
		);
		$scope.triggerEvent = {};	    	
	}
    if(operator == 'AND'){ 
        $scope.showTEOFFORbutton[pnode.data.pos] = false;
        $scope.triggerOFFConditionsLogicOperator[pnode.data.pos] = 'AND';
    }
    if(operator == 'OR'){ 
        $scope.showTEOFFANDbutton[pnode.data.pos] = false;
        $scope.triggerOFFConditionsLogicOperator[pnode.data.pos] = 'OR'; 
    }	
}

$scope.removeTriggerCondition = function(pnode, conditions, type) {
    var idx = pnode.data.pos;
    if(type==='on') {
		var pos = $scope.triggerEventOnConditions[idx].indexOf(conditions);
		if($scope.triggerEventOnConditions[idx][pos] != undefined) {
		    if($scope.triggerEventOnConditions[idx].length == 0 ||
		       $scope.triggerEventOnConditions[idx].length == 1){
                $scope.showTEONANDbutton[pnode.data.pos] = true;
                $scope.showTEONORbutton[pnode.data.pos] = true;				
            }           			
			$scope.triggerEventOnConditions[idx].splice(pos, 1);
		}		
    }
    else if(type==='off') {
		var pos = $scope.triggerEventOffConditions[idx].indexOf(conditions);
		if($scope.triggerEventOffConditions[idx][pos] != undefined) {
		    if($scope.triggerEventOffConditions[idx].length == 0 ||
		       $scope.triggerEventOffConditions[idx].length == 1){				
                $scope.showTEOFFANDbutton[pnode.data.pos] = true;				
                $scope.showTEOFFORbutton[pnode.data.pos] = true;				
            }			
			$scope.triggerEventOffConditions[idx].splice(pos, 1);
		}		
	}			
}

/*********************************************************
***                FILTER CONDITIONS                   ***
*********************************************************/	
$scope.addFilterCondition = function(operator, pnode) {
        var idx = getNodePositionByType(pnode.data.id, 'filter'); //pnode.idx;
        if($scope.filterConditions[idx].indexOf($scope.filter)==-1) {
            $scope.filterConditions[idx].push({attribute:$scope.filter.attribute, operator: $scope.filter.operator, value:$scope.filter.value});
            $scope.filter = {};
        }
        $scope.showFilterForm = false;
        if(operator == 'AND'){ 
			console.log("nascondo showORbutton");
            $scope.showORbutton[pnode.data.pos] = false;
            $scope.filterConditionsLogicOperator[pnode.data.pos] = 'AND';
        }
        if(operator == 'OR'){ 
            $scope.showANDbutton[pnode.data.pos] = false;
            $scope.filterConditionsLogicOperator[pnode.data.pos] = 'OR'; 
        }
        return;
    
}

$scope.removeFilterCondition = function(pnode, conditions) {
    var idx = pnode.data.pos;
    var pos = $scope.filterConditions[idx].indexOf(conditions);
    if($scope.filterConditions[idx][pos] != undefined) {
	    $scope.filterConditions[idx].splice(pos, 1);
	}
    if($scope.filterConditions[idx].length == 0){
        $scope.showANDbutton[pnode.data.pos] = true;
        $scope.showORbutton[pnode.data.pos] = true;	
    }
}
	
	
function setIdxPos(id) {
	for(var x=0; x<window.nodes.length; x++){
	   if(window.nodes[x].data.id == id) {
		   // IDX è la posizione all'interno della lista di nodi
		   window.nodes[x].idx = x;
		   // POS è la posizione rispetto ai nodi dello stesso tipo
		   if(window.nodes[x].data.object === 'source') {
			   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'source');
		   }
		   else if(window.nodes[x].data.object === 'filter') {
			   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'filter');
		   }		
		   else if(window.nodes[x].data.object === 'destination') {
			   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'destination');
		   }
		   else if(window.nodes[x].data.object === 'cull_time') {
			   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'cull_time');
		   }
		   else if(window.nodes[x].data.object === 'cull_space') {
			   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'cull_space');
		   }	
		   else if(window.nodes[x].data.object === 'aggregate') {
			   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'aggregate');
		   }
		   else if(window.nodes[x].data.object === 'triggerEvent') {
			   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'triggerEvent');
		   }	
           else if(window.nodes[x].data.object === 'triggerAction') {
               if(window.nodes[x].data.event_state==='on'){
                   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'triggerAction', 'on');
               }
               else {
                   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'triggerAction', 'off');				   
               }
           }
		   else if(window.nodes[x].data.object === 'sax') {
			   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'sax');
		   }  
           else if(window.nodes[x].data.object === 'join') {
			   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'join');
		   }
           else if(window.nodes[x].data.object === 'csv_join') {
			   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'csv_join');
		   }	
           else if(window.nodes[x].data.object === 'transform') {
			   window.nodes[x].data.pos = getNodePositionByType(window.nodes[x].data.id, 'transform');
		   }		   	   
		   return window.nodes[x];
	   }
	}	
	
}
// id del nodo, tipo nodo, action opzionale usato in triggerAction	
function getNodePositionByType(id, nodeType, action) {
	action = action || 0;
	var count=0;
    for(var x=0; x<window.nodes.length; x++) {
		var node = window.nodes[x];
		if(action != 0) {
		    if(node.data.event_state === action && node.data.id == id) {
		         return count;	
		    }
		    else if(node.data.event_state === action && node.data.id != id) {
		        count+=1;	
		    }			
		}
		else {
		    if(node.data.object === nodeType && node.data.id == id) {
		         return count;	
		    }
		    else if(node.data.object === nodeType && node.data.id != id) {
		        count+=1;	
		    }
	    }
	}	
	
}	

function getNodePositionById(id) {
    for(var x=0; x<window.nodes.length; x++){
	    var node = window.nodes[x];
	    if(node.data.id === id){
		    return node.data.pos;	
		}
    }	
}

function getNodeIDXById(id) {
    for(var x=0; x<window.nodes.length; x++){
	    var node = window.nodes[x];
	    if(node.data.id === id){
		    return node.idx;	
		}
    }	
}	

/*********************************************************
***                      DCN JSON                      ***
*********************************************************/	
function getDCN(json) {	
	$scope.showLoading = true;
  dcnService.transformJSON(json).then(
      function(response){
        // Nasconde gif caricamento
        $scope.showLoading = false;
        $scope.dcn = angular.copy(response);           
        alertsManager.clearAlerts();			
		alertsManager.addAlert("DSN generated successfully", 'alert-success');  		
		  $timeout(function() {
			  $scope.showCustomAlert = false;
			  alertsManager.clearAlerts();
		  }, 3000);		  		    
      },
      function(error){		 
		  // Nasconde gif caricamento 
          $scope.showLoading = false;
          alertsManager.clearAlerts();			
		  alertsManager.addAlert(error, 'alert-danger');		  
      });	
}

$scope.getJSON = function(action) {
    $scope.jsonDCN = {"elements": {
        "nodes" : [],
        "edges" : []		
        }
    };

    $scope.dcn = '';
    var errors = [];
    var nodes = [];
	var element = {};
	var settings = {};    
    cy.nodes().forEach(function( ele ){
        var data = ele.data();  
        var idx = getNodeIDXById(data.id);
        var attrs = $scope.schemaPropertiesSelected[idx]; 
        var attributes = [];
        if(data.hasOwnProperty('schema')){
            attributes = getAttributesNameFromSelected(data.schema, attrs);      
		}
        if(data.object === 'source') {
			var category = $scope.selectedSourceCategories[data.pos];
			var type = $scope.selectedSourceTypes[data.pos];
			if(category != undefined && type != undefined) {
				element = {
					"data":{
					   "id":data.id,
					   "name":data.name,
					   "object":data.object,
					   "table" : data.table,
					   "attributes":attributes,
					   "conditions": [
						  {
							 "attribute":"category",
							 "operator":"=",
							 "value": category.name
						  },
						  {
							 "attribute":"type",
							 "operator":"=",
							 "value": type.name
						  }
					   ]
					}
				 };	
		    }
		    else {	
                errors.push({'id' : data.id, 'msg' : 'Category and Type must be filled in ' + data.name});													
			}		
		}
		else if(data.object === 'destination') {
			var category = $scope.selectedDestinationCategories[data.pos];
			var type = $scope.selectedDestinationTypes[data.pos];			
			if(category != undefined && type != undefined) {
				element = {
					"data":{
					   "id":data.id,
					   "name":data.name,
					   "object":data.object,
					   "attributes":attributes,
					   "conditions": [
						  {
							 "attribute":"category",
							 "operator":"=",
							 "value": category.name
						  },
						  {
							 "attribute":"type",
							 "operator":"=",
							 "value": type.name
						  }
					   ]
					}
				 };
			 }
			 else {				 
                errors.push({'id' : data.id, 'msg' : 'Category and Type must be filled in ' + data.name});								 
			 }			
		}
		else if(data.object == 'csv_join'){
			var csv_schema = [];
			var csvID = "";
			var sourceID = "";			
			for(var x= 0; x<2; x++){
				if(data.connected_schemas[x].object == 'csv_file'){
					csv_schema = data.connected_schemas[x].schema;
					csvID = data.connected_schemas[x].id;
				}
				else {
					sourceID = data.connected_schemas[x].id;
				}
			}
			element = {
				"data":{
				   "id":data.id,
				   "name":data.name,
				   "object":data.object,
				   "schema" : data.schema,
				   "join_ids": ids,
				   "join_schema": data.join_schema,
				   "csv_schema" : csv_schema,
				   "csv_id" : csvID,
				   "source_id" : sourceID
				}
			 };				
		}		
		else if(data.object === 'join') {
			var join_incomers = window.cy.$("node[id='"+data.id+"']").incomers();
			var ids = [];
			join_incomers.forEach(function(elem){
                if(elem.data().target == undefined){
				    var id = elem.data().id;
				    ids.push(id);	
				}
			});
			element = {
				"data":{
				   "id":data.id,
				   "name":data.name,
				   "object":data.object,
				   "schema" : data.schema,
				   "join_ids": ids,
				   "join_schema": data.join_schema
				}
			 };			 		
		}		
		else if(data.object === 'filter') {
			var node_name = "";
			var addNodeName = false;
			try{
			    var conditions = cloneObject($scope.filterConditions[data.pos]);
			} catch(err){
			    var conditions = [];	
			}
			for(var x=0; x<conditions.length; x++){
                try {
                    if(conditions[x].operator.symbol == 'RANGE' ||
                       conditions[x].operator.symbol == 'NOT RANGE') {			           
                        if(conditions[x].attribute.hasOwnProperty('node_name')){
                        	node_name = conditions[x].attribute.node_name;
                        	addNodeName = true;
                        }   						   
			           conditions[x] = {
			    		    attribute: conditions[x].attribute.name, 
			    		    type: conditions[x].attribute.type,
		    			    operator: conditions[x].operator.symbol, 
         		    	    value1: conditions[x].value1,
         		    	    value2: conditions[x].value2,         		    	    
                        };   
                        if(addNodeName){
						    conditions[x].node_name = node_name;	
						}                  
                    }
                    else if(conditions[x].attribute == undefined ||
					        conditions[x].operator == undefined ||
					        conditions[x].value == undefined){  
                        errors.push({'id' : data.id, 'msg' : data.name + ' has not valid conditions'});		
                    }								                  
                    else {
						
                        if(conditions[x].attribute.hasOwnProperty('node_name')){
                        	node_name = conditions[x].attribute.node_name;
                        	addNodeName = true;
                        }						
			           conditions[x] = {
			    		    attribute: conditions[x].attribute.name, 
                            type: conditions[x].attribute.type,			    		    
		    			    operator: conditions[x].operator.symbol, 
         		    	    value: conditions[x].value         		    	    
                        };      
                        if(addNodeName){
						    conditions[x].node_name = node_name;	
						}                                                            						
                    }
                } catch(error){  
                    errors.push({'id' : data.id, 'msg' : data.name + ' has not valid conditions'});						
			        //conditions[x] = {};         
                }   	
			}
			// Se le condizioni sono legate in AND
			if($scope.filterConditionsLogicOperator[data.pos] == 'AND'){			
			    element = {
				    "data": {
				       "id":data.id,
				       "name":data.name,
  				       "object":data.object,
  				       "attributes":attributes,
	   			       "conditions": conditions,
	   			       "orconditions": []
				    }
			    };
            }
            // Se le condizioni sono legate in OR	
            else if($scope.filterConditionsLogicOperator[data.pos] == 'OR'){
			    element = {
				    "data": {
				       "id":data.id,
				       "name":data.name,
  				       "object":data.object,
  				       "attributes":attributes,
	   			       "conditions": [],
	   			       "orconditions": conditions
				    }
			    };				
			}
            // Altrimenti ho condizioni vuote
            else {
			    element = {
				    "data": {
				       "id":data.id,
				       "name":data.name,
  				       "object":data.object,
  				       "attributes":attributes,
	   			       "conditions": [],
	   			       "orconditions": []
				    }
			    };	
            } 			 
			 		
		}
		else if(data.object === 'cull_time') {
			settings = cloneObject($scope.culltimeSettings[data.pos]);
			if(settings.hasOwnProperty('time_unit')) {
                            try{
    			        settings.time_unit = settings.time_unit.hasOwnProperty('name') ? settings.time_unit.name : settings.time_unit;
                            } catch(error){
                                settings.time_unit = "";
                            }
			}
			if(settings.start_date != undefined && settings.end_date != undefined && 
			   settings.start_time != undefined && settings.end_time != undefined) {
				var start_time = settings.start_date + 'T' + settings.start_time.slice(0,8);
				var end_time = settings.end_date + 'T' + settings.end_time.slice(0,8);				
				element = {
					"data": {
					   "id":data.id,
					   "name":data.name,
					   "object":data.object,
					   "attributes":attributes,
					   "settings": {
						 "numerator": settings.numerator,
						 "denominator": settings.denominator,
						 "time_data_name": settings.time_data_name,
						 "start_time": start_time,
						 "end_time": end_time,
						 "time_interval": settings.time_interval,
						 "time_unit": settings.time_unit
					   }
					}
				 };
		   }
		   else {
				element = {
					"data": {
					   "id":data.id,
					   "name":data.name,
					   "object":data.object,
					   "attributes":attributes,
					   "settings": {
						 "numerator": settings.numerator,
						 "denominator": settings.denominator,
						 "time_data_name": settings.time_data_name,
						 "start_time": '2000/01/01T00:00:00',
						 "end_time": '2100/01/01T00:00:00',
						 "time_interval": settings.time_interval,
						 "time_unit": settings.time_unit
					   }
					}
				 };			   
		   }			
		}
		else if(data.object === 'cull_space') {
			settings = cloneObject($scope.cullspaceSettings[data.pos]);
			element = {
				"data": {
				   "id":data.id,
				   "name":data.name,
				   "object":data.object,
				   "attributes":attributes,
				   "settings": {
                     "numerator": settings.numerator,
                     "denominator": settings.denominator,
                     "lat_data_name": settings.lat_data_name,
                     "long_data_name": settings.long_data_name,
                     "west": settings.west,
                     "south": settings.south,
                     "east": settings.east,
                     "north": settings.north,
                     "lat_interval": settings.lat_interval,
                     "long_interval": settings.long_interval
                   }
				}
			 };				
		}	
		else if(data.object === 'aggregate') {
			settings = cloneObject($scope.aggregateSettings[data.pos]);
			if(settings.time_unit != undefined) {
			    settings.time_unit = settings.time_unit.hasOwnProperty('name') ? settings.time_unit.name : settings.time_unit;
			}
			if(settings.start_time != undefined && settings.end_time != undefined) {
				var aggregate_data_name = $scope.selectedAggregateAttribute[data.pos].name;
				var start_time = settings.start_time + 'T0:00:00';
				var end_time = settings.end_time + 'T0:00:00';											
				element = {
					"data":{
					   "id": data.id,
					   "name": data.name,
					   "object": data.object,
					   "attributes":attributes,
					   "settings" : {
						 "aggregate_data_name": aggregate_data_name,
						 "time_data_name": settings.time_data_name,
						 "start_time": start_time,
						 "end_time": end_time,
						 "time_interval": settings.time_interval,
						 "time_unit": settings.time_unit,
						 "lat_data_name": settings.lat_data_name,
						 "long_data_name": settings.long_data_name,
						 "west": settings.west,
						 "south": settings.south,
						 "east": settings.east,
						 "north": settings.north,
						 "lat_interval": settings.lat_interval,
						 "long_interval": settings.long_interval
					  }
					}
				}	
			}else {
				element = {
					"data":{
					   "id": data.id,
					   "name": data.name,
					   "object": data.object,
					   "attributes":attributes,
					   "settings" : {
						 "time_data_name": settings.time_data_name,
						 "start_time": '2000/01/01T00:00:00',
						 "end_time": '2100/01/01T00:00:00',
						 "time_interval": settings.time_interval,
						 "time_unit": settings.time_unit,
						 "lat_data_name": settings.lat_data_name,
						 "long_data_name": settings.long_data_name,
						 "west": settings.west,
						 "south": settings.south,
						 "east": settings.east,
						 "north": settings.north,
						 "lat_interval": settings.lat_interval,
						 "long_interval": settings.long_interval
					  }
					}
				}				
			}		
		}				
		else if(data.object === 'triggerEvent') {
			 var triggerOnConditions = cloneObject($scope.triggerEventOnConditions[data.pos]);
			 var triggerOffConditions = cloneObject($scope.triggerEventOffConditions[data.pos]);
             var triggerOnSettings = cloneObject($scope.triggerOnSettings[data.pos]);
             var triggerOffSettings = cloneObject($scope.triggerOffSettings[data.pos]);
             var triggerOn = {"conditions":[], "trigger_interval":0};	
             var triggerOff = {"conditions":[], "trigger_interval":0};	
             if(triggerOnSettings.hasOwnProperty('trigger_condition')) {
			      triggerOn.trigger_condition = cloneObject(triggerOnSettings.trigger_condition);	
			 }
			 if(triggerOnSettings.hasOwnProperty('trigger_interval')) {
			      triggerOn.trigger_interval = Number(cloneObject(triggerOnSettings.trigger_interval));				 
			 }
             if(triggerOffSettings.hasOwnProperty('trigger_condition')) {
			      triggerOff.trigger_interval = Number(cloneObject(triggerOffSettings.trigger_interval));
			      triggerOff.trigger_condition = cloneObject(triggerOffSettings.trigger_condition);	
			 }
			 if(triggerOffSettings.hasOwnProperty('trigger_interval')) {
			      triggerOn.trigger_interval = Number(cloneObject(triggerOnSettings.trigger_interval));				 
			 }			 
			 if(triggerOnConditions.length>0) {
                var conditions = cloneObject(triggerOnConditions);				
                for(var x=0; x<conditions.length; x++){
                  try{
                    if(conditions[x].operator.symbol == 'RANGE' || conditions[x].operator.symbol == 'NOT RANGE'){
                        conditions[x] = {
                             attribute : conditions[x].attribute.name,
                             operator : conditions[x].operator.symbol,		
                             value1 : conditions[x].value1,
                             value2 : conditions[x].value2
					    };
					}
					else {
                        conditions[x] = {
                             attribute : conditions[x].attribute.name,
                             operator : conditions[x].operator.symbol,		
                             value : conditions[x].value
					    };						
                    }
                  } catch(error){  
                    $scope.errors.push({'id' : data.id, 'msg' : data.name + ' ON has not valid conditions'});						
			        //conditions[x] = {};         
                  }                       					
                }                               
				// Se le condizioni ON sono legate in AND	
				if($scope.triggerONConditionsLogicOperator[data.pos] == 'AND'){
				     triggerOn.conditions = conditions;	
				     triggerOn.orconditions = [];		   	
                }
				// Se le condizioni sono legate in OR	
				else if($scope.triggerONConditionsLogicOperator[data.pos] == 'OR'){
				     triggerOn.conditions = [];	
				     triggerOn.orconditions = conditions;		   	
                }
                // Altrimenti ho condizioni vuote
                else {
				     triggerOn.conditions = [];	
				     triggerOn.orconditions = [];	
                }                  
			 }
			 else {
				errors.push({'id' : data.id, 'msg' : data.name + ', trigger condition ON. You must define a trigger condition.'});				 
			 }
						 
			 if(triggerOffConditions.length>0) {
                var conditions = cloneObject(triggerOffConditions);				
                for(var x=0; x<conditions.length; x++){
                  try {                 					
                    if(conditions[x].operator.symbol == 'RANGE' || conditions[x].operator.symbol == 'NOT RANGE'){
                        conditions[x] = {
                             attribute : conditions[x].attribute.name,
                             operator : conditions[x].operator.symbol,		
                             value1 : conditions[x].value1,
                             value2 : conditions[x].value2
					    };
					}
					else {
                        conditions[x] = {
                             attribute : conditions[x].attribute.name,
                             operator : conditions[x].operator.symbol,		
                             value : conditions[x].value
					    };						
                    }
                  } catch(error){  
                    errors.push({'id' : data.id, 'msg' : data.name + ' OFF has not valid conditions'});						
			        //conditions[x] = {};         
                  }                       					
                }                               
				// Se le condizioni ON sono legate in AND	
				if($scope.triggerOFFConditionsLogicOperator[data.pos] == 'AND'){
				     triggerOff.conditions = conditions;	
				     triggerOff.orconditions = [];		   	
                }
				// Se le condizioni sono legate in OR	
				else if($scope.triggerOFFConditionsLogicOperator[data.pos] == 'OR'){
				     triggerOff.conditions = [];	
				     triggerOff.orconditions = conditions;		   	
                }
                // Altrimenti ho condizioni vuote
                else {
				     triggerOff.conditions = [];	
				     triggerOff.orconditions = [];	
                }                                    
			 }
			 else {
				errors.push({'id' : data.id, 'msg' : data.name + ', trigger condition OFF. You must define a trigger condition.'});				 
			 }			 			 
			
			if(triggerOn.trigger_condition != undefined){
				if(triggerOn.trigger_condition.data_value != "" && 
				   triggerOn.trigger_condition.expression != undefined) {				
					triggerOn.trigger_condition = {
						data_value : Number(triggerOn.trigger_condition.data_value),
						expression : triggerOn.trigger_condition.expression.symbol									
					 };
				 }
				 else {
					 errors.push({'id' : data.id, 'msg' : data.name + ', trigger condition ON'});
			    }				 
            }
            else {
			 	triggerOn.trigger_condition = {};
			 	errors.push({'id' : data.id, 'msg' : 'trigger condition ON'});
            }
			
			if(triggerOff.trigger_condition != undefined){
				if(triggerOff.trigger_condition.data_value != "" && 
				   triggerOff.trigger_condition.expression != undefined) {
					triggerOff.trigger_condition = {
						data_value : Number(triggerOff.trigger_condition.data_value),
						expression : triggerOff.trigger_condition.expression.symbol									
					 };
				 }
				 else {
					 errors.push({'id' : data.id, 'msg' : data.name + ', trigger condition OFF'});
			    }
            }
            else {
			 	triggerOff.trigger_condition = {};
			 	errors.push({'id' : data.id, 'msg' : 'trigger condition OFF'});
            }												 			 
			 
			 element = {
				"data":{
				     "id": data.id,
				     "name": data.name,
				     "object":"triggerEvent",
				     "attributes":attributes,
				     "triggerOn": triggerOn,
				     "triggerOff": triggerOff
				}
			 };			
		}
		else if(data.object === 'triggerAction') {
			if(data.event_state === 'on') {
				var event = '';
				try {
					event = $scope.triggerActionOnEvents[data.pos].event;
				}
				catch(e){
					event = '';
				}
				element = {
				    "data":{
				      "id": data.id,
				      "name": data.name,
				      "object": data.object,
				      "event": 'prova',
				      "event_state":"on"
				    }
				};				
			}
			else {
				var event = '';
				try {
					event = $scope.triggerActionOffEvents[data.pos].event;
				}
				catch(e){
					event = '';
				}				
				element = {
				    "data":{
				      "id": data.id,
				      "name": data.name,
				      "object": data.object,
				      "event": 'prova2',
				      "event_state":"off"
				    }
				};				
			}
		}
									
        $scope.jsonDCN.elements.nodes.push(element);     
    });
    
    cy.edges().forEach(function( ele ){
		var data = ele.data();  
		element = {
            "data":{
               "id": data.id,
               "source": data.source,
               "target": data.target
            }	
		}
		$scope.jsonDCN.elements.edges.push(element); 
	});    	
	if(errors.length > 0){        
		var msg = '<b>Error</b><br/>' +
	              '<ul>' + errors.map(function(elem){ 
					  return '<li>'+elem.msg+'</li>';
		}) + '</ul>';
	  	showErrorAlert(errors, msg.split(',').join(''), false);	                
        event.preventDefault();  
    } 
    else if(action=='websocket') {
		return $scope.jsonDCN;
    }
    else {
	    getDCN($scope.jsonDCN);
	}
	
};

/*
 *  Listeners
 */
$scope.$on("$locationChangeStart",function(event, next, current){
    // Se ho degli errori nel dataflow, non cambio route,
    // es. non passo alla pagina DCN se ho degli errori.
    if($scope.errors.length > 0){
        $scope.errors = [];     
        event.preventDefault();
    }
    else {
        alertsManager.clearAlerts();		
    }
});
	 
$scope.$on('setWorkflow', function(event, args) {
	$scope.workflow = args.workflow;
});	 

$scope.$on('showDetails', function(event, args) {
	$scope.showDetails = args.show;
});	 	
	 
$scope.$on('showTab', function(event, args) {	
	if(!$scope.canCreateEdge){
	    $scope.showTab = args.show;
	}
	else {
	    $scope.showTab = false;	
	}
});

$scope.$on('showEdgeTab', function(event, args) {
	$scope.showEdgeTab = args.show;
});

$scope.$on('enableButtons', function(event) {
	$scope.disableButtons = false;
});

$scope.$on('disableButtons', function(event) {
	$scope.disableButtons = true;
}); 
	 
  $scope.$on('updateCy', function(event, args) {
		$scope.cy = args.cy;
		$scope.cy.style().update();
	});

  $scope.$on('updateWorkflows', function(event, args) {
		args.workflows.forEach(function(value){
		    var inside = false;
		    for(var x=0; x<$scope.workflows.length; x++) {
		      if(value.id == $scope.workflows[x].id) {
                  inside = true;
		      }
		    }
		    if(inside != true) {
  		        $scope.workflows.unshift(value);
		    }
	    });	    
	});

	$scope.$on('cleanVars', function(event) {
      //$scope.workflow = {};
      $scope.nodes = [];
    	$scope.node = {};
    	$scope.nodeCount = {source : 0, filter:0, culltime:0};
	    $scope.nodeCoords = {
    		source: {x:100, y:100}, // Initial coords
    		filter: {x:150, y:100},
    		culltime: {x:120, y:100}
    	};
	});
	
function getObectSize(obj) {
  var count = 0;
  var i;
 
  for (i in obj) {
      if (obj.hasOwnProperty(i)) {
          count++;
      }
  }	
  return count;
}

$scope.$on('renderCy', function(event, args) {   
    $scope.showDetails = true;
    // Chiudo Tab dettagli
    $scope.closeTab();
    $scope.state_tab = 'canvas';
    // Elimino i nodi ed archi presenti in CY SCOPE
    try{
        window.cy.nodes().remove();
        window.cy.edges().remove();
        window.cy.nodes().removeStyle();
        window.cy.edges().removeStyle();
        window.cy.style().resetToDefault();
    }
    catch(error){ }
    
    // Se ho un Workflow caricato, devo ripulire
    cleanVars();     
    $scope.workflow = args.workflow;         
    initRendered($scope.workflow.name);
    var toRender = [];                
     
    // Ottengo style dal DB
    if(args.cy != "") {
		var cyUgly = JSON.stringify(eval("(" + args.cy + ")"));
		var cy = JSON.parse(cyUgly);    
		window.cy.startBatch();
		if(cy.style != undefined) {
			var style = cy.style; //cloneObject(cy.style);
			for(var x=0; x<style.length; x++){
			  if(style[x].hasOwnProperty('css')) {
				var obj = style[x];
				try{				
					for(var key in obj.css) {							
					  if(obj.css[key].indexOf("%") === -1 &&
						 obj.css[key].indexOf("mapData") === -1) {					  
						  window.cy.style()
						  .selector(obj.selector)
						  .css(key, obj.css[key])
						  .update();
					  }
					  else {
						  window.cy.style()
						  .selector(obj.selector)
						  .css(key, obj.css[key])
						  .update();					  
					  }
					}
				} catch(e) {
					console.log(e);	
				}
			  }
			  else {
				window.cy.style()
				.selector(style[x].selector)
				.update();
			  }
			}
		}
		if(cy.elements.hasOwnProperty('nodes')) {
			  var setPropSelectedJoin = false;
		      cy.elements.nodes.forEach(function(value) {		  
			  var node = getCustomObj(value, 'nodes');    			       
			  // Add node to CY			  
			  window.cy.add(node);
			  nodes.push(node);
			  setIdxPos(node.data.id);	
              if(node.data.object != 'join'){			  
			      // gli attributi sono inseriti in una lista di stringhe
			      var attrs = getAttributesFromList(node.data.schema, node.data.attributes);
			      $scope.schemaPropertiesSelected.push(attrs);		  
              }
			  // Aggiungo conditions etc.
			  if(value.data.object == 'source'){
				  window.nodeCount.source += 1; 
			      for(var x=0; x<value.data.conditions.length; x++){
			          if(value.data.conditions[x].attribute == 'category'){
			              $scope.selectedSourceCategories[node.data.pos] = {name : value.data.conditions[x].value};			  
					  }
			          if(value.data.conditions[x].attribute == 'type'){
			              $scope.selectedSourceTypes[node.data.pos] = {name : value.data.conditions[x].value};		  
					  }					  
				  }			  
			  }  
			  if(value.data.object == 'destination'){
				  window.nodeCount.destination += 1;
			      for(var x=0; x<value.data.conditions.length; x++){
			          if(value.data.conditions[x].attribute == 'category'){
			              $scope.selectedDestinationCategories[node.data.pos] = {name : value.data.conditions[x].value};			  
					  }
			          if(value.data.conditions[x].attribute == 'type'){
			              $scope.selectedDestinationTypes[node.data.pos] = {name : value.data.conditions[x].value};		  
					  }					  
				  }			  
			  }		
			  if(value.data.object == 'filter'){
				  window.nodeCount.filter += 1; 			  
				  if(value.data.conditions.length > 0){                       					 
				      $scope.filterConditions[node.data.pos] = value.data.conditions;		  
				      $scope.showANDbutton.push(true);
				      $scope.showORbutton.push(false);
				      $scope.filterConditionsLogicOperator.push('AND');
                  }
                  // ho anche di default orconditions
				  else if(value.data.orconditions.length > 0){
				      $scope.filterConditions[node.data.pos] = value.data.orconditions;
				      $scope.showANDbutton.push(false);
				      $scope.showORbutton.push(true);
				      $scope.filterConditionsLogicOperator.push('OR');				      		  
                  }
                  else {
				      $scope.filterConditions[node.data.pos] = [];
				      $scope.showANDbutton.push(true);
				      $scope.showORbutton.push(true);
				      $scope.filterConditionsLogicOperator.push('');					  
                  }					                                                                     
			  }
			  if(value.data.object == 'cull_time'){				  
				  var start_date = value.data.settings.start_time;
				  var start_array = start_date.split('T');	
				  var end_date = value.data.settings.end_time;
				  var end_array = end_date.split('T');					  			  
				  $scope.culltimeSettings[node.data.pos] = value.data.settings;
				  $scope.culltimeSettings[node.data.pos].start_date = start_array[0]; 
				  $scope.culltimeSettings[node.data.pos].start_time = start_array[1];
				  $scope.culltimeSettings[node.data.pos].end_date = end_array[0]; 
				  $scope.culltimeSettings[node.data.pos].end_time = end_array[1];				  
				  $scope.culltimeSettings[node.data.pos].time_unit =  value.data.settings.time_unit; 
				  window.nodeCount.culltime += 1;   
			  }
			  if(value.data.object == 'cull_space'){
				  $scope.cullspaceSettings[node.data.pos] = value.data.settings;
				  window.nodeCount.cullspace += 1; 				  	  
			  }
			  if(value.data.object == 'aggregate'){
				  $scope.selectedAggregateAttribute[node.data.pos] = {};
				  $scope.selectedAggregateAttribute[node.data.pos].name = value.data.settings.aggregate_data_name;
				  $scope.aggregateSettings[node.data.pos] = value.data.settings;
				  $scope.aggregateSettings[node.data.pos].time_unit = {name : value.data.settings.time_unit};	
				  window.nodeCount.aggregate += 1; 				  	  
			  }			  	
			  if(value.data.object == 'triggerEvent'){
				  var triggerEventOn = value.data.triggerOn;
				  var triggerEventOff = value.data.triggerOff;
				  // triggerON conditions
				  if(value.data.triggerOn.conditions.length > 0){                       					 
				      $scope.triggerEventOnConditions[node.data.pos] = triggerEventOn.conditions;	  
				      $scope.showTEONANDbutton.push(true);
				      $scope.showTEONORbutton.push(false);
				      $scope.triggerONConditionsLogicOperator.push('AND');
                  }
                  // ho anche di default orconditions
				  else if(value.data.triggerOn.orconditions.length > 0){
				      $scope.triggerEventOnConditions[node.data.pos] = triggerEventOn.orconditions;
				      $scope.showTEONANDbutton.push(false);
				      $scope.showTEONORbutton.push(true);
				      $scope.triggerONConditionsLogicOperator.push('OR');				      		  
                  }
                  else {
				      $scope.triggerEventOnConditions[node.data.pos] = [];
				      $scope.showTEONANDbutton.push(true);
				      $scope.showTEONORbutton.push(true);
				      $scope.triggerONConditionsLogicOperator.push('');					  
                  }
				  // triggerOFF conditions
				  if(value.data.triggerOff.conditions.length > 0){                       					 
				      $scope.triggerEventOffConditions[node.data.pos] = triggerEventOff.conditions;	  
				      $scope.showTEOFFANDbutton.push(true);
				      $scope.showTEOFFORbutton.push(false);
				      $scope.triggerOFFConditionsLogicOperator.push('AND');
                  }
                  // ho anche di default orconditions
				  else if(value.data.triggerOff.orconditions.length > 0){
				      $scope.triggerEventOffConditions[node.data.pos] = triggerEventOff.orconditions;
				      $scope.showTEOFFANDbutton.push(false);
				      $scope.showTEOFFORbutton.push(true);
				      $scope.triggerOFFConditionsLogicOperator.push('OR');				      		  
                  }
                  else {
				      $scope.triggerEventOffConditions[node.data.pos] = [];
				      $scope.showTEOFFANDbutton.push(true);
				      $scope.showTEOFFORbutton.push(true);
				      $scope.triggerONConditionsLogicOperator.push('');					  
				      $scope.triggerONConditionsLogicOperator.push('');
                  }                  	                                    				  
				  $scope.triggerOnSettings[node.data.pos] = {trigger_interval : triggerEventOn.trigger_interval,
					                                         trigger_condition : triggerEventOn.trigger_condition};					                                         				 
				  $scope.triggerOffSettings[node.data.pos] = {trigger_interval : triggerEventOff.trigger_interval,
					                                         trigger_condition : triggerEventOff.trigger_condition};					                                         
				  window.nodeCount.trigger += 1;				 				   				 				  				  				  				  	  				   				 				  				  				  				  	 				  				 				  				  				  				  	 
			  }
			  if(value.data.object === 'triggerAction') {
				  var obj = {
					"data":{
					  "id": value.data.id,
					  "name": value.data.name,
					  "object": value.data.object,
					  "event": value.data.event,
					  "event_state": value.data.event_state
					}	
				  };				  
				  if(value.data.event_state === 'on') {
					  $scope.triggerActionOnEvents[node.data.pos] = obj;
					  window.nodeCount.triggerOn += 1;
                  }
                  else {
			          $scope.triggerActionOffEvents[node.data.pos] = obj;
			          window.nodeCount.triggerOff += 1;
			      }			      
			  }
              if(value.data.object === 'join'){
				  if(node.data.join_ids != undefined){
			  	      $scope.joinlines[node.data.pos] = node.data.join_ids;			  	      
			  	      $scope.connections[node.data.pos] = new Array();			  	         
			  	      setPropSelectedJoin = true;
				  } else { 
					  $scope.joinlines[node.data.pos] = [];
				  }
				  // Setto le proprietà cheched dopo aver renderizzato
				  $scope.schemaPropertiesSelected.push([]);
                  $scope.joinSchemaProperties[$scope.joinSchemaProperties.length] = new Array();
			  	  window.nodeCount.join += 1;
			  	  var nodeCount = value.data.id.split('j')[1];
			  	  if(nodeCount > window.nodeCount.join){
                      window.nodeCount.join = parseInt(nodeCount);  
                  }			  	  
			  	  // Disabilito il link al convertitore DSN
			  	  $scope.dcnEnabled = false;
			  }	
              if(value.data.object === 'csv_join'){
				  if(value.data.join_ids != undefined){
			  	      $scope.joinlines[value.data.pos] = value.data.join_ids;			  	      
			  	      $scope.connections[value.data.pos] = new Array();			  	         
			  	      setPropSelectedJoin = true;
				  } else { 
					  $scope.joinlines[value.data.pos] = [];
				  }
				  // Setto le proprietà cheched dopo aver renderizzato
				  $scope.schemaPropertiesSelected.push([]);
                  $scope.joinSchemaProperties[$scope.joinSchemaProperties.length] = new Array();
			  	  window.nodeCount.csvjoin += 1;
			  	  // Setto il delimiter
			  	  $scope.csv_delimiter[value.data.pos] = value.data.delimiter;
			  	  var nodeCount = value.data.id.split('csv')[1];
			  	  if(nodeCount > window.nodeCount.join){
                      window.nodeCount.join = parseInt(nodeCount);  
                  }			  	  
			  	  // Disabilito il link al convertitore DSN
			  	  $scope.dcnEnabled = false;
			  }				  
              if(value.data.object === 'sax'){
			  	  window.nodeCount.sax += 1;
			  	  // Disabilito il link al convertitore DSN
			  	  $scope.dcnEnabled = false;
			  }		
			  if(value.data.object === 'transform'){
				  $scope.virtualFunctionsSettings.push([]);
				  $scope.transformFunctionsSettings.push([]);
				  $scope.virtualSelections.push([]);
				  $scope.propertyNamesAS.push([]);
				  $scope.virtualNameAS.push([]);
				  toRender.push(value);
					if(value.data.hasOwnProperty('schema')){
					  value.data.schema.m2m_data_schema.forEach(function(elem){
						  if(elem.hasOwnProperty('function')){
							  if(elem.function == 'transform'){ // tab transform
								  var func = angular.copy(getTransformFunctionByInitial(elem.initial));							      
								  $scope.transformFunctionsSettings[value.data.pos].push(func);
							  }
							  else { // tab virtual
								  var func = angular.copy(getVirtualFunctionByInitial(elem.initial));
								  $scope.virtualFunctionsSettings[value.data.pos].push(func);
								  $scope.virtualNameAS[value.data.pos].push(elem.nameAS);
								  elem.values.forEach(function(elemY){
									  $scope.virtualSelections[value.data.pos].push(elemY);
								  });								                   
							  }
						  }
						  else {
							  $scope.transformFunctionsSettings[value.data.pos].push(true);
						  }
						  if(elem.hasOwnProperty('nameAS')){
							  $scope.propertyNamesAS[value.data.pos].push(elem.nameAS);
						  }		
						  else {
							  $scope.propertyNamesAS[value.data.pos].push("");
						  }								    
					  });					   											  						
					}						  
				  window.nodeCount.transf += 1; 					  
			  }		      		  
		  });
		}	
	    window.cy.zoom(1);						       
		// Renderizzo gli archi
		if(cy.elements.edges != undefined) {
			//window.cy.style().resetToDefault();
			cy.elements.edges.forEach(function(value){
				var edge = getEdgeObj(value);
				window.cy.add(edge);
			});
		}		
		window.cy.endBatch();
		
		// Dopo aver renderizzato
		if(setPropSelectedJoin==true){   			
            cy.elements.nodes.forEach(function(node) {			          
				if(node.data.object == 'join'){
					//var attrs = [];
                    var attrs = getAttributesFromList2(node, node.data.attributes);		
                    if(attrs.length == 0){ // ho proprietà in join
                        // Ricostruisco tutte le proprietà dello schema derivato dal join
                        // e pongo selezionate quelle contenute in Schema. 
                        composeSchema(node);                                              
					}
					else {
                        $scope.schemaPropertiesSelected[getNodeIDXById(node.data.id)] = attrs;						
					}
					
					var successors = window.cy.$("node[id='"+node.data.id+"']").successors();
					for(var x=0; x<successors.length; x++){
						if(successors[x].data().target == undefined){
							if(successors[x].data().object == 'join'){ break; }							
					        $scope.schemaPropertiesSelected[getNodeIDXById(successors[x].id())] = $scope.schemaPropertiesSelected[getNodeIDXById(node.data.id)];
						}
					}
				}
				else if(node.data.object == 'csv_join'){
					//var attrs = [];
                    var attrs = getAttributesFromList2(node, node.data.attributes);		
                    if(attrs.length == 0){ // ho proprietà in join
                        // Ricostruisco tutte le proprietà dello schema derivato dal join
                        // e pongo selezionate quelle contenute in Schema. 
                        composeSchema(node);                                            
					}
					else {
                        $scope.schemaPropertiesSelected[getNodeIDXById(node.data.id)] = attrs;						
					}
					
					var successors = window.cy.$("node[id='"+node.data.id+"']").successors();
					for(var x=0; x<successors.length; x++){
						if(successors[x].data().target == undefined){
							if(successors[x].data().object == 'join'){ break; }							
					        $scope.schemaPropertiesSelected[getNodeIDXById(successors[x].id())] = $scope.schemaPropertiesSelected[getNodeIDXById(node.data.id)];
						}
					}								
				}				
			});            
		}		 				
	}		
});
// Nello schema dell'operatore Join salvato,
// le proprietà non selezionate vengono rimosse, 
// qui ricostruisco l'intero schema
function composeSchema(node){
    var complete_schema = [];
    var join_schema = node.data.join_schema;
    var connected_schema = node.data.connected_schemas;
    $scope.schemaPropertiesSelected[getNodeIDXById(node.data.id)] = [];   
    if(node.data.hasOwnProperty('schema')){
		node.data.schema.m2m_data_schema.forEach(function(el){
			$scope.schemaPropertiesSelected[getNodeIDXById(node.data.id)].push(el.selected);			
		});
	}    
}

function oldSchemaContains(new_property, old_schema, source_id){
    var toReturn = false;
    for(var x=0; x<old_schema.m2m_data_schema.length; x++){	
		if(source_id != false){	
			if(old_schema.m2m_data_schema[x].name == new_property &&
			   old_schema.m2m_data_schema[x].id == source_id){
				toReturn = true;			
				break;
			}		
	    }
	    else {
			if(old_schema.m2m_data_schema[x].name == new_property &&
			   old_schema.m2m_data_schema[x].id == undefined){
				toReturn = true;
				break;
			}				
		}
    }
    return toReturn;
}

  $scope.$on('deleteWorkflow', function(event, args) {
    var idx = null;
    for(var x=0; x<$scope.workflows.length; x++) {
      if(args.id == $scope.workflows[x].id) {
        idx = x;
      }
    }
    if(idx != null) {
      $scope.workflows.splice(idx, 1);
    }
	});

  $scope.$on('addNodes', function(event, args) {
		$scope.nodes.push(args.node);
	});

  $scope.$on('updateNode', function(event, args) {
		$scope.nodes.forEach(function(value){
		    for(var x=0; x<$scope.nodes.length; x++) {
			    if(x == args.idx){
					  if(args.type != undefined) {
				        $scope.nodes[x].type = args.type;
					  }
					  else if(args.category != undefined) {
						$scope.nodes[x].category = args.category;
					  }
				}
			}
	    });
	});

	$scope.$on('canCreateEdge', function(event, args) {
		$scope.canCreateEdge = args.canCreateEdge;
	});

	$scope.$on('updateCustomAlert', function(event, args) {
		$scope.showCustomAlert = args.show;
	});

/*************************************************
 *         GET CUSTOM OBJ
 *************************************************/
	  function getCustomObj(obj, obj_group) {
		    if(obj.data.object === 'source' ||
		       obj.data.object === 'destination') {
				var node = {
				  group: obj_group,

				  data: { // element data (put dev data here)
					id: obj.data.id, // mandatory for each element, assigned automatically on undefined
					name : obj.data.name,
					faveColor : obj.data.faveColor,
					faveShape : obj.data.faveShape,
					object : obj.data.object,
					table : obj.data.table,
					attributes: obj.data.attributes,
					pos : obj.data.pos,					
					foo: 3, bar: 5, baz: 2									
				  },

				  // scratchpad data (usually temp or nonserialisable data)
				  scratch: {
					foo: 'bar'
				  },
				  renderedPosition: { 
					  x: Math.round(obj.position.x), //Number((obj.position.x).toFixed(2)),
					  y: Math.round(obj.position.y), //Number((obj.position.y).toFixed(2))
				  },				  

				  selected: obj.selected, // whether the element is selected (default false)
				  selectable: obj.selectable, // whether the selection state is mutable (default true)
				  locked: obj.locked, // when locked a node's position is immutable (default false)
				  grabbable: obj.grabbable, // whether the node can be grabbed and moved by the user
				  classes: obj.classes // a space separated list of class names that the element has
				};
				
				
		  }
		  else if(obj.data.object === 'triggerAction'){
				var node = {
				  group: obj_group,

				  data: { // element data (put dev data here)
					id: obj.data.id, // mandatory for each element, assigned automatically on undefined
					name : obj.data.name,
					faveColor : obj.data.faveColor,
					faveShape : obj.data.faveShape,
					event: obj.data.event,
					event_state: obj.data.event_state,
					object : obj.data.object,
					pos : obj.data.pos,
					attributes: obj.data.attributes
				  },

				  // scratchpad data (usually temp or nonserialisable data)
				  scratch: {
					foo: 'bar'
				  },

				  renderedPosition: { 
					  x: Math.round(obj.position.x), //Number((obj.position.x).toFixed(2)),
					  y: Math.round(obj.position.y), //Number((obj.position.y).toFixed(2))
				  },

				  selected: obj.selected, // whether the element is selected (default false)
				  selectable: obj.selectable, // whether the selection state is mutable (default true)
				  locked: obj.locked, // when locked a node's position is immutable (default false)
				  grabbable: obj.grabbable, // whether the node can be grabbed and moved by the user
				  classes: obj.classes // a space separated list of class names that the element has
				};						  
		  }
          else if(obj.data.object === 'sax'){
				var node = {
				  group: obj_group,

				  data: { // element data (put dev data here)
					id: obj.data.id, // mandatory for each element, assigned automatically on undefined
					name : obj.data.name,
					faveColor : obj.data.faveColor,
					faveShape : obj.data.faveShape,
					object : obj.data.object,
					pos : obj.data.pos,
					alphabet: obj.data.alphabet,
					window: obj.data.window
				  },

				  // scratchpad data (usually temp or nonserialisable data)
				  scratch: {
					foo: 'bar'
				  },

				  renderedPosition: { 
					  x: Math.round(obj.position.x), //Number((obj.position.x).toFixed(2)),
					  y: Math.round(obj.position.y), //Number((obj.position.y).toFixed(2))
				  },

				  selected: obj.selected, // whether the element is selected (default false)
				  selectable: obj.selectable, // whether the selection state is mutable (default true)
				  locked: obj.locked, // when locked a node's position is immutable (default false)
				  grabbable: obj.grabbable, // whether the node can be grabbed and moved by the user
				  classes: obj.classes // a space separated list of class names that the element has
				};
          }
          else if(obj.data.object === 'join'){
				var node = {
				  group: obj_group,

				  data: { // element data (put dev data here)
					id: obj.data.id, // mandatory for each element, assigned automatically on undefined
					name : obj.data.name,
					faveColor : obj.data.faveColor,
					faveShape : obj.data.faveShape,
					object : obj.data.object,
					attributes: obj.data.attributes,
					pos : obj.data.pos,
					join_ids : obj.data.join_ids,
					join_schema : obj.data.join_schema || []
				  },

				  // scratchpad data (usually temp or nonserialisable data)
				  scratch: {
					foo: 'bar'
				  },

				  renderedPosition: { 
					  x: Math.round(obj.position.x), //Number((obj.position.x).toFixed(2)),
					  y: Math.round(obj.position.y), //Number((obj.position.y).toFixed(2))
				  },

				  selected: obj.selected, // whether the element is selected (default false)
				  selectable: obj.selectable, // whether the selection state is mutable (default true)
				  locked: obj.locked, // when locked a node's position is immutable (default false)
				  grabbable: obj.grabbable, // whether the node can be grabbed and moved by the user
				  classes: obj.classes // a space separated list of class names that the element has
				};
          }  
          else if(obj.data.object === 'csv_join'){
				var node = {
				  group: obj_group,

				  data: { // element data (put dev data here)
					id: obj.data.id, // mandatory for each element, assigned automatically on undefined
					name : obj.data.name,
					faveColor : obj.data.faveColor,
					faveShape : obj.data.faveShape,
					object : obj.data.object,
					attributes: obj.data.attributes,
					pos : obj.data.pos,
					join_ids : obj.data.join_ids,
					join_schema : obj.data.join_schema || [],
					connected_schemas : obj.data.connected_schemas || [],
					html_sample: obj.data.html_sample
				  },

				  // scratchpad data (usually temp or nonserialisable data)
				  scratch: {
					foo: 'bar'
				  },

				  renderedPosition: { 
					  x: Math.round(obj.position.x), //Number((obj.position.x).toFixed(2)),
					  y: Math.round(obj.position.y), //Number((obj.position.y).toFixed(2))
				  },

				  selected: obj.selected, // whether the element is selected (default false)
				  selectable: obj.selectable, // whether the selection state is mutable (default true)
				  locked: obj.locked, // when locked a node's position is immutable (default false)
				  grabbable: obj.grabbable, // whether the node can be grabbed and moved by the user
				  classes: obj.classes // a space separated list of class names that the element has
				};
          }
          else if(obj.data.object === 'transform'){
				var node = {
				  group: obj_group,

				  data: { // element data (put dev data here)
					id: obj.data.id, // mandatory for each element, assigned automatically on undefined
					name : obj.data.name,
					faveColor : obj.data.faveColor,
					faveShape : obj.data.faveShape,
					object : obj.data.object,
					attributes: obj.data.attributes,
					pos : obj.data.pos,
					virtualColumns: obj.data.virtualColumns
				  },

				  // scratchpad data (usually temp or nonserialisable data)
				  scratch: {
					foo: 'bar'
				  },

				  renderedPosition: { 
					  x: Math.round(obj.position.x), //Number((obj.position.x).toFixed(2)),
					  y: Math.round(obj.position.y), //Number((obj.position.y).toFixed(2))
				  },

				  selected: obj.selected, // whether the element is selected (default false)
				  selectable: obj.selectable, // whether the selection state is mutable (default true)
				  locked: obj.locked, // when locked a node's position is immutable (default false)
				  grabbable: obj.grabbable, // whether the node can be grabbed and moved by the user
				  classes: obj.classes // a space separated list of class names that the element has
				};
          }                               
		  else {
				var node = {
				  group: obj_group,

				  data: { // element data (put dev data here)
					id: obj.data.id, // mandatory for each element, assigned automatically on undefined
					name : obj.data.name,
					faveColor : obj.data.faveColor,
					faveShape : obj.data.faveShape,
					object : obj.data.object,
					pos : obj.data.pos,
					attributes: obj.data.attributes
				  },

				  // scratchpad data (usually temp or nonserialisable data)
				  scratch: {
					foo: 'bar'
				  },				  				  
				  renderedPosition: { 
					  x: Math.round(obj.position.x), //Number((obj.position.x).toFixed(2)),
					  y: Math.round(obj.position.y), //Number((obj.position.y).toFixed(2))
				  },
				  selected: obj.selected, // whether the element is selected (default false)
				  selectable: obj.selectable, // whether the selection state is mutable (default true)
				  locked: obj.locked, // when locked a node's position is immutable (default false)
				  grabbable: obj.grabbable, // whether the node can be grabbed and moved by the user
				  classes: obj.classes // a space separated list of class names that the element has
				};						  
		  }
		  
		  if(obj.data.hasOwnProperty('schema')){
              node.data.schema = obj.data.schema;		  
          }
		  if(obj.data.hasOwnProperty('schemas')){
              node.data.schemas = obj.data.schemas;		  
          }	  
		  return node;
	  }


	/* Close ALERTS */
	$scope.closeAlert = function(index) {
	  $scope.alerts.splice(index, 1);
	};


	/*
	 * Create new workflow
	 */



  $scope.getCategoryById = function (id) {
    for(var x=0; x<$scope.sourceCategories.length; x++) {
      if($scope.sourceCategories[x].id == id) {
        return $scope.sourceCategories[x];
      }
      return false;
    }
  }

    $scope.showDeleteWorkflowModal = function() {
		    //
		    var workflow = $scope.workflow;
        ModalService.showModal({
            templateUrl: 'deleteWorkflow.modal.html',
            controller: 'WorkflowCtrl'
        }).then(function(modal) {
			      $scope.$root.$broadcast('setWorkflow', {workflow:$scope.workflow, cy:window.cy});			     
            modal.element.modal();
            modal.close.then(function(result) {
$scope.$root.$broadcast('disableButtons');
            });
        });
    };

    /* END MODALS */

	$scope.safeApply = function(fn) {
	  var phase = this.$root.$$phase;
	  if(phase == '$apply' || phase == '$digest') {
		if(fn && (typeof(fn) === 'function')) {
		  fn();
		}
	  } else {
		this.$apply(fn);
	  }
	};
	

/*************************************************
 * Data la lista di attributi dello schema selezionati
 * la funzione ritorna una lista di nomi
 *************************************************/	
function getAttributesNameFromSelected(schema, lista){
    var names = [];
    try{
		for(var x=0; x<lista.length; x++){
			if(lista[x] == true){
				names.push(schema.m2m_data_schema[x].name);            
			}	
		}
	}
	catch(err){
    	
    }
    return names;
}

/*************************************************
 * Data una lista di attributi (stringhe) ,
 * la funzione ritorna la lista di attributi pronta 
 * per essere renderizzata su frontend.
 *************************************************/	
function getAttributesFromList(schema, lista){
    var attrs = [];
    // lista = ["time", "latitude", ... ]
    if(lista != undefined){
		// Se la lista non è vuota
    	if(lista.length > 0){
			for(var x=0; x<schema.m2m_data_schema.length; x++){
				for(var y=0; y<lista.length; y++){
					if(schema.m2m_data_schema[x].name == lista[y]){            				
						attrs[x] = true;
						break;
					}
					else {
						if(attrs[x] == true){
							// non modifica			    
						}
						else if(attrs.length <= x){
							attrs.push(false);
							continue;			        	
						}
					}         		  
				}
			}
    	}
    	// Altrimenti popolo attrs di valori false
    	else {
            if(schema != undefined){			
                schema.m2m_data_schema.forEach(function(elem){    	
                    attrs.push(false);
                });	
            }
    	}
    }    
    return attrs;
}
 

function getAttributesFromList2(node, lista){
    var attrs = [];	
    if(lista != undefined){
        if(lista.length > 0){
			// Devo ottenere i nodi a cui sono legato
            var predecessors = window.cy.$("#"+node.data.id).incomers();	
            // Estraggo gli id dei nodi connessi		
            var ids = [];
            var schemas = {};
            var fused_schemas = [];
            predecessors.forEach(function(elem){
                if(elem.data().target == undefined){ 
					//schemas.concat(elem.data().schema.m2m_data_schema);
					Array.prototype.push.apply(fused_schemas, elem.data().schema.m2m_data_schema);
					schemas[elem.id()] = elem.data().schema.m2m_data_schema;
                	//schemas.push(elem.data().schema.m2m_data_schema); 
                }                								
            });
            if(node.data.join_ids.length > 0){
			    // ho fatto dei join	
			}           
			else {
				var attrs_pos = 0;
				var x_pos = 0;
				lista_loop:
				for(var x=0; x<lista.length; x++){
				  	// Se lista[x] contiene un punto, non è un join
				  	if(lista[x].indexOf('.') > -1){
				  		var splitted = lista[x].split('.');
				  		var node_id = splitted[0];
				  		var property = splitted[1];
				  		var node_schema = schemas[node_id];
				  		try { var next_id = lista[x+1].split('.')[0]; }
				  		catch(err){ var next_id = node_id; }
				  		attrs.push([]);
						for(var y=0; y<node_schema.length; y++){
							if(node_schema[y].name == property){            				
								attrs[attrs_pos][y] = true;
								break;
							}
							else {
								if(attrs[attrs_pos][y] == true){
									// non modifica			    
								}
								else if(attrs[attrs_pos].length <= y){
									attrs[attrs_pos].push(false);
									continue;			        	
								}
							}         		  
						}			
						// Se ho terminato di ciclare la lista
						if(x==lista.length-1){ attrs = [].concat.apply([], attrs); }
						// Se è l'ultimo elemento di un nodo	
						if(next_id != node_id){ attrs_pos += 1; x_pos = 0; }
						//if(x_pos==node_schema.length-1 || ){ attrs_pos += 1; x_pos = 0; }	  						  		
						else { x_pos += 1; }                        
				  	}
				  	else {					
					  schemas_loop:
					  for(var y=0; y<schemas.length; y++){

						if(schemas[y].name == lista[x]){            				
							attrs[y] = true;          				
							attrs[y] = true;
							schemas[y] = false;						
							break schemas_loop;
						}
						else {
							if(attrs[y] == true){
								// non modifica			    
							}
							else if(attrs.length <= y){
								attrs.push(false);
								continue;			        	
							}
						}					   
					  }
				  }
				} 							         
            }
        }       		
    }
    return attrs;
}

	/*
	 *  Save Graph
	 */
/*************************************************
 *                  SAVE GRAPH
 *************************************************/
$scope.save = function(saveDefault) {
    var json = window.cy.json();
    json.workflow_name = $scope.workflow.name;
    json.created_at = $scope.workflow.created_at;
    json.updated_at = $scope.workflow.updated_at;
    var nodes = [];
	var element = {};
	var settings = {}; 
    var toReview = [];
	if(json.elements.hasOwnProperty('nodes')){
		for(var x=0; x<json.elements.nodes.length; x++){
			var data = json.elements.nodes[x].data;      
			var conditions = [];  
			var settings_obj = {};
			var idx = getNodeIDXById(data.id);
			
			if(data.object === 'source') {
				var category = $scope.selectedSourceCategories[data.pos];
				var type = $scope.selectedSourceTypes[data.pos];
				var attrs = $scope.schemaPropertiesSelected[idx];				
				if(category != undefined && type != undefined) {
					conditions = [
							  {
								 "attribute":"category",
								 "operator":"=",
								 "value": category.name
							  },
							  {
								 "attribute":"type",
								 "operator":"=",
								 "value": type.name
							  }
						   ];	
				}
				else {
                    alertsManager.clearAlerts();			
                    alertsManager.addAlert('Category and Type must be filled in ' + data.name, 'alert-danger');
                    $scope.showCustomAlert = true;
                    return;					
                }	
				// Converto gli attributi selezionati sull'interfaccia
				// in una lista di stringhe, contenente i nomi degli attributi
				var attributes = [];
				if(attrs != undefined){
				    for(var y=0; y<attrs.length; y++){
    				    if(attrs[y] == true){
    				    	if(y<data.schema.m2m_data_schema.length){
                                attributes.push(data.schema.m2m_data_schema[y].name);    				    		
    				    	}
					    }
				    }
                }	
								
				json.elements.nodes[x].data.conditions = conditions;				
				json.elements.nodes[x].data.attributes = attributes;
			}
			else if(data.object === 'destination') {
				var category = $scope.selectedDestinationCategories[data.pos];
				var type = $scope.selectedDestinationTypes[data.pos];
				if(category != undefined && type != undefined) {
					conditions = [
							  {
								 "attribute":"category",
								 "operator":"=",
								 "value": category.name
							  },
							  {
								 "attribute":"type",
								 "operator":"=",
								 "value": type.name
							  }
						   ];
				 }
				 json.elements.nodes[x].data.conditions = conditions;			
			}
			else if(data.object === 'filter') {							
				conditions = $scope.filterConditions[data.pos];							
				var attrs = $scope.schemaPropertiesSelected[idx];
				// Se le condizioni sono legate in AND	
				if($scope.filterConditionsLogicOperator[data.pos] == 'AND'){					    
				    json.elements.nodes[x].data.conditions = conditions;
				    json.elements.nodes[x].data.orconditions = [];				    	   	
                }
				// Se le condizioni sono legate in OR	
				else if($scope.filterConditionsLogicOperator[data.pos] == 'OR'){
				    json.elements.nodes[x].data.orconditions = conditions;
				    json.elements.nodes[x].data.conditions = [];	   	
                }
                // Altrimenti ho condizioni vuote
                else {
				    json.elements.nodes[x].data.conditions = conditions;
				    json.elements.nodes[x].data.orconditions = conditions;
                } 
				var attributes = [];
				try {
				    for(var y=0; y<attrs.length; y++){
					    if(attrs[y] == true){
						    attributes.push(data.schema.m2m_data_schema[y].name);
					    }
				    }
				} catch(error){
					// attrs è vuoto
				}	                
                json.elements.nodes[x].data.attributes = attributes;               	
			}
			else if(data.object === 'cull_time') {
				settings = $scope.culltimeSettings[data.pos];
				var attrs = $scope.schemaPropertiesSelected[idx];
				var attributes = [];
				if(data.schema != undefined){
					if(attrs != undefined) {
						for(var y=0; y<attrs.length; y++){
							if(attrs[y] == true){
								attributes.push(data.schema.m2m_data_schema[y].name);
							}
						}	
					}
				}					
				json.elements.nodes[x].data.attributes = attributes;
				if(settings.start_date != undefined && settings.end_date != undefined && 
				   settings.start_time != undefined && settings.end_time != undefined) {
					var start_time = settings.start_date + 'T' + settings.start_time + ':00';
					var end_time = settings.end_date + 'T' + settings.end_time + ':00';				
					settings_obj = {
							 "numerator": settings.numerator,
							 "denominator": settings.denominator,
							 "time_data_name": settings.time_data_name,
							 "start_time": start_time,
							 "end_time": end_time,
							 "time_interval": settings.time_interval,
							 "time_unit": settings.time_unit
						   };
					json.elements.nodes[x].data.settings = settings_obj;					   
			   }
			   else {
					settings_obj = {
							 "numerator": settings.numerator,
							 "denominator": settings.denominator,
							 "time_data_name": settings.time_data_name,
							 "start_time": '2000/01/01T00:00:00',
							 "end_time": '2100/01/01T00:00:00',
							 "time_interval": settings.time_interval,
							 "time_unit": settings.time_unit
						   };
					json.elements.nodes[x].data.settings = settings_obj;					   			   
			   }			
			}
			else if(data.object === 'cull_space') {
				settings = $scope.cullspaceSettings[data.pos];
				settings_obj = {
						 "numerator": settings.numerator,
						 "denominator": settings.denominator,
						 "lat_data_name": settings.lat_data_name,
						 "long_data_name": settings.long_data_name,
						 "west": settings.west,
						 "south": settings.south,
						 "east": settings.east,
						 "north": settings.north,
						 "lat_interval": settings.lat_interval,
						 "long_interval": settings.long_interval
					   };
				json.elements.nodes[x].data.settings = settings_obj;
				var attrs = $scope.schemaPropertiesSelected[idx];
				var attributes = [];
				for(var y=0; y<attrs.length; y++){
					if(attrs[y] == true){
						attributes.push(data.schema.m2m_data_schema[y].name);
					}
				}					
				json.elements.nodes[x].data.attributes = attributes;								
			}	
			else if(data.object === 'aggregate') {
				settings = $scope.aggregateSettings[data.pos];
				if(settings.time_unit != undefined) {
					settings.time_unit = settings.time_unit.hasOwnProperty('name') ? settings.time_unit.name : settings.time_unit;
				}			
				settings_obj = {
					     //"aggregate_attribute" : $scope.selectedAggregateAttribute[data.pos].name,
					     //"aggregate_data_name" : settings.aggregate_data_name,
					     "aggregate_data_name" : $scope.selectedAggregateAttribute[data.pos].name,
						 "time_data_name": settings.time_data_name,
						 "start_time": settings.start_time,
						 "end_time": settings.end_time,
						 "time_interval": settings.time_interval,
						 "time_unit": settings.time_unit,
						 "lat_data_name": settings.lat_data_name,
						 "long_data_name": settings.long_data_name,
						 "west": settings.west,
						 "south": settings.south,
						 "east": settings.east,
						 "north": settings.north,
						 "lat_interval": settings.lat_interval,
						 "long_interval": settings.long_interval
					  };
				json.elements.nodes[x].data.settings = settings_obj;						
			}				
			else if(data.object === 'triggerEvent') {
				 var triggerOnConditions = $scope.triggerEventOnConditions[data.pos];
				 var triggerOffConditions = $scope.triggerEventOffConditions[data.pos];
				 var triggerOnSettings = $scope.triggerOnSettings[data.pos];
				 var triggerOffSettings = $scope.triggerOffSettings[data.pos];
				 var triggerOn = {"conditions":[], "trigger_interval":0};	
				 var triggerOff = {"conditions":[], "trigger_interval":0};	
				 // Controllo di non avere condizioni non valide
				 for(var elem of triggerOnConditions){
					if(elem.attribute == undefined ||
					   elem.operator == undefined){	// elem.value == undefined			
						toReview.push({'id' : data.id, 'name' : data.name});
						window.cy.$("node[id='"+data.id+"']").style('border-color', '#d9534f').select();
					}				
				 };
				 for(var elem of triggerOffConditions){
					if(elem.attribute == undefined ||
					   elem.operator == undefined){
						toReview.push({'id' : data.id, 'name' : data.name});
						window.cy.$("node[id='"+data.id+"']").style('border-color', '#d9534f').select();
					}				
				 };				 					 
				 if(triggerOnSettings.hasOwnProperty('trigger_condition')) {
					  triggerOn.trigger_condition = triggerOnSettings.trigger_condition;	
				 }
				 if(triggerOnSettings.hasOwnProperty('trigger_interval')) {
					  triggerOn.trigger_interval = triggerOnSettings.trigger_interval;				 
				 }
				 if(triggerOffSettings.hasOwnProperty('trigger_condition')) {
					  triggerOff.trigger_interval = triggerOffSettings.trigger_interval;
					  triggerOff.trigger_condition = triggerOffSettings.trigger_condition;	
				 }
				 if(triggerOffSettings.hasOwnProperty('trigger_interval')) {
					  triggerOn.trigger_interval = triggerOnSettings.trigger_interval;				 
				 }					 
				 // Se le condizioni ON sono legate in AND	
				 if($scope.triggerONConditionsLogicOperator[data.pos] == 'AND'){
				     triggerOn.conditions = triggerOnConditions;	
				     triggerOn.orconditions = [];		   	
                 }
				 // Se le condizioni sono legate in OR	
				 else if($scope.triggerONConditionsLogicOperator[data.pos] == 'OR'){
				     triggerOn.conditions = [];	
				     triggerOn.orconditions = triggerOnConditions;		   	
                 }
                 // Altrimenti ho condizioni vuote
                 else {
				     triggerOn.conditions = [];	
				     triggerOn.orconditions = [];	
                 }
				 // Se le condizioni OFF sono legate in AND	
				 if($scope.triggerOFFConditionsLogicOperator[data.pos] == 'AND'){
				     triggerOff.conditions = triggerOffConditions;	
				     triggerOff.orconditions = [];		   	
                 }
				 // Se le condizioni sono legate in OR	
				 else if($scope.triggerOFFConditionsLogicOperator[data.pos] == 'OR'){
				     triggerOff.conditions = [];	
				     triggerOff.orconditions = triggerOffConditions;		   	
                 }
                 // Altrimenti ho condizioni vuote
                 else {
				     triggerOff.conditions = [];	
				     triggerOff.orconditions = [];	
                 }                   				 		 			 			 
				 
				 json.elements.nodes[x].data.triggerOn = triggerOn;
				 json.elements.nodes[x].data.triggerOff = triggerOff;	
				 var attrs = $scope.schemaPropertiesSelected[idx];
				 var attributes = [];
				 try {
					 if(attrs != undefined){
						 for(var y=0; y<attrs.length; y++){
							 if(attrs[y] == true){
								 attributes.push(data.schema.m2m_data_schema[y].name);
							 }
						 }
					 }
				 }	
				 catch(error){}			 				 
				 json.elements.nodes[x].data.attributes = attributes;				 
			}
			else if(data.object === 'triggerAction') {
				var event = '';
				if(data.event_state === 'on') {				
					try {
						event = $scope.triggerActionOnEvents[data.pos].event;
					}
					catch(e){
						event = '';
					}			
				}
				else {
					try {
						event = $scope.triggerActionOffEvents[data.pos].event;
					}
					catch(e){
						event = '';
					}					
				}
				json.elements.nodes[x].data.event = event;
				json.elements.nodes[x].data.event_state = data.event_state;
			}
			else if(data.object === 'join') {
				var join_ids = $scope.joinlines[data.pos];
                json.elements.nodes[x].data.join_ids = join_ids;
         
					attributes = [];
					// BYPASS, crea una struttura circolare e non riesce a salvare
					// elimino i dati coinvolti nell'errore
					delete json.elements.nodes[x].data.connected_schemas;
					delete json.elements.nodes[x].data.data;	                                               
                var idx = getNodeIDXById(json.elements.nodes[x].data.id);
                if(json.elements.nodes[x].data.hasOwnProperty('schema')){
					for(var y=0; y<json.elements.nodes[x].data.schema.m2m_data_schema.length; y++){
						json.elements.nodes[x].data.schema.m2m_data_schema[y].selected = $scope.schemaPropertiesSelected[idx][y];
					}
			    }
				json.elements.nodes[x].data.attributes = attributes;                				
			}	
			else if(data.object === 'csv_join') {
				var join_ids = $scope.joinlines[data.pos];
                json.elements.nodes[x].data.join_ids = join_ids;               
				attributes = [];
				delete json.elements.nodes[x].data.data;                                              
                var idx = getNodeIDXById(json.elements.nodes[x].data.id);
                if(json.elements.nodes[x].data.hasOwnProperty('schema')){
					for(var y=0; y<json.elements.nodes[x].data.schema.m2m_data_schema.length; y++){
						json.elements.nodes[x].data.schema.m2m_data_schema[y].selected = $scope.schemaPropertiesSelected[idx][y];
					}
			    }
				json.elements.nodes[x].data.attributes = attributes;                				
				json.elements.nodes[x].data.delimiter = $scope.csv_delimiter[data.pos];                				
			}
			else if(data.object == 'transform'){
				var html = $("#appendOnRender_"+data.id).children();
				var string = html.prop('outerHTML');
				json.elements.nodes[x].data.virtualColumns = string;
			}																      
		};   
	}    		  
    if($scope.workflow.isDefault == true){
		if(saveDefault == true){
			return json;
		}				
		$scope.showSaveDefaultWorkflow = true;
	}
	else {
		saveWorkflow(json);
	}

};

function getConditionPos(pos, condition){
	for(var x=0; x<$scope.filterConditions[pos].length; x++){
		var cond = $scope.filterConditions[pos][x];
		if(condition.attribute === cond.attribute &&
		   condition.value === cond.value &&
		   condition.operator === cond.operator){
		
			return x;
			   
		}	
	}
}

$scope.joinBeforeNode = function(p_node){
	var toReturn = false;
	var predecessors = window.cy.$("#"+p_node.data.id).predecessors();
	predecessors.forEach(function(elem){
		if(elem.data().target == undefined){ 
			if(elem.data().object == 'join' || elem.data().object == 'csv_join'){
			    toReturn = true;	
			}
		}                								
	});	
	return toReturn;
};

function saveWorkflow(json){
		workflowService.saveWorkflow($scope.workflow.id, json).then(
		  function(response){
			  // Alert
			  alertsManager.clearAlerts();
			  $scope.$root.$broadcast('updateCustomAlert', {show:true});

			  // Devo aggiornare l'id del workflow
			  var data = response.content.workflowData;
			  //var ele = data.cy.elements;
			  $scope.workflow.id = data.id;
			  $scope.workflow.updated_at = data.updated_at;          			  				  
			  alertsManager.addAlert('Saved', 'alert-success');
			  // Remove Alerts
			  $timeout(function() {
				  alertsManager.clearAlerts();
				  $scope.$root.$broadcast('updateCustomAlert', {show:false});
			  }, 2000);
		  },
		  function(error){
			  if(error.content.code == "WF100"){
				  alertsManager.addAlert(error.content.message, 'alert-danger');
			  }
			  else if(error.content.code == "ERR100"){
				  alertsManager.addAlert(error.content.message, 'alert-danger');
			  }
		  });	
}

  $scope.closeTab = function() {
    $scope.$root.$broadcast('showTab', {show:false});
    $scope.state_tab = "canvas";
    console.log($scope.state_tab);
  }
  
  $scope.closeEdgeTab = function() {
    $scope.$root.$broadcast('showEdgeTab', {show:false});
  }
  
/*************************************************
 *            SAVE DEFAULT WORKFLOW
 *************************************************/
$scope.createSaveDefaultWorkflow = function() {
	var json = $scope.save(true);
	var workflow = {"name":$scope.workflow.rename, "workflow":json};
	// Call API
	// Save default workflow
	workflowService.createSaveDefaultWorkflow(workflow).then(
	  function(response){						
		$scope.$root.$broadcast('workflowSaved', {workflow:response.content.workflowData});
	},
	function(error){

	});
};  

// Quando clicca sul pulsante back, nasconde il DIV e mostra il workspace
$scope.hideSaveDefaultWorkflow = function() {
	$scope.showSaveDefaultWorkflow = false;  
};

/*************************************************
 *            SET SCHEMA
 *************************************************/
 
$scope.getSchemaByType = function(sensor_type){
    for(var x=0; x<$scope.schemas.length; x++){
        if($scope.schemas[x].sensor_type == sensor_type){
            return $scope.schemas[x];			
        }	
    }
};

$scope.setNodeSchema = function(node, type){
	var sensor_type = false;
	var old_schema = false;
	var joinInDataflow = false;
	// Conservo il vecchio schema su una variabile apposita
	if(node.data.hasOwnProperty('schema')){
        old_schema = node.data.schema;		
    }
	if(type == 'rain'){
	    sensor_type = 'rain';
	}
	else if(type == 'twitter'){
        sensor_type = 'twitter';
    }
    else if(type == 'rainfall'){
	    sensor_type = 'rainfall';
	}
    else if(type == 'traffic'){
	    sensor_type = 'traffic';
	}   
	if(sensor_type != false){
		// Se ho un Join sul dataflow, avviso che è necessario 
		// fare reset delle proprietà prima di cambiare il Type
		var successors = window.cy.$("node[id='"+node.data.id+"']").successors();
		for(var x=0; x<successors.length; x++){
		    if(successors[x].data().object == 'join'){
			    joinInDataflow = true;	
			    break;
			}				
	    }
		if(joinInDataflow){
			alertsManager.clearAlerts();			
			alertsManager.addAlert("Operation not admitted. A Join operator is declared on dataflow. \n"+
			                       "Please remove it.", 'alert-danger');
			$scope.showCustomAlert = true;					  		  						
			console.log($scope.selectedSourceTypes[node.data.pos]);
			console.log(node.data.schema.sensor_type);
			var obj = {name : cloneObject(node.data.schema.sensor_type)};
			$scope.selectedSourceTypes[node.data.pos] = obj;
			return;
		}
		else {
			$scope.schemaPropertiesSelected[node.idx] = [];
			var schema = cloneObject($scope.getSchemaByType(sensor_type)); 
			schema.source_id = node.data.id;   

			// Inizialmente tutte le proprietà nel tab schema vengono settate
			for(var x=0; x<schema.m2m_data_schema.length; x++){
				$scope.schemaPropertiesSelected[node.idx].push(true);
			}
			if(node.data.object == 'source'){
				schema.m2m_data_schema.forEach(function(elem){
					elem.selected = true;
					elem.enabled = true;				
				});			
			}
			window.cy.$("node[id='"+node.data.id+"']").data('schema', schema);
			var successors = window.cy.$("node[id='"+node.data.id+"']").successors();
			// Propago lo schema
			propagateSchema(node, successors, sensor_type, node.idx, old_schema);
		}
	}		
};

$scope.isSourcePropertyDisabled = function(pnode, prop_index){
	var toReview = [];
    // Controllo che il nodo precedente abbia deselezionato la proprietà
    // dello schema
    var id = pnode.data.id;
    var predecessors = window.cy.$("node[id='"+pnode.data.id+"']").incomers();
    var source = predecessors.source();   
    try {     
        var source_idx = getNodeIDXById(source.id());
    } catch(error) {
	    return false;	
	}
    var node_prop = $scope.schemaPropertiesSelected[pnode.idx][prop_index];
    var source_prop = $scope.schemaPropertiesSelected[source_idx][prop_index];
    // Se il nodo precedente ha deselezionato e l'attuale ha checcato
    if(source_prop == false){
        $scope.schemaPropertiesSelected[pnode.idx][prop_index] = false;         
    }
    return source_prop;
};

$scope.isSourcePropertyDisabledByID = function(id, prop){  
    try {     
        var source_idx = getNodeIDXById(id);
    } catch(error) {
	    return false;	
	}
	var source_data = window.cy.$("node[id='"+id+"']").data();	
	var prop_index = null;
	// forse non c'era il bisogno di controllare se ha schema
	if(source_data.hasOwnProperty('schema')){
		for(var x=0; x<source_data.schema.m2m_data_schema.length; x++){
			 if(source_data.schema.m2m_data_schema[x].name == prop.name){
				 prop_index = x;
				 break;	 
			 }
		}	
	}
    var source_prop = $scope.schemaPropertiesSelected[source_idx][prop_index];
    return $scope.schemaPropertiesSelected[source_idx][prop_index];
};

// Questa funzione ottiene una lista di schemas, e ritorna una 
// lista di schema che hanno sensor_type == sensor_type
$scope.getSchemasArrayByType = function(sensor_type, schemas){
    var toReturn = [];	
    for(var x=0; x<schemas.length; x++){
        if(schemas[x].sensor_type == sensor_type){
		    toReturn.push(schemas[x]);	
		}		
	}
	return toReturn;
};

// Questa funzione filtra il sample in modo
// da ritornare solo le proprietà che risultano TRUE in
// $scope.schemaPropertiesSelected
$scope.getSelectedSample = function(node){
    var sample = node.data.schema.sample[0]; 
    var toReturn = {};
    $scope.sample_keys =  [];
    var idx = getNodeIDXById(node.data.id);
    if($scope.schemaPropertiesSelected[idx] != undefined){
		for(var x=0; x<$scope.schemaPropertiesSelected[idx].length; x++) {
			if($scope.schemaPropertiesSelected[idx][x]==true){
				var key = node.data.schema.m2m_data_schema[x];
				toReturn[key.name] = sample[key.name];                        			
				$scope.sample_keys.push(key.name);
			}		
		}
		// Ordino le proprietà dell'oggetto toReturn
		var keys = Object.keys(toReturn);
		keys.sort();    
    }
    
    return toReturn;
};

// Riordina per name le proprietà dello schema
$scope.sortSchemaObj = function(obj){
    if(obj != undefined){
	    obj.sort(function(a, b) {
            if (a.name < b.name)
                return -1;
            if (a.name > b.name)
                return 1;
            return 0;
	    });	
	    return obj;
    }	    	
};

$scope.sortSchemaObj2 = function(schema){
	if(schema != null){ // Se lo schema è settato
		var obj = schema.m2m_data_schema;
		if(schema.sensor_type == 'joined'){	
			var sorted = [];				
			schema.connected_nodes.forEach(function(elem){
				for(var x=0; x<obj.length; x++){
					if(obj[x].id == elem){
						sorted.push(obj[x]);
					}
					else if(obj[x].id == undefined && sorted.indexOf(obj[x])==-1){
						sorted.push(obj[x]);
					}
				}		
			});	
			return sorted;
		}
		else {
			obj.sort(function(a, b) {
				if (a.name < b.name)
					return -1;
				if (a.name > b.name)
					return 1;
				return 0;
			});	
			return obj;
		}	
    }    	
};

$scope.filterSample = function(node){
    var sample = cloneObject(node.data.schema.sample);    
    var filteredSample = new Array(sample.length);    
    var lista = [];
    var idx = getNodeIDXById(node.data.id);
    // Ottengo lista attributi da tenere in considerazione
    for(var x=0; x<$scope.schemaPropertiesSelected[idx].length; x++) {
        if($scope.schemaPropertiesSelected[idx][x]==true){
        	lista.push(node.data.schema.m2m_data_schema[x]);                           		
        }		
    }
    // Devo filtrare i sample    
    for(var x=0; x<sample.length; x++){
		//var obj = {};		
        lista.forEach(function(l){
            filteredSample[x][l.name] = cloneObject(sample[x][l.name]); 
        });		
    }; 
    
    return filteredSample;
}; 

function filtra(sample, lista){
	var filteredSample = [];
    for(var x=0; x<sample.length; x++){
		var obj = {};		
        lista.forEach(function(l){
            obj[l.name] = sample[x][l.name]; 
        });		
        filteredSample.push(obj);
    };	
    return filteredSample;
}

//
// Questa funzione setta una proprietà dello schema 
// enabled:true|false , selected:true|false
//
function setEnabledSelected(source_property, target_data, value){
	var toReturn = 0;
	if(target_data.hasOwnProperty('schemas')){
		// Ottengo il nodo precedente
		var incomers = cy.$('#'+target_data.id).incomers();
		var previous_data = null;
		incomers.forEach(function(elem){
			if(elem.data().target == undefined){
				previous_data = elem.data();
			}
		});		
		
		// Accedo allo schema il cui sensor_type è quello del nodo precedente
		for(var x=0; x<target_data.schemas.length; x++){
			if(previous_data.hasOwnProperty('schema')){
				if(previous_data.schema.sensor_type == target_data.schemas[x].sensor_type){
					for(var y=0; y<target_data.schemas[x].m2m_data_schema.length; y++){
						var property = target_data.schemas[x].m2m_data_schema[y];
						if(property.id == source_property.id && 
						   property.name == source_property.name &&		 
						   property.type == source_property.type){			
							target_data.schemas[x].m2m_data_schema[y].enabled = value;
							target_data.schemas[x].m2m_data_schema[y].selected = value;
							window.cy.$("node[id='"+target_data.id+"']").data('schema', target_data.schema);
							toReturn=y;
							break;	
						}
					}							
				}
			}
			else if(previous_data.hasOwnProperty('schemas')){
				for(var y=0; y<previous_data.schemas.length; y++){
					if(previous_data.schemas[y].sensor_type == target_data.schemas[x].sensor_type){
						for(var z=0; z<target_data.schemas[x].m2m_data_schema.length; z++){
							var property = target_data.schemas[x].m2m_data_schema[z];
							if(property.id == source_property.id && 
							   property.name == source_property.name &&		 
							   property.type == source_property.type){			
								target_data.schemas[x].m2m_data_schema[z].enabled = value;
								target_data.schemas[x].m2m_data_schema[z].selected = value;
								window.cy.$("node[id='"+target_data.id+"']").data('schema', target_data.schema);
								toReturn=z;
								break;	
							}
						}						
					}
				}				
			}
		}
	}
	else {
		for(var x=0; x<target_data.schema.m2m_data_schema.length; x++){
			var property = target_data.schema.m2m_data_schema[x];
			if(property.id == source_property.id && 
			   property.name == source_property.name &&		 
			   property.type == source_property.type){			
				target_data.schema.m2m_data_schema[x].enabled = value;
				target_data.schema.m2m_data_schema[x].selected = value;
				window.cy.$("node[id='"+target_data.id+"']").data('schema', target_data.schema);
				toReturn=x;
				break;	
			}
		}
	}
    return toReturn;
}

// Se ho inizialmente settato unchecked una proprietà ed ho legato dei
// nodi, quando riseleziono la proprietà, questa viene riattivata anche sui
// nodi successivi e posta checked.
$scope.propagateSourceProperty = function(source_id, source_idx, index, p_property){
    // Se la proprietà con indice INDEX è checked    
    // diventa unchecked, 
    // mentre se la proprietà è unchecked diventa checked
    // e devo propagare le modifica su tutti i nodi a seguire

    var toReview = [];    
    var successors = window.cy.$("node[id='"+source_id+"']").successors();   
    var source_data = window.cy.$("node[id='"+source_id+"']").data();
    var join_index = 0;
    successors.forEach(function(ele){
	    if(ele.target() == undefined){            
			var target_data = ele.data();    
            var target_idx = getNodeIDXById(ele.id());
            // Se deseleziono
            if($scope.schemaPropertiesSelected[source_idx][index] == false){
				// Se si tratta di un JOIN
				if(target_data.object == 'join' || target_data.object == 'csv_join'){
					// Se la proprietà è interessata in un JOIN
					// sollevo eccezione				    
				    if(inJoin(p_property, source_data.id, target_data.join_schema)){	
						showSingleError("The property '"+p_property.name+"' is involved in Join, you have to manually reset this join property");				
						// Non posso fare return, perchè uso un loop forEach
						// Setto la proprietà com'era prima del click sul checkbox
						join_index = setEnabledSelected(source_data.schema.m2m_data_schema[index], target_data, true);
						$scope.schemaPropertiesSelected[source_idx][index] = true;
					}
					else{
						join_index = setEnabledSelected(source_data.schema.m2m_data_schema[index], target_data, false);
						// Se il target_node è un JOIN deseleziono la proprietà
						// nella posizione corretta.
						$scope.schemaPropertiesSelected[target_idx][join_index] = false;						
					}
				}
				else {
					$scope.schemaPropertiesSelected[target_idx][index] = false;
					setEnabledSelected(source_data.schema.m2m_data_schema[index], target_data, false);
				}				
				// Se viene deselezionata una proprietà ed ho una condizione settata,
				// sollevo eccezione
				if(target_data.object == 'filter'){
					var target_pos = getNodePositionById(target_data.id);
					var property = target_data.schema.m2m_data_schema[index];
					if($scope.filterConditions[target_pos].length > 0){
						for(var prop of $scope.filterConditions[target_pos]){
							if(prop.attribute.name == property.name){
								toReview.push({'id' : target_data.id, 'name' : target_data.name});
							}
						}		
					}
				} 
				if(target_data.object == 'triggerEvent'){
					var target_pos = getNodePositionById(target_data.id);
					var property = target_data.schema.m2m_data_schema[index];
					if($scope.triggerEventOnConditions[target_pos].length > 0){
						for(var prop of $scope.triggerEventOnConditions[target_pos]){
							if(prop.attribute.name == property.name){
								toReview.push({'id' : target_data.id, 'name' : target_data.name + ' ON'});
							}
						}	
					}
					if($scope.triggerEventOffConditions[target_pos].length > 0){
						for(var prop of $scope.triggerEventOffConditions[target_pos]){
							if(prop.attribute.name == property.name){
								toReview.push({'id' : target_data.id, 'name' : target_data.name + ' OFF'});
							}
						}
					}						
				} 				                
            }
            // Se seleziono
            else {				                                               
				join_index = setEnabledSelected(source_data.schema.m2m_data_schema[index], target_data, true);
				if(target_data.object != 'join' && target_data.object != 'csv_join'){
					console.log("Target idx: " + target_idx);
					console.log($scope.schemaPropertiesSelected[target_idx])					
                    $scope.schemaPropertiesSelected[target_idx][index] = true;					
				}
                else {
					// Se il target_node è un JOIN seleziono la proprietà
					// nella posizione corretta.
					console.log("Target idx: " + target_idx);
					console.log($scope.schemaPropertiesSelected[target_idx])
                    $scope.schemaPropertiesSelected[target_idx][join_index] = true;
				}                            			 
            }            
        }	
    });
    // controllo anche le condizioni del nodo attuale
	if($scope.schemaPropertiesSelected[source_idx][index] == false){
		// Se viene deselezionata una proprietà ed ho una condizione settata,
		// sollevo eccezione
		if(source_data.object == 'filter'){
			var source_pos = getNodePositionById(source_data.id);
			var property = source_data.schema.m2m_data_schema[index];
			if($scope.filterConditions[source_pos].length > 0){
				for(var prop of $scope.filterConditions[source_pos]){
					if(prop.attribute.name == property.name){
						toReview.push({'id' : source_data.id, 'name' : source_data.name});
					}
				}		
			}
		} 
		if(source_data.object == 'triggerEvent'){
			var source_pos = getNodePositionById(source_data.id);
			var property = source_data.schema.m2m_data_schema[index];
			if($scope.triggerEventOnConditions[source_pos].length > 0){
				for(var prop of $scope.triggerEventOnConditions[source_pos]){
					if(prop.attribute.name == property.name){
						toReview.push({'id' : source_data.id, 'name' : source_data.name + ' ON'});
					}
				}	
			}
			if($scope.triggerEventOffConditions[source_pos].length > 0){
				for(var prop of $scope.triggerEventOffConditions[source_pos]){
					if(prop.attribute.name == property.name){
						toReview.push({'id' : source_data.id, 'name' : source_data.name + ' OFF'});
					}
				}
			}						
		} 			                
	}    
    if(toReview.length > 0){
		var msg1 = '<b>Property disabled</b>.<br/>The following operators have some conditions in conflict,' + 
				  'remove or modify them:';
		var msg2 = '<ul>' + toReview.map(function(elem){ return '<li>'+elem.name+'</li>'; }) + '</ul>';
						  
		showErrorAlert(toReview,msg1+msg2.split(',').join(''), false);		
	}  	
};

/*
*  Serve a mostrare i bottoni a seconda che lo schema
*  sia settato o meno 
*/
$scope.isButtonDisabled = function(node){
    if(node.data.hasOwnProperty('schema')){
	    if(node.data.schema != null){
			return false;
		}	
		return true;
	}
	return true;
};

/*
* Serve a stabilire se mostrare il tab schema
*/ 
$scope.canShowSchemaTab = function(node){
    if(node.data.hasOwnProperty('schema')){
        if(node.data.schema != null){
		   return true;
		}		
		return false;
	}
	return false;
};
/*************************************************
 *        SET SELECTED SCHEMA PROPERTIES
 *************************************************/

function propagateSchema(source_node, eles, sensor_type, node_idx, old_schema){	    
	var triggerEventFound = false;
    // Operatori le cui condizioni vanno modificate in seguito al cambio di schema
    var toReview = [];
    var canApplySchema = true;
    // Devo percorrere il grafo e settare lo schema per ogni nodo a cui è collegata la sorgente.
    eles.forEach(function( ele ){
		if(ele.target() == undefined){
		    // si tratta di un nodo, se ho un oggetto si tratta di un arco, così 
		    // cytoscape gestiste la funzione successors()
		    var p_node = getItemData(ele.id()); 
		    var schema = {};
		    if(sensor_type == 'joined'){				
				schema = source_node.data.schema;
			} else {    
                schema = $.extend(true, {}, source_node.data.schema); 
                schema.source_id = source_node.data.id;
			}  
                               
            $scope.schemaPropertiesSelected[p_node.idx] = cloneObject($scope.schemaPropertiesSelected[node_idx]);
            if(p_node.data.object == 'filter') {
                var f_count = 0;
                if($scope.filterConditions[p_node.data.pos].length > 0){
					// Ciclo le condizioni del filtro  
					var pos = 0;          
					for(var conditions of $scope.filterConditions[p_node.data.pos]){
						for(var property of schema.m2m_data_schema){ 
							// Se la condizione si trova tra le proprietà del nuovo schema                       
							try{
								if(conditions.attribute.name == property.name &&
								   conditions.attribute.type == property.type){
									f_count += 1;
								} 
							}catch(error){
							    $scope.filterConditions[p_node.data.pos].splice(pos, 1);
							}  
							pos += 1;                 
						}		
					}
				}
                if(f_count == 0 && $scope.filterConditions[p_node.data.pos].length > 0){
                    toReview.push({'id' : p_node.data.id, 'name' : p_node.data.name});       
                }                      	                                   
            }
            if(p_node.data.object == 'source'){
                canApplySchema = true;
            }            
            if(p_node.data.object == 'triggerAction'){
                canApplySchema = triggerEventFound == false ? true : false;
            }
            if(p_node.data.object == 'triggerEvent') {
				triggerEventFound = true;
                var ton_count = 0;
                var toff_count = 0;
                if($scope.triggerEventOnConditions[p_node.data.pos].length > 0){
					for(var conditions of $scope.triggerEventOnConditions[p_node.data.pos]){
						if(conditions.hasOwnProperty('attribute')){
							for(var property of schema.m2m_data_schema){ 
								try{
									// Se la condizione si trova tra le proprietà del nuovo schema                       
									if(conditions.attribute.name == property.name &&
									   conditions.attribute.type == property.type){
										ton_count += 1;
									}   
								} catch(error){
									$scope.triggerEventOnConditions[p_node.data.pos].splice(pos, 1)
							    }                 
							}
						}						
					}
				}
				if($scope.triggerEventOffConditions[p_node.data.pos].length > 0){
					for(var conditions of $scope.triggerEventOffConditions[p_node.data.pos]){
						if(conditions.hasOwnProperty('attribute')){
							for(var property of schema.m2m_data_schema){
								try{ 						
									// Se la condizione si trova tra le proprietà del nuovo schema                       
									if(conditions.attribute.name == property.name &&
									   conditions.attribute.type == property.type){
										toff_count += 1;
									}  
								} catch(error){
									$scope.triggerEventOffConditions[p_node.data.pos].splice(pos, 1)
								}                  
							}
						}						
					}
				} 
                if(ton_count == 0 && $scope.triggerEventOnConditions[p_node.data.pos].length > 0){
                    toReview.push({'id' : p_node.data.id, 'name' : p_node.data.name + ' ON'});       
                }  
                if(toff_count == 0 && $scope.triggerEventOffConditions[p_node.data.pos].length > 0){
                    toReview.push({'id' : p_node.data.id, 'name' : p_node.data.name + ' OFF'});       
                }                                     	                                   
            } 
            if(canApplySchema == true){    
                var modifying_node = window.cy.$("node[id='"+p_node.data.id+"']");                
                if(modifying_node.data().hasOwnProperty('schemas')){
					// Se il nodo che sta propagando il nuovo schema ha modificato lo schema in uno nuovo
					var m_schemas = modifying_node.data().schemas;
					if(old_schema != false){
						// Cerco il primo schema che combacia e lo cambio
						var count = 0;
						// Potrei non sapere se il Destination ha già un schema settato
						if(m_schemas.length>0){
							for(var x=0; x<m_schemas.length; x++){							
								if(m_schemas[x].sensor_type == old_schema.sensor_type && count == 0){
									m_schemas[x] = schema;
									count += 1;							 	
								}							
							}	
						}
						else {
						    m_schemas.push(schema);	
						}											
					} 	
					else {
						m_schemas.push(schema);
					}
					window.cy.$("node[id='"+p_node.data.id+"']").data('schemas', m_schemas);			
                }
                else {				                     
                    window.cy.$("node[id='"+p_node.data.id+"']").data('schema', schema);
				}
            }
            // Se sono state registrate incompatibilità con il nuovo schema, sollevo errore            
            if(toReview.length > 0){   
				var msg1 = '<b>New schema applied</b>.<br/>The following operators have incompatible conditions with new schema,' + 
                          'remove or modify them:';
                var msg2 = '<ul>' + toReview.map(function(elem){ return '<li>'+elem.name+'</li>'; }) + '</ul>';
                          
				showErrorAlert(toReview, msg1+msg2.split(',').join(''), false);	                
                				 
            }            
        }
    });
} 

$scope.checkPropertyChecked = function(node, property){
	if($scope.inArray(node.data.schema.m2m_selected_properties, property) == -1){
	    return false;	
    }
    return true;
}
$scope.inArray = function(arr, obj){
    for(var x=0; x<arr.length; x++){
        if(isEquivalent(obj, arr[x])){
		    return x;	
        }	
    }	
    return -1;
}

function isEquivalent(a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}

$scope.setSchemaProperty = function(node, property){
	
    var schema = cloneObject($scope.getSchemaByType(node.data.schema.sensor_type));    	    
	schema.m2m_selected_properties = node.data.schema.m2m_selected_properties;
	var index = $scope.inArray(schema.m2m_selected_properties, property);
	
	if(index == -1){
	    schema.m2m_selected_properties.push(property);
    }
    else {		
		schema.m2m_selected_properties.splice(index, 1);
    }
	var old_schema = window.cy.$("node[id='"+node.data.id+"']").data().schema;
	schema.source_id = old_schema.source_id;
	window.cy.$("node[id='"+node.data.id+"']").data('schema', schema);
};

/*************************************************
 *            GET OBJECT CLONE BY VALUE
 *************************************************/
function cloneObject(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
 
    var temp = obj.constructor(); // give temp the original obj's constructor
    for (var key in obj) {
        temp[key] = cloneObject(obj[key]);
    }
 
    return temp;
}
/*************************************************
 *      Chiude gli alert mostrati a video
 *************************************************/
$scope.closeAlerts = function(){
    alertsManager.clearAlerts();	
};

$scope.renderHTML = function(str){
    return $sce.trustAsHtml(str);	
};

/*********************************************************
***              GESTIONE OPERATORE JOIN               ***
*********************************************************/

// Quando seleziono/deseleziono una proprietà sul nodo Join
// assegno selected:true|false alla proprietà e propago lo schema
$scope.propagateJoinProperty = function(join_id, join_idx, property_name, index){	
	var property =  window.cy.$("node[id='"+join_id+"']").data().schema.m2m_data_schema[index];
	//var joinSchema = window.cy.$("node[id='"+join_id+"']").data().schema;
	//joinSchema.m2m_data_schema.reverse();
    var successors = window.cy.$("node[id='"+join_id+"']").successors();   
    var source_data = window.cy.$("node[id='"+join_id+"']").data();	
    var hasJoin = false;    
    // Se tra i successors ho un altro join, 
    // sollevo errore, perchè prima devo 
    successors.every(function(ele){
	    if(ele.target() == undefined){  
			if(ele.data().object == 'join'){ hasJoin = true; return false;} 
			if(ele.data().object == 'csv_join'){ hasJoin = true; return false;} 
		}		    	
	});
	if(hasJoin==false){
		successors.forEach(function(ele){
			if(ele.target() == undefined){            
				var target_data = ele.data(); 			  
				var target_idx = getNodeIDXById(ele.id());
				if(target_data.hasOwnProperty('schemas')){
				    for(var x=0; x<target_data.schemas.length; x++){
						// Accedo allo schema associato
					    if(target_data.schemas[x].sensor_type == source_data.schema.sensor_type){
							target_data.schemas[x].m2m_data_schema[index].selected = $scope.schemaPropertiesSelected[join_idx][index];
						}
						break;
					}
				}
				else {	
					//"<b class='red-color'>S1</b>.time"	
					if(property_name.indexOf('red-color')!=-1){
					    var splitted = property_name.split('</b>.');
					    var split_sourceName = splitted[0].split('>')[1];
					    var split_propName = splitted[1];
					    for(var x=0; x<target_data.schema.m2m_data_schema.length; x++){
						    if(target_data.schema.m2m_data_schema[x].node_name == split_sourceName && 
						       target_data.schema.m2m_data_schema[x].name == split_propName){
								target_data.schema.m2m_data_schema[x].selected = cloneObject($scope.schemaPropertiesSelected[join_idx][index]);
								break;
							}	
						}
					}
					else {
					     // <b class='blue-color'>altitude</b>
					     var splitted = property_name.split("'>");
					     var split_propName = splitted[1].split('</b>')[0];
							for(var x=0; x<target_data.schema.m2m_data_schema.length; x++){
								if(target_data.schema.m2m_data_schema[x].id == undefined && 
								   target_data.schema.m2m_data_schema[x].name == split_propName){
									target_data.schema.m2m_data_schema[x].selected = cloneObject($scope.schemaPropertiesSelected[join_idx][index]);
									break;
								}	
							}					     
					}
					window.cy.$("node[id='"+target_data.id+"']").data('schema', target_data.schema);								             
				}
			}
		});    
    }
    else {
		showSingleError("Another Join is involved in your dataflow.");
	}
};

function convertAllJoinPropertiesToAttrs(){   
    var lista = [];
    $scope.allJoinProperties[$scope.node.data.pos].forEach(function(property){
        if(property.value.indexOf('blue-color') != -1){
            var splitted = property.value.split("<b class=\'blue-color\'>");
            splitted = splitted[1].split("</b>")		    	
            splitted = splitted[0];
		}	
		else if(property.value.indexOf('red-color')!=-1) {
			var splitted = property.value.split("<b class=\'red-color\'>")
			splitted = splitted[1].split("</b>.");
			splitted[0] = splitted[0].toLowerCase();
			splitted = splitted.join('.');		    	
		}
		lista.push(splitted);
    });
    
    var new_schema = [];    
    var position = 0;
    lista.forEach(function(elem){
        for(var x=0; x<$scope.node.data.schema.m2m_data_schema.length; x++){
            var property = $scope.node.data.schema.m2m_data_schema[x];
            if(elem.indexOf('.')!=-1){
                var splitted = elem.split('.');
                var node_id = splitted[0];
                var prop_name = splitted[1];
                if(prop_name == property.name && node_id == property.id){
					// Se la proprietà è definita in join_schema
					// non devo fare push
					// Se la proprietà non è selezionata
					// non devo fare push					
					if(!joinSchemaContains($scope.node.data.join_schema, property) &&
					    $scope.schemaPropertiesSelected[$scope.node.idx][position]==true){
                        new_schema.push(property);	                        	
                        position+=1;
                        break;						
                    }
                    position+=1;
                }				
			}		
            
			else if(elem == property.name){
				if(property.id != undefined){
					if(inJoin(property, property.id, $scope.node.data.join_schema)){
						delete property.id;			
						new_schema.push(property);   
						position+=1;               				
						break;
					}
			    }
			    else {
			    	new_schema.push(property);
			    	position+=1;
			    	break;
			    }			    
            }             
           
        }
    });
    return new_schema;
}

// Non usa $scope.node, ma gli viene passato un node
function convertAllJoinPropertiesToAttrs2(node){   
    var lista = [];
    if($scope.allJoinProperties[node.data.pos] == undefined){ 
        if(node.data.object == 'csv_join'){
            $scope.setJoinPropertiesCSV(node.data);
        }
        else {
        	setJoinProperties2(node, node.data.join_schema);			
        }        
    }    
    $scope.allJoinProperties[node.data.pos].forEach(function(property){
        if(property.value.indexOf('blue-color') != -1){
            var splitted = property.value.split("<b class=\'blue-color\'>");
            splitted = splitted[1].split("</b>")		    	
            splitted = splitted[0];
		}	
		else if(property.value.indexOf('red-color')!=-1) {
			var splitted = property.value.split("<b class=\'red-color\'>")
			splitted = splitted[1].split("</b>.");
			splitted[0] = splitted[0].toLowerCase();
			splitted = splitted.join('.');		    	
		}
		lista.push(splitted);
    });
    
    var new_schema = [];    
    var position = 0;
    if(node.data.join_schema != undefined){
		lista.forEach(function(elem){
			for(var x=0; x<node.data.schema.m2m_data_schema.length; x++){
				var property = node.data.schema.m2m_data_schema[x];
				if(elem.indexOf('.')!=-1){
					var splitted = elem.split('.');
					var node_id = splitted[0];
					var prop_name = splitted[1];
					if(prop_name == property.name && node_id == property.id){
						// Se la proprietà è definita in join_schema
						// non devo fare push
						// Se la proprietà non è selezionata
						// non devo fare push					
						if(!joinSchemaContains(node.data.join_schema, property)){
							property.selected = $scope.schemaPropertiesSelected[getNodeIDXById(node.data.id)][position];										    
							new_schema.push(property);	                        	
							position+=1;
							break;						
						}
						position+=1;
					}				
				}		
				else if(elem == property.name){
					property.selected = $scope.schemaPropertiesSelected[getNodeIDXById(node.data.id)][position];
					if(property.id != undefined){
						if(inJoin(property, property.id, node.data.join_schema)){
							delete property.id;								
							new_schema.push(property);   
							position+=1;               				
							break;
						}
					}
					else {
						new_schema.push(property);
						position+=1;
						break;
					}			    
				}           
			}
		});
    }
    else {
        new_schema = node.data.schema.m2m_data_schema;		
	}
    return new_schema;
}

function inJoin(property, id, join_schema){
	var toReturn = false;
    for(var x=0; x<join_schema.length; x++){
        if(join_schema[x].property == property.name &&
           join_schema[x].ids.indexOf(id) != -1){
			   toReturn = true;
			   break;
	    }		
    }
    return toReturn;
}

function joinSchemaContains(join_schema, property){
	var toReturn = false;
    for(var x=0; x<join_schema.length; x++){
        var el = join_schema[x];
        if(el.property == property.name && el.ids.indexOf(property.id)!=-1){
            toReturn = true;
            break;			
		}
    }   	
    return toReturn;
}

function hasJoinProperties(node){    
	var toReturn = false;	
	if(node.data.object=='join'){	
		setJoinProperties2(node, node.data.join_schema);	
		for(var x=0; x<$scope.allJoinProperties[node.data.pos].length; x++){
			if($scope.allJoinProperties[node.data.pos][x].value.indexOf('blue-color') != -1){
				toReturn = true;
				break;
			}		
		}
	}    
    return toReturn;
}

function setPropertySelected(connected_nodes, other_node_idx, applyToSchPropSelect){
	var new_schema = [];   
	if(applyToSchPropSelect==true){
		connected_nodes.forEach(function(id){
			var conn = window.cy.$("node[id='"+id+"']");
			if(conn.data().target == undefined){
				var idx = getNodeIDXById(conn.id());
				var conn_data = conn.data();
				for(var x=0; x<conn_data.schema.m2m_data_schema.length; x++){
					conn_data.schema.m2m_data_schema[x].selected = $scope.schemaPropertiesSelected[idx][x];				
					conn_data.schema.m2m_data_schema[x].enabled = $scope.schemaPropertiesSelected[idx][x];
					if(id.indexOf('s')!=-1){ // Se la proprietà appartiene ad una sorgente
					    conn_data.schema.m2m_data_schema[x].id = conn_data.id;		
					    conn_data.schema.m2m_data_schema[x].node_name = window.cy.$("node[id='"+conn_data.id+"']").data().name;			
					}
					try{
					    $scope.schemaPropertiesSelected[other_node_idx].push($scope.schemaPropertiesSelected[idx][x]);						
					}catch(err){						
						$scope.schemaPropertiesSelected.push([]);
						$scope.schemaPropertiesSelected[other_node_idx].push($scope.schemaPropertiesSelected[idx][x]);
					}
				}
				window.cy.$("node[id='"+id+"']").data('schema', conn_data.schema);            
			}		
		});
	}
	else {
		connected_nodes.forEach(function(id){
			var conn = window.cy.$("node[id='"+id+"']");
			if(conn.data().target == undefined){
				var idx = getNodeIDXById(conn.id());
				var conn_data = conn.data();
				for(var x=0; x<conn_data.schema.m2m_data_schema.length; x++){
					conn_data.schema.m2m_data_schema[x].selected = $scope.schemaPropertiesSelected[idx][x];				
					conn_data.schema.m2m_data_schema[x].enabled = $scope.schemaPropertiesSelected[idx][x];	
					if(id.indexOf('s')!=-1){ // Se la proprietà appartiene ad una sorgente			
					    conn_data.schema.m2m_data_schema[x].id = conn_data.id;							
					    conn_data.schema.m2m_data_schema[x].node_name = window.cy.$("node[id='"+conn_data.id+"']").data().name;
					}
				}
				if($scope.node.data.object == 'csv_join'){
					var connected_schemas = cloneObject($scope.node.data.connected_schemas);
				    connected_schemas.forEach(function(elem){
                        if(elem.id == id){
						    elem.schema = conn_data.schema;	
						}						
					});	
					window.cy.$("node[id='"+$scope.node.data.id+"']").data('connected_schemas', connected_schemas); 
				}
				window.cy.$("node[id='"+id+"']").data('schema', conn_data.schema);            
			}		
		});		
    }		
}

function getConnectedNodes(pnode){    
    var incoming_edges = window.cy.$("node[id='"+pnode.data.id+"']").incomers();
    var toReturn = [];    
    incoming_edges.forEach(function(elem){
        if(elem.data().object != undefined){			
            toReturn.push(elem.id());			
		}		
    });
    return toReturn;
};

function getConnectedNodes2(node_data){    
    var incoming_edges = window.cy.$("node[id='"+node_data.id+"']").incomers();
    var toReturn = [];    
    incoming_edges.forEach(function(elem){
        if(elem.data().object != undefined){			
            toReturn.push(elem.id());			
		}		
    });
    return toReturn;
};


$scope.getConnectedNodes = function(pnode){    
    var incoming_edges = window.cy.$("node[id='"+pnode.data.id+"']").incomers();
    var toReturn = [];    
    incoming_edges.forEach(function(elem){
        if(elem.data().object != undefined){			
            toReturn.push(elem.id());			
		}		
    });
    $scope.node.data.connected_nodes = toReturn;
}

function getConnectedNodesSchema(pnode){
    var incoming_edges = window.cy.$("node[id='"+pnode.data.id+"']").incomers();
    var toReturn = [];    
    incoming_edges.forEach(function(elem){		
        if(elem.data().object != undefined){
			if(elem.data().schema != undefined){ toReturn.push(elem.data()); } 		
		}		
    });
    return toReturn;	
}

function getConnectedNodesSchema2(node_data){
    var incoming_edges = window.cy.$("node[id='"+node_data.id+"']").incomers();
    var toReturn = [];    
    incoming_edges.forEach(function(elem){		
        if(elem.data().object != undefined){
			if(elem.data().schema != undefined){ toReturn.push(elem.data()); }	
		}		
    });
    return toReturn;	
}

$scope.getConnectedNodesSchema = function(pnode){
    var incoming_edges = window.cy.$("node[id='"+pnode.data.id+"']").incomers();
    var toReturn = [];    
    incoming_edges.forEach(function(elem){		
        if(elem.data().object != undefined){
			if(elem.data().schema != undefined){ toReturn.push(elem.data()); } 
		}		
    });
    $scope.node.data.connected_schemas = toReturn;
};

// Collega due DIV con una linea
$scope.enableDrawing = function(id, index, canDraw){	
	if(canDraw){
		var html_node_id = "#"+id+"_"+index;	
		$(html_node_id).css("font-weight","Bold");
		var node_data = window.cy.$("node[id='"+$scope.node.data.id+"']").data();
		if(window.drawlines.length == 2){
			window.drawlines = [];
			window.drawlines.push(html_node_id);        
		}    
		if(window.drawlines.length < 2){
			// Se il nodo non è già in lista
			if(window.drawlines.indexOf(html_node_id) == -1){			
				window.drawlines.push(html_node_id);            		  
			}
			// Se il nodo è in lista, lo deseleziono, ovvero
			// ho ricliccato su un elemento selezionato
			else if(window.drawlines.indexOf(html_node_id) != -1){			
				window.drawlines = [];
				$(html_node_id).css("font-weight","normal");
			}        
			if(window.drawlines.length == 2){	
				// Controllo che le proprietà cliccate appartengano a sorgenti
				// disposte in maniera adiacente
				// e successivamente che i due elementi selezionati siano dello 
				// stesso tipo				   			    
				var toSplit1 = window.drawlines[0];
				var toSplit2 = window.drawlines[1];
				
				var parent1 = $(toSplit1).parent();			
				var parent2 = $(toSplit2).parent();			
				
				var splitted1_step1 = toSplit1.split('_');			    
				var splitted1_step2 = splitted1_step1[0].split('#');
				var index1 = splitted1_step1[1];
				var splitted2_step1 = toSplit2.split('_');			    
				var splitted2_step2 = splitted2_step1[0].split('#');								
				var index2 = splitted2_step1[1];			
				var first_node = window.cy.$("node[id='"+ splitted1_step2[1]+"']");
				var first_node_data = first_node.data();
				var first_node_schema = first_node_data.schema;
				var second_node = window.cy.$("node[id='"+ splitted2_step2[1]+"']");
				var second_node_data = second_node.data();
				var second_node_schema = second_node_data.schema;						
				var prop1_schema = first_node_schema.m2m_data_schema[index1];
				var prop2_schema = second_node_schema.m2m_data_schema[index2];
				
				var nodes = $scope.node.data.connected_nodes; 
				var pos1 = nodes.indexOf(first_node.id());
				var pos2 = nodes.indexOf(second_node.id());
				var old_schema = node_data.schema;
				// Se le proprietà non sono adiacenti sollevo errore
				if(Math.abs(pos1-pos2)!=1){
					$(toSplit1).css("font-weight","normal");
					$(toSplit2).css("font-weight","normal");				
					window.drawlines = [];
					showSingleError("Only adjacent properties can be joined.");				
				}			
				// Se sto tentando di collegare due proprietà appartenenti 
				// alla stessa sorgente, sollevo errore
				if(id == splitted1_step2[1]){
					$(toSplit1).css("font-weight","normal");
					$(toSplit2).css("font-weight","normal");				
					window.drawlines = [];
					showSingleError("Connection on properties of the same Source is not admitted.");				
					return;						
				}
				// Se i type delle due proprietà non sono compatibili sollevo errore
				if(prop1_schema.type != prop2_schema.type){
					showSingleError("Property type not compatible.\n" + prop1_schema.type + " - " + prop2_schema.type);
					$(toSplit1).css("font-weight","normal");
					$(toSplit2).css("font-weight","normal");								
					window.drawlines = [];				
					return;	
				}															
				
				$scope.joinlines[node_data.pos].push(window.drawlines);
				window.cy.$("node[id='"+$scope.node.data.id+"']").data('join_ids', $scope.joinlines);					
				var connection = new $.connect(window.drawlines[0], window.drawlines[1], {container : '#join-table'+$scope.node.data.pos});
				$scope.connections[$scope.node.data.pos].push(connection);            
				// Creo lo schema            
				var join_property = $(window.drawlines[0]).text().trim().split('(')[0].trim();
				var join_property2 = $(window.drawlines[1]).text().trim().split('(')[0].trim();
				// Inserisco nel nodo join, l'elenco di join_properties
				var join_node = window.cy.$("node[id='"+$scope.node.data.id+"']");
				var join_data = join_node.data();
				var join_schema = join_data.join_schema || [];
				// Se ho più di 2 nodi, ed ho già settato una proprietà tra gli id
				// s1 - s2, e voglio fare join della stessa sul nodo s3
				// Se la proprietà è settata, faccio push dell'id
				// altrimenti creo una nuova entry in join_schema   
				var added = false;
				join_schema.forEach(function(elem){
					if(elem.property == join_property){
						// Faccio push su ids
						// come faccio a sapere quale id (nodo1 o nodo2), devo inserire?
						if(elem.ids.indexOf(first_node_data.id) == -1){
							elem.ids.push(first_node_data.id);
						}
						else if(elem.ids.indexOf(second_node_data.id) == -1){
							elem.ids.push(second_node_data.id);
						}
						added = true;
					}				
				});				     
				if(added==false){
					join_schema.push({'property':join_property, 'property2':join_property2, 'ids':[first_node.id(), second_node.id()]});
				}
				window.cy.$("node[id='"+$scope.node.data.id+"']").data(join_schema, join_schema);
				// Elimino da schemaPropertiesSelected le proprietà interessate dal Join,
				// al loro posto inserisco la proprietà risultante
				var delete_pos1 = getSchemaPropertySelectedPosition($scope.node, first_node, join_property);
				var delete_pos2 = getSchemaPropertySelectedPosition($scope.node, second_node, join_property);
				var insert_pos = getSchemaJoinedPropertyPosition(join_property);                       
				$scope.schemaPropertiesSelected[$scope.node.idx].splice(delete_pos1, 1);
				$scope.schemaPropertiesSelected[$scope.node.idx].splice(delete_pos2, 1);             
				$scope.schemaPropertiesSelected[$scope.node.idx].splice(insert_pos, 0, true);
				
				// Se il join è collegato ad altri operatori, devo propagare il nuovo schema               
				var fake_node = cloneObject($scope.node);                 
				$scope.setJoinProperties(join_schema);            
				fake_node.data.schema.sensor_type = 'joined';
				fake_node.data.connected_nodes = getConnectedNodes(fake_node);
				fake_node.data.schema.connected_nodes = getConnectedNodes(fake_node);
				//fake_node.data.schema.m2m_data_schema = convertAllJoinPropertiesToAttrs2(fake_node);                              
				fake_node.data.schema.m2m_data_schema[insert_pos] = {'name':prop1_schema.name, 'type':prop1_schema.type, 'enabled':true, 'selected':true};
				fake_node.data.schema.m2m_data_schema = $scope.sortSchemaObj2(fake_node.data.schema);                                          
					   
				var successors = window.cy.$("node[id='"+$scope.node.data.id+"']").successors();            
				propagateSchema(fake_node, successors, 'joined', $scope.node.idx, old_schema);                                                            
				
				// Le properties che non partecipano al join vanno visualizzate come
				// source_id.property
				// Tolgo il bold dal testo delle due proprietà appena collegate      
				$(toSplit1).css("font-weight","normal");
				$(toSplit2).css("font-weight","normal");
			}       
		}
    }
};

// Collega due DIV con una linea, quando è impiegato un CSV
$scope.enableDrawingCSV = function(id, index, canDraw){	
	if(canDraw){
		var html_node_id = "#"+id+"_"+index;	
		$(html_node_id).css("font-weight","Bold");
		var node_data = window.cy.$("node[id='"+$scope.node.data.id+"']").data();
		if(window.drawlines.length == 2){
			window.drawlines = [];
			window.drawlines.push(html_node_id);        
		}    
		if(window.drawlines.length < 2){
			// Se il nodo non è già in lista
			if(window.drawlines.indexOf(html_node_id) == -1){			
				window.drawlines.push(html_node_id);            		  
			}
			// Se il nodo è in lista, lo deseleziono, ovvero
			// ho ricliccato su un elemento selezionato
			else if(window.drawlines.indexOf(html_node_id) != -1){			
				window.drawlines = [];
				$(html_node_id).css("font-weight","normal");
			}        
			if(window.drawlines.length == 2){	
				// Controllo che le proprietà cliccate appartengano a sorgenti
				// disposte in maniera adiacente
				// e successivamente che i due elementi selezionati siano dello 
				// stesso tipo				   			    
				var toSplit1 = window.drawlines[0];
				var toSplit2 = window.drawlines[1];
				
				var parent1 = $(toSplit1).parent();			
				var parent2 = $(toSplit2).parent();			
				
				var splitted1_step1 = toSplit1.split('_');			    
				var splitted1_step2 = splitted1_step1[0].split('#');
				var index1 = splitted1_step1[1];
				var splitted2_step1 = toSplit2.split('_');			    
				var splitted2_step2 = splitted2_step1[0].split('#');								
				var index2 = splitted2_step1[1];			
				var first_node;	
				var first_node_data;	
				var first_node_schema;
				var second_node;
				var second_node_data;
				var second_node_schema;
				if(splitted1_step2[1].length < 8){ // è la sorgente
					first_node = window.cy.$("node[id='"+ splitted1_step2[1]+"']");
					first_node_data = first_node.data();
					first_node_schema = first_node_data.schema;
					$scope.node.data.connected_schemas.forEach(function(elem){
						if(elem.object == 'csv_file'){
							second_node_data = elem;
						}
					});
					second_node_schema = second_node_data.schema;					
				}
				else {
					first_node = window.cy.$("node[id='"+ splitted2_step2[1]+"']");
					first_node_data = first_node.data();
					first_node_schema = first_node_data.schema;
					$scope.node.data.connected_schemas.forEach(function(elem){
						if(elem.object == 'csv_file'){
							second_node_data = elem;
						}
					});
					second_node_schema = second_node_data.schema;					
				}										
				var prop1_schema = first_node_schema.m2m_data_schema[index1];
				var prop2_schema = second_node_schema.m2m_data_schema[index2];
				
				var nodes = [first_node_data.id, second_node_data.id]; // ["s1", "s2", "etc"]
				var pos1 = 0;
				var pos2 = 1;
				var old_schema = node_data.schema;
				// Se le proprietà non sono adiacenti sollevo errore
				if(Math.abs(pos1-pos2)!=1){
					$(toSplit1).css("font-weight","normal");
					$(toSplit2).css("font-weight","normal");				
					window.drawlines = [];
					showSingleError("Only adjacent properties can be joined.");				
				}			
				// Se sto tentando di collegare due proprietà appartenenti 
				// alla stessa sorgente, sollevo errore
				if(id == splitted1_step2[1]){
					$(toSplit1).css("font-weight","normal");
					$(toSplit2).css("font-weight","normal");				
					window.drawlines = [];
					showSingleError("Connection on properties of the same Source is not admitted.");				
					return;						
				}
				// Se i type delle due proprietà non sono compatibili sollevo errore
				if(prop1_schema.type != prop2_schema.type){
					showSingleError("Property type not compatible.\n" + prop1_schema.type + " - " + prop2_schema.type);
					$(toSplit1).css("font-weight","normal");
					$(toSplit2).css("font-weight","normal");								
					window.drawlines = [];				
					return;	
				}															
				
				$scope.joinlines[node_data.pos].push(window.drawlines);
				window.cy.$("node[id='"+$scope.node.data.id+"']").data('join_ids', $scope.joinlines);					
				var connection = new $.connect(window.drawlines[0], window.drawlines[1], {container : '#join-table'+$scope.node.data.pos});
				$scope.connections[$scope.node.data.pos].push(connection);            
				// Creo lo schema            
				var join_property = $(window.drawlines[0]).text().trim().split('(')[0].trim();
				var join_property2 = $(window.drawlines[1]).text().trim().split('(')[0].trim();
				// Inserisco nel nodo join, l'elenco di join_properties
				var join_node = window.cy.$("node[id='"+$scope.node.data.id+"']");
				var join_data = join_node.data();
				var join_schema = join_data.join_schema || [];
				// Se ho più di 2 nodi, ed ho già settato una proprietà tra gli id
				// s1 - s2, e voglio fare join della stessa sul nodo s3
				// Se la proprietà è settata, faccio push dell'id
				// altrimenti creo una nuova entry in join_schema   
				var added = false;
				join_schema.forEach(function(elem){
					if(elem.property == join_property){
						// Faccio push su ids
						// come faccio a sapere quale id (nodo1 o nodo2), devo inserire?
						if(elem.ids.indexOf(first_node_data.id) == -1){
							elem.ids.push(first_node_data.id);
						}
						else if(elem.ids.indexOf(second_node_data.id) == -1){
							elem.ids.push(second_node_data.id);
						}
						added = true;
					}				
				});				     
				if(added==false){
					join_schema.push({'property':join_property, 'property2': join_property2, 'ids':[first_node_data.id, second_node_data.id]});
				}
				window.cy.$("node[id='"+$scope.node.data.id+"']").data(join_schema, join_schema);
				// Elimino da schemaPropertiesSelected le proprietà interessate dal Join,
				// al loro posto inserisco la proprietà risultante
				var insert_pos = 0;
				var delete_pos1 = 0;
				var delete_pos2 = 0;
				for(var y=0; y<$scope.node.data.schema.m2m_data_schema.length; y++){
					if($scope.node.data.schema.m2m_data_schema[y].name == join_property &&
					   $scope.node.data.schema.m2m_data_schema[y].id == first_node_data.id){
						break;
					}        
					delete_pos1+=1; 					
				}				
				for(var y=0; y<$scope.node.data.schema.m2m_data_schema.length; y++){
					if($scope.node.data.schema.m2m_data_schema[y].name == join_property &&
					   $scope.node.data.schema.m2m_data_schema[y].id == second_node_data.id){
						break;
					}        
					delete_pos2+=1; 					
				}								
				for(var y=0; y<first_node_schema.m2m_data_schema.length; y++){  
					var property = first_node_schema.m2m_data_schema[y];            
					if(isJoinProperty(first_node_data.id, property.name)){
						if(property.name == join_property){
							 break;
						}                    
						insert_pos += 1;
					}
				}                      
				$scope.schemaPropertiesSelected[$scope.node.idx].splice(delete_pos1, 1);
				$scope.schemaPropertiesSelected[$scope.node.idx].splice(delete_pos2-1, 1);             
				$scope.schemaPropertiesSelected[$scope.node.idx].splice(insert_pos, 0, true);
				
				// Se il join è collegato ad altri operatori, devo propagare il nuovo schema               
				var fake_node = cloneObject($scope.node);                 				            
				fake_node.data.schema.sensor_type = 'joined';
				fake_node.data.connected_nodes = getConnectedNodes(fake_node);
				fake_node.data.connected_nodes.push(second_node_data.id);
				fake_node.data.schema.connected_nodes = getConnectedNodes(fake_node);
				fake_node.data.schema.connected_nodes.push(second_node_data.id);			                             				
				fake_node.data.schema.m2m_data_schema.splice(delete_pos1, 1);
				fake_node.data.schema.m2m_data_schema.splice(delete_pos2-1, 1);
                //fake_node.data.schema.m2m_data_schema[insert_pos] = {'name':prop1_schema.name, 'type':prop1_schema.type, 'enabled':true, 'selected':true};				
                fake_node.data.schema.m2m_data_schema.splice(insert_pos, 0, {'name':prop1_schema.name, 'type':prop1_schema.type, 'enabled':true, 'selected':true});				
				fake_node.data.schema.m2m_data_schema = $scope.sortSchemaObj2(fake_node.data.schema);                                          
				$scope.setJoinPropertiesCSV(fake_node.data);
				window.cy.$("node[id='"+$scope.node.data.id+"']").data('schema', fake_node.data.schema);
				var successors = window.cy.$("node[id='"+$scope.node.data.id+"']").successors();            
				propagateSchema(fake_node, successors, 'joined', $scope.node.idx, old_schema);                                                            
				
				// Le properties che non partecipano al join vanno visualizzate come
				// source_id.property
				// Tolgo il bold dal testo delle due proprietà appena collegate      
				$(toSplit1).css("font-weight","normal");
				$(toSplit2).css("font-weight","normal");
			}       
		}
    }
};

function getSchemaPropertySelectedPosition(join_node, node, property){		
    var property_pos = 0;
    var sum = 0;
    var node_position;
    try {
		node_position = join_node.data.connected_nodes.indexOf(node.id());    
	} catch(err){
	  // Può trattarsi di un CSV JOIN e non avere connected_nodes
	  node_position = 0;	
	}       
    // Se il nodo non è il primo nella lista
    if(node_position > 0){
		var ids_to_check = join_node.data.connected_nodes.slice(0, node_position);		
		ids_to_check.forEach(function(id){
            var schema = window.cy.$("node[id='"+id+"']").data().schema;		 
            sum += schema.m2m_data_schema.length;
        });                    
    }
    for(var x=0; x<node.data().schema.m2m_data_schema.length; x++){        
        if(node.data().schema.m2m_data_schema[x].name == property){
            break;
		}        
        property_pos+=1;        		
    };	    
    return sum + property_pos;
}

function getSchemaJoinedPropertyPosition(p_property){    
    var sources = window.cy.$("node[id='"+$scope.node.data.id+"']").incomers();
    var obj = [];
    var property_pos = 0;
    outer_loop:
    for(var x=0; x<sources.length; x++){	
        var elem_data = sources[x].data();
        // Se è un nodo, e non un arco
        if(elem_data.object != undefined){
            var schema_properties = elem_data.schema.m2m_data_schema; 
            inner_loop:
            for(var y=0; y<schema_properties.length; y++){  
				var property = schema_properties[y];            
				if(isJoinProperty(elem_data.id, property.name)){
                    if(property.name == p_property){
                         break outer_loop;
                    }                    
                    property_pos += 1;
				}
				//property_pos += 1;
            }            
        }
    }
    return property_pos;     
}

function getCoords(elem, width, height) {
            function pX(elem) {
				return elem.position().left;
            }
            function pY(elem) {
                return elem.position().top;
            }
            var px = pX(elem);
            var cen = px + (width / 2);
            var py = pY(elem);
            var mid = py + (height / 2);
            var ret = {
                tl: [px, py],
                tr: [px + width, py],
                tc: [cen, py],
                rm: [px + width, mid],
                bc: [cen, py + height],
                lm: [px, mid]
            };
            return ret;
}

function calculateCoords(elem1, elem2) {
    try {
	var A = {}, B = {}, C = {};
    A.width = elem1.width();
    A.height = elem1.height();
    A.coords = getCoords(elem1, A.width, A.height);
    B.width = elem2.width();
    B.height = elem2.height();
    B.coords = getCoords(elem2, B.width, B.height);
    C.sc = A.coords.rm;
    C.ec = B.coords.lm;
    if ((B.coords.tl[0] - A.coords.tl[0] <= 90) && (B.coords.tl[0] - A.coords.tl[0] >= -90)) {
        if (B.coords.tc[1] <= A.coords.tc[1]) {
            C.sc = A.coords.tc;
            C.ec = B.coords.bc;
        } else {
            C.sc = A.coords.bc;
            C.ec = B.coords.tc;
        }
    } else if (B.coords.tc[0] <= A.coords.tc[0]) {
            C.sc = A.coords.lm;
            C.ec = B.coords.rm;
    }
    C.angleA = Math.atan((C.sc[1] - C.ec[1]) / (C.sc[0] - C.ec[0])) * 180 / Math.PI;
    if (B.coords.tc[0] <= A.coords.tc[0]) {
        C.angleA -= 180;
    }
    C.width = Math.sqrt(Math.pow(C.ec[0] - C.sc[0], 2) + Math.pow(C.ec[1] - C.sc[1], 2));

    return [A, B, C];
    }
    catch(err){
		return [false, false, false];
	}
}

$scope.drawLines = function(){ drawLines(); }

// Faccio l'unbinding di drawLines() per questioni di performance
var unbindDrawLines = $scope.$watch('drawLines', function () {    
  unbindDrawLines();
});

function drawLines(){	
    $timeout(function () { 	
	  var A = {};
	  var B = {};
	  var C = {};	
	  var html = "";	
	  //try {
	  var htmlElement = $('#join-table'+$scope.node.data.pos);
	  $('#join-table'+$scope.node.data.pos + ' .connector').remove();
	  var toDraw = $scope.connections[$scope.node.data.pos];
	  if(toDraw.length > 0){
		for(var x=0; x<toDraw.length; x++){
			var connect = toDraw[x];
			var el1 = connect.elem1.selector;
			var htmlEl1 = $(el1);        
			var el2 = connect.elem2.selector;
			var htmlEl2 = $(el2);
			var ABC = calculateCoords(htmlEl1, htmlEl2);
			if(ABC[0] == false){ return; }
			A = ABC[0];
			B = ABC[1];
			C = ABC[2];
			var baseHtml = $("<div class='connector join-table"+$scope.node.data.pos + "'><p class='left title'></p><p class='right title'></p></div>");
			
			baseHtml.css({
				position: 'absolute',
				width: '100px',
					   'border-bottom': '0.18em solid rgb(84, 70, 205)'
			});
			baseHtml.find('p').css({
				display: 'inline-block',
						 'margin-bottom': '-3px'
			});
			baseHtml.find('.left').css({
				float: 'left',
				padding: '0 10px'
			});
			baseHtml.find('.right').css({
				float: 'right',
				padding: '0 10px'
			});
					
			var topOffset = -5; //-20;
			if (A.coords.tc[0] > B.coords.tc[0]) {
				baseHtml.find('.title').css({
					'-webkit-transform': 'rotate(180deg)',
					'-ms-transform': 'rotate(180deg)',
					'transform': 'rotate(180deg)'
				});
			} else {
				baseHtml.find('.title').css({
					'-webkit-transform': 'rotate(0deg)',
					'-ms-transform': 'rotate(0deg)',
					'transform': 'rotate(0deg)'
				});
			}
			baseHtml.css({
				top: C.sc[1] + topOffset + 'px',
				left: C.sc[0] + 'px',
				width: C.width + 'px',
					'-webkit-transform': 'rotate(' + C.angleA + 'deg)',
					'-webkit-transform-origin': '0% 100%',
					'-ms-transform': 'rotate(' + C.angleA + 'deg)',
					'-ms-transform-origin': '0% 100%',
					'transform': 'rotate(' + C.angleA + 'deg)',
					'transform-origin': '0% 100%'
			});         
			html += baseHtml[0].outerHTML;	
		}    
      }
      else if(toDraw.length == 0 && $scope.joinlines[$scope.node.data.pos].length > 0){				
	    for(var x=0; x<$scope.joinlines[$scope.node.data.pos].length; x++){		  
		  var left = $scope.joinlines[$scope.node.data.pos][x][0];
		  var right = $scope.joinlines[$scope.node.data.pos][x][1];
		  var connection = new $.connect(left, right, {container : '#join-table'+x});			  
		  $scope.connections[$scope.node.data.pos].push(connection); 		  
	    }
	  }
      htmlElement.append(html);             
    }, 500);           
};

function drawLines2(node_data){	
    $timeout(function () { 	
	  var A = {};
	  var B = {};
	  var C = {};	
	  var html = "";	
	  //try {
	  var htmlElement = $('#join-table'+node_data.pos);
	  $('#join-table'+node_data.pos + ' .connector').remove();
	  var toDraw = $scope.connections[node_data.pos];
	  if(toDraw.length > 0){
		for(var x=0; x<toDraw.length; x++){
			var connect = toDraw[x];
			var el1 = connect.elem1.selector;
			var htmlEl1 = $(el1);        
			var el2 = connect.elem2.selector;
			var htmlEl2 = $(el2);
			var ABC = calculateCoords(htmlEl1, htmlEl2);
			if(ABC[0] == false){ return; }
			A = ABC[0];
			B = ABC[1];
			C = ABC[2];
			var baseHtml = $("<div class='connector join-table"+node_data.pos + "'><p class='left title'></p><p class='right title'></p></div>");
			
			baseHtml.css({
				position: 'absolute',
				width: '100px',
					   'border-bottom': '0.18em solid rgb(84, 70, 205)'
			});
			baseHtml.find('p').css({
				display: 'inline-block',
						 'margin-bottom': '-3px'
			});
			baseHtml.find('.left').css({
				float: 'left',
				padding: '0 10px'
			});
			baseHtml.find('.right').css({
				float: 'right',
				padding: '0 10px'
			});
					
			var topOffset = -5; //-20;
			if (A.coords.tc[0] > B.coords.tc[0]) {
				baseHtml.find('.title').css({
					'-webkit-transform': 'rotate(180deg)',
					'-ms-transform': 'rotate(180deg)',
					'transform': 'rotate(180deg)'
				});
			} else {
				baseHtml.find('.title').css({
					'-webkit-transform': 'rotate(0deg)',
					'-ms-transform': 'rotate(0deg)',
					'transform': 'rotate(0deg)'
				});
			}
			baseHtml.css({
				top: C.sc[1] + topOffset + 'px',
				left: C.sc[0] + 'px',
				width: C.width + 'px',
					'-webkit-transform': 'rotate(' + C.angleA + 'deg)',
					'-webkit-transform-origin': '0% 100%',
					'-ms-transform': 'rotate(' + C.angleA + 'deg)',
					'-ms-transform-origin': '0% 100%',
					'transform': 'rotate(' + C.angleA + 'deg)',
					'transform-origin': '0% 100%'
			});         
			html += baseHtml[0].outerHTML;	
		}    
      }
      else if(toDraw.length == 0 && $scope.joinlines[node_data.pos].length > 0){				
	    for(var x=0; x<$scope.joinlines[node_data.pos].length; x++){		  
		  var left = $scope.joinlines[node_data.pos][x][0];
		  var right = $scope.joinlines[node_data.pos][x][1];
		  var connection = new $.connect(left, right, {container : '#join-table'+x});			  
		  $scope.connections[node_data.pos].push(connection); 		  
	    }
	  }
      htmlElement.append(html); 
            
      //} catch(err){}
    }, 500);           
};

function isJoinProperty(key, property){
    var node = window.cy.$("node[id='"+$scope.node.data.id+"']");
    var join_schema = node.data().join_schema || [];
    var toReturn = false;
    join_schema.forEach(function(elem){        
        if(elem.ids.indexOf(key) != -1 &&
           elem.property == property){
        	toReturn = true;        	
        }
	});
	return toReturn;
};

function isJoinProperty2(node, key, property){
    var node = window.cy.$("node[id='"+node.data.id+"']");
    var join_schema = node.data().join_schema;
    var toReturn = false;
    join_schema.forEach(function(elem){        
        if(elem.ids.indexOf(key) != -1 &&
           elem.property == property){
        	toReturn = true;        	
        }
	});
	return toReturn;
};

function isJoinProperty3(node_data, key, property){
    var node = window.cy.$("node[id='"+node_data.id+"']");
    var join_schema = node_data.join_schema;
    var toReturn = [false, 0];
    var pos = 0;
    join_schema.forEach(function(elem){        
        if(elem.ids.indexOf(key) != -1 &&
           elem.property == property){
        	toReturn[0] = true; 
        	toReturn[1] = pos;       	
        }
        pos+=1;
	});
	return toReturn;
};

function ObjIndexOf(lista, obj){
    var toReturn = -1;
    for(var x=0; x<lista.length; x++){
        if(lista[x].value == obj.value &&
           lista[x].enabled == obj.enabled){
		    toReturn = 0;	   
		}	
    }
    return toReturn;	
}

// Setta un array di oggetti [{"s1":[properties]}, {"s2":[properties]}]
$scope.setJoinProperties = function(join_schema){    
    //var toReturn = [];
    $scope.allJoinProperties[$scope.node.data.pos] = [];
    var sources = window.cy.$("node[id='"+$scope.node.data.id+"']").incomers();
    var obj = [];
    var x_obj = {};
    sources.forEach(function(elem){
        var elem_data = elem.data();
        // Se è un nodo, e non un arco
        if(elem_data.object != undefined){
            var schema_properties = elem_data.schema.m2m_data_schema;   
            schema_properties.forEach(function(x){
				if(isJoinProperty(elem_data.id, x.name)){			
				   x_obj = {'value': "<b class='blue-color'>"+x.name+"</b>", 'enabled':x.enabled};
				   if(ObjIndexOf(obj, x_obj) == -1){
					    obj.unshift(x_obj);	
					}						
				}
                else{
                    try{
						x_obj = {'value': "<b class='red-color'>"+elem_data.name + "</b>." + x.name, 'enabled':x.enabled};
						obj.push(x_obj);                        
                    }
                    catch(err){}
                }
            });            
        }
    });
    $scope.allJoinProperties[$scope.node.data.pos] = obj;	    
};

function setJoinProperties2(node, join_schema){    
    //var toReturn = [];
    $scope.allJoinProperties[node.data.pos] = [];
    var sources = window.cy.$("node[id='"+node.data.id+"']").incomers();
    var obj = [];
    var x_obj = {};
    sources.forEach(function(elem){
        var elem_data = elem.data();
        // Se è un nodo, e non un arco
        if(elem_data.object != undefined){
            var schema_properties = elem_data.schema.m2m_data_schema;   
            schema_properties.forEach(function(x){
				if(isJoinProperty2(node, elem_data.id, x.name)){
				   x_obj = {'value': "<b class='blue-color'>"+x.name+"</b>", 'enabled':x.enabled};
				   if(ObjIndexOf(obj, x_obj) == -1){
					    obj.unshift(x_obj);	
					}				
				}
                else{
                    try{
						x_obj = {'value': "<b class='red-color'>"+elem_data.name + "</b>." + x.name, 'enabled':x.enabled};
						obj.push(x_obj);
                    }
                    catch(err){ 
                    }
                }
            });            
        }
    });
    $scope.allJoinProperties[node.data.pos] = obj;
};

$scope.setJoinPropertiesCSV = function(node_data){    
    $scope.allJoinProperties[$scope.node.data.pos] = [];
    var source;
    var source_id;
    var source_data;
    var csv_data;
    try{
		node_data.connected_nodes.forEach(function(elem){
			if(elem.indexOf('s')!=-1){
				source_id = elem;
			}		
		});
    } catch(err){
		node_data.connected_schemas.forEach(function(elem){
			if(elem.id.indexOf('s')!=-1){
				source_id = elem.id;
			}		
		});		
	}
	node_data.connected_schemas.forEach(function(elem){
        if(elem.object == 'csv_file'){ csv_data = elem; }		
	});
    source = window.cy.$("node[id='"+source_id+"']");
    source_data = source.data();
    var obj = [];
    var x_obj = {};   
	source_data.schema.m2m_data_schema.forEach(function(x){
		if(isJoinProperty(source_data.id, x.name)){			
		   x_obj = {'value': "<b class='blue-color'>"+x.name+"</b>", 'enabled':x.enabled};
		   if(ObjIndexOf(obj, x_obj) == -1){
				obj.unshift(x_obj);	
			}						
		}
		else{
			try{
				x_obj = {'value': "<b class='red-color'>"+source_data.name + "</b>." + x.name, 'enabled':x.enabled};
				obj.push(x_obj);                        
			}
			catch(err){}
		}
	});  
	if(csv_data != undefined){
		csv_data.schema.m2m_data_schema.forEach(function(x){
			if(isJoinProperty(csv_data.id, x.name)){			
			   x_obj = {'value': "<b class='blue-color'>"+x.name+"</b>", 'enabled':x.enabled};
			   if(ObjIndexOf(obj, x_obj) == -1){
					obj.unshift(x_obj);	
				}						
			}
			else{
				try{
					x_obj = {'value': "<b class='red-color'>"+csv_data.name + "</b>." + x.name, 'enabled':x.enabled};
					obj.push(x_obj);                        
				}
				catch(err){}
			}
		}); 
	}	          

    $scope.allJoinProperties[$scope.node.data.pos] = obj;	    
};

function getJoinTableHeader(){
	var nodes = $scope.getConnectedNodes($scope.node);
	var th = "";
	nodes.forEach(function(elem){
        th += "<th>" + elem + "</th>";		
    });
    return th;
}

function getJoinTableBody(){
    var body = "";
    body += "<td ng-repeat='val in node.data.connected_schemas'>";
    body += "<div ng-repeat='val_interno in val.schema.m2m_data_schema'";
    body += "style='max-width: 150px; height: 30px;' id='{{val.id}}_{{$index}}'";
    body += "ng-click='enableDrawing(val.id, $index)'>";
    body += "{{ val_interno.name }}" + "</div>";				    
    body += "</td>";   
    return body;
}

$scope.resetJoinLines = function(){	    
    $scope.connections[$scope.node.data.pos] = new Array();	
    $scope.node.data.join_schema = [];
    window.cy.$("node[id='"+$scope.node.data.id+"']").data('join_schema', []);
    $scope.joinlines[$scope.node.data.pos] = new Array();
    $scope.joinSchemaProperties[$scope.node.data.pos] = new Array();    
    var moreJoinInDataflow = false;    
	var successors = window.cy.$("node[id='"+$scope.node.data.id+"']").successors();
	// Controllo la presenza di altri Join sul dataflow, se si devo prima
	// cancellarli o farne un reset.
	for(var x=0; x<successors.length; x++){
		if(successors[x].data().object == 'join'){
			moreJoinInDataflow = true;	
			break;
		}			
		else if(successors[x].data().object == 'csv_join'){
			moreJoinInDataflow = true;	
			break;
		}				
	}
	if(moreJoinInDataflow){
		alertsManager.clearAlerts();			
		alertsManager.addAlert("Operation not admitted. Another Join operator is declared on dataflow. \n"+
							   "Please remove it.", 'alert-danger');
		$scope.showCustomAlert = true;
		return;
	}
		    
    // Ricompongo lo schema
    // Per ogni nodo collegato, se nel nodo la proprietà è false, 
    // la imposto a false nel nuovo schema
	var length = $scope.schemaPropertiesSelected[$scope.node.idx].length;
	$scope.schemaPropertiesSelected[$scope.node.idx]=[];    
    var connected_nodes = cloneObject(getConnectedNodes($scope.node));
    var old_schema = cloneObject($scope.node.data.schema);
    var new_schema = [];    
    connected_nodes.forEach(function(id){
		var conn = window.cy.$("node[id='"+id+"']");
        if(conn.data().target == undefined){
            var idx = getNodeIDXById(conn.id());
            var conn_data = conn.data();
            for(var x=0; x<conn_data.schema.m2m_data_schema.length; x++){
				if(x <= length){
					conn_data.schema.m2m_data_schema[x].selected = cloneObject($scope.schemaPropertiesSelected[idx][x]);				
					conn_data.schema.m2m_data_schema[x].id = cloneObject(conn_data.id);
					$scope.schemaPropertiesSelected[$scope.node.idx].push($scope.schemaPropertiesSelected[idx][x]);
			    }	
			    else {
					conn_data.schema.m2m_data_schema[x].selected = true;
					conn_data.schema.m2m_data_schema[x].enabled = true;
					conn_data.schema.m2m_data_schema[x].id = cloneObject(conn_data.id);
					$scope.schemaPropertiesSelected[$scope.node.idx].push(true);					
				}			                			
            }
            Array.prototype.push.apply(new_schema, conn_data.schema.m2m_data_schema);            
		}		
    });
    
	var fake_node = $.extend({}, $scope.node);
	fake_node.data.schema.m2m_data_schema = cloneObject(new_schema);
	var successors = window.cy.$("node[id='"+$scope.node.data.id+"']").successors();
	// Propago lo schema
	propagateSchema(fake_node, successors, 'joined', $scope.node.idx, old_schema);    
    // Propago lo schema	
	drawLines();
};

$scope.resetJoinLinesCSV = function(){	    
    $scope.connections[$scope.node.data.pos] = new Array();	
    $scope.node.data.join_schema = [];
    window.cy.$("node[id='"+$scope.node.data.id+"']").data('join_schema', []);
    $scope.joinlines[$scope.node.data.pos] = new Array();
    $scope.joinSchemaProperties[$scope.node.data.pos] = new Array();    
    var moreJoinInDataflow = false;    
	var successors = window.cy.$("node[id='"+$scope.node.data.id+"']").successors();
	// Controllo la presenza di altri Join sul dataflow, se si devo prima
	// cancellarli o farne un reset.
	for(var x=0; x<successors.length; x++){
		if(successors[x].data().object == 'join'){
			moreJoinInDataflow = true;	
			break;
		}
		else if(successors[x].data().object == 'csv_join'){
			moreJoinInDataflow = true;	
			break;
		}						
	}
	if(moreJoinInDataflow){
		alertsManager.clearAlerts();			
		alertsManager.addAlert("Operation not admitted. Another Join operator is declared on dataflow. \n"+
							   "Please remove it.", 'alert-danger');
		$scope.showCustomAlert = true;
		return;
	}
		    
    // Ricompongo lo schema
    // Per ogni nodo collegato, se nel nodo la proprietà è false, 
    // la imposto a false nel nuovo schema
	var length = $scope.schemaPropertiesSelected[$scope.node.idx].length;
	$scope.schemaPropertiesSelected[$scope.node.idx]=[];    
    var connected_nodes = $scope.node.data.connected_nodes;
    var connected_schemas = $scope.node.data.connected_schemas;
    var old_schema = cloneObject($scope.node.data.schema);
    var new_schema = [];     
    connected_schemas.forEach(function(elem){
		var idx = getNodeIDXById(elem.id);
		for(var x=0; x<elem.schema.m2m_data_schema.length; x++){
			if(elem.object != 'csv_file'){
				if(x <= length){
					elem.schema.m2m_data_schema[x].selected = cloneObject($scope.schemaPropertiesSelected[idx][x]);				
					elem.schema.m2m_data_schema[x].id = cloneObject(elem.id);
					$scope.schemaPropertiesSelected[$scope.node.idx].push($scope.schemaPropertiesSelected[idx][x]);
				}	
				else {
					elem.schema.m2m_data_schema[x].selected = true;
					elem.schema.m2m_data_schema[x].enabled = true;
					elem.schema.m2m_data_schema[x].id = cloneObject(elem.id);
					$scope.schemaPropertiesSelected[$scope.node.idx].push(true);					
				}	
			}	                			
		}		
        Array.prototype.push.apply(new_schema, elem.schema.m2m_data_schema); 		
	});   
    
	var fake_node = $.extend({}, $scope.node);
	fake_node.data.schema.m2m_data_schema = cloneObject(new_schema);
	var successors = window.cy.$("node[id='"+$scope.node.data.id+"']").successors();
	// Propago lo schema
	propagateSchema(fake_node, successors, 'joined', $scope.node.idx, old_schema);    
    // Propago lo schema	
	drawLines();
};


$scope.doNaturalJoin = function(){    
	var errors = [];
    // Faccio reset
    $scope.resetJoinLines();
    var join_schema = $scope.node.data.join_schema || [];    
    var sources = window.cy.$("node[id='"+$scope.node.data.id+"']").incomers();
    var complete_schema = [];
    var connected_schema = $scope.node.data.connected_schemas.slice();
    var moreJoinInDataflow = false;
    var old_schema = $scope.node.data.schema;
    var schema = {};        
    schema.m2m_data_schema = [];
    
	var successors = window.cy.$("node[id='"+$scope.node.data.id+"']").successors();
	// Controllo la presenza di altri Join sul dataflow, se si devo prima
	// cancellarli o farne un reset.
	for(var x=0; x<successors.length; x++){
		if(successors[x].data().object == 'join'){
			moreJoinInDataflow = true;	
			break;
		}				
	}
	if(moreJoinInDataflow){
		alertsManager.clearAlerts();			
		alertsManager.addAlert("Operation not admitted. Another Join operator is declared on dataflow. \n"+
							   "Please remove it.", 'alert-danger');
		$scope.showCustomAlert = true;
		return;
	}    
    
    join_schema.forEach(function(js){
		if(complete_schema.indexOf(js.property)==-1){
            complete_schema.push(js.property);             
		}
        // Elimino dallo schema la proprietà corrispondente
        for(var x=0; x<connected_schema.length; x++){			
			for(var y=0; y<connected_schema[x].schema.m2m_data_schema.length; y++){			
				var property = connected_schema[x].schema.m2m_data_schema[y].name;
				var id = connected_schema[x].id;
                if(js.ids.indexOf(id) != -1 && js.property == property){                   
                    connected_schema[x].schema.m2m_data_schema.splice(y, 1);                    
                    break;
			    }			    
			}
        }		
    });
    connected_schema.forEach(function(cs){
        Array.prototype.push.apply(complete_schema, cs.schema.m2m_data_schema);		
    });
    if($scope.node.data.object == 'join'){
		for(var x=0; x<sources.length; x++){
			// Se è un nodo e non un arco
			if(sources[x].data().target == undefined){
				// Se è l'ultimo elemento
				if(x==sources.length-1){ break; }
				// Ciclo i restanti elementi ed estraggo il nodo prossimo
				for(var el=x+1; el<sources.length; el++){
					if(sources[el].data().target == undefined){
						var neighbor = sources[el];
						break;    
					}
				}			
				var node = sources[x];
				if(neighbor != undefined){			
					var neighbor_data = neighbor.data();
					var node_data = node.data();
					// traccio linee tra gli attributi 
					// che hanno lo stesso nome e lo stesso tipo
					for(var y=0; y<node_data.schema.m2m_data_schema.length; y++){
						// Ottengo property1
						var property1 = node_data.schema.m2m_data_schema[y];
						for(var z=0; z<neighbor_data.schema.m2m_data_schema.length; z++){	
							 // Ottengo property2			     
							 var property2 = neighbor_data.schema.m2m_data_schema[z];
							 // Se property1 e property2 sono compatibili						 
							 if(property1.name == property2.name && 
								property1.type == property2.type){ 
									// Se le proprietà sono visibili, ovvero selezionate sulle sorgenti
								 if(property1.selected == true && property2.selected == true){                            
									 schema = replaceNaturalJoinSchema(complete_schema, complete_schema.indexOf(property1), complete_schema.indexOf(property2), property1);										
									 // Estraggo elementi su cui disegnare linea
									 var html_node1_id = "#"+node.id()+"_"+y;
									 var html_node2_id = "#"+neighbor.id()+"_"+z;
									 // Salvo le coppie di ID
									 $scope.joinlines[$scope.node.data.pos].push([html_node1_id, html_node2_id]);		
									 // Creo linee
									 var connection = new $.connect(html_node1_id, html_node2_id, {container : '#join-table'+$scope.node.data.pos});		         				         
									 $scope.connections[$scope.node.data.pos].push(connection);				
									 // Se la proprietà non è contenuta in join_schema faccio push,
									 // altrimenti cerco la posizione in join_schema e aggiunto a ids l'id del nodo
									 var propertyInJoinSchema = false;
									 var propertyJoinSchemaPos = 0;
									 for(var w=0; w<join_schema.length; w++){
										 if(join_schema[w].property == property1.name){
											 propertyInJoinSchema = true;	
											 propertyJoinSchemaPos = w;							
											 break;	 
										 }	 
									 }
									 if(propertyInJoinSchema){
										 join_schema[propertyJoinSchemaPos].ids.push(neighbor.id());	 
									 }		 							 							
									 else {											    
										 join_schema.push({'property':property1.name, 'property2': property2.name, 'ids':[node.id(), neighbor.id()]});
									 }
									 window.cy.$("node[id='"+$scope.node.data.id+"']").data(join_schema, join_schema);							 					 
									 break;
								 }
								 else {
									 if(errors.length == 0){
										 errors.push("Natural Join can't perform actions on not visible properties.");									 
									 }
								 }
							}
						}
					}   				
					if(errors.length>0){
						showSingleError(errors[0]);
					}   					 
				}
			}
		} 
	}
	else if($scope.node.data.object == 'csv_join'){
				var conn_nodes = getConnectedNodes($scope.node);
				var neighbor = window.cy.$("node[id='"+conn_nodes[0]+"']"); // ottengo Source			
				var node_data;
				$scope.node.data.connected_schemas.forEach(function(elem){
				    if(elem.object == 'csv_file'){
						node_data = elem;
					}
				});				
				if(neighbor != undefined){			
					var neighbor_data = neighbor.data();					
					// traccio linee tra gli attributi 
					// che hanno lo stesso nome e lo stesso tipo
					for(var y=0; y<node_data.schema.m2m_data_schema.length; y++){
						// Ottengo property1
						var property1 = node_data.schema.m2m_data_schema[y];
						for(var z=0; z<neighbor_data.schema.m2m_data_schema.length; z++){	
							 // Ottengo property2			     
							 var property2 = neighbor_data.schema.m2m_data_schema[z];
							 // Se property1 e property2 sono compatibili						 
							 if(property1.name == property2.name && 
								property1.type == property2.type){ 
									// Se le proprietà sono visibili, ovvero selezionate sulle sorgenti
								 if(property1.selected == true && property2.selected == true){                            
									 schema = replaceNaturalJoinSchema(complete_schema, complete_schema.indexOf(property1), complete_schema.indexOf(property2), property1);										
									 // Estraggo elementi su cui disegnare linea
									 var html_node1_id = "#"+node_data.id+"_"+y;
									 var html_node2_id = "#"+neighbor.id()+"_"+z;
									 // Salvo le coppie di ID
									 $scope.joinlines[$scope.node.data.pos].push([html_node1_id, html_node2_id]);		
									 // Creo linee
									 var connection = new $.connect(html_node1_id, html_node2_id, {container : '#join-table'+$scope.node.data.pos});		         				         
									 $scope.connections[$scope.node.data.pos].push(connection);				
									 // Se la proprietà non è contenuta in join_schema faccio push,
									 // altrimenti cerco la posizione in join_schema e aggiunto a ids l'id del nodo
									 var propertyInJoinSchema = false;
									 var propertyJoinSchemaPos = 0;
									 for(var w=0; w<join_schema.length; w++){
										 if(join_schema[w].property == property1.name){
											 propertyInJoinSchema = true;	
											 propertyJoinSchemaPos = w;							
											 break;	 
										 }	 
									 }
									 if(propertyInJoinSchema){
										 join_schema[propertyJoinSchemaPos].ids.push(neighbor.id());	 
									 }		 							 							
									 else {											    
										 
										 join_schema.push({'property':property1.name, 'property2': property2.name, 'ids':[node_data.id, neighbor.id()]});
									 }
									 window.cy.$("node[id='"+$scope.node.data.id+"']").data(join_schema, join_schema);							 					 
									 break;
								 }
								 else {
									 if(errors.length == 0){
										 errors.push("Natural Join can't perform actions on not visible properties.");									 
									 }
								 }
							}
						}
					}   				
					if(errors.length>0){
						showSingleError(errors[0]);
					}   					 
				}		
	}   
    var final_data = window.cy.$("node[id='"+$scope.node.data.id+"']").data();
    final_data.schema.m2m_data_schema = getNaturalJoinSchema(join_schema);  
    $scope.setJoinProperties(join_schema);   
    window.cy.$("node[id='"+$scope.node.data.id+"']").data('schema', final_data.schema);
    window.cy.$("node[id='"+$scope.node.data.id+"']").data('join_ids', $scope.joinlines); 	       
	// Propago il nuovo schema ai nodi successivi
	// se trovo un altro join mi fermo
	var fake_node = $.extend({}, $scope.node); 
	fake_node.schema = final_data.schema;
	var successors = window.cy.$("node[id='"+$scope.node.data.id+"']").successors();
	// Propago lo schema
	propagateSchema(fake_node, successors, 'joined', $scope.node.idx, old_schema);
	// Pongo a true tutte le proprietà
	var properties_length = fake_node.data.schema.m2m_data_schema.length;
	$scope.schemaPropertiesSelected[getNodeIDXById($scope.node.data.id)] = new Array();
    for(var x=0; x<properties_length; x++){
		// Setto tutti gli attributi come selezionati
		$scope.schemaPropertiesSelected[getNodeIDXById($scope.node.data.id)].push(fake_node.schema.m2m_data_schema[x].selected);
	}
	for(var x=0; x<successors.length; x++){
		if(successors[x].data().target == undefined){
			if(successors[x].data().object == 'join'){ break; }		
			// Imposto gli attributi dei nodi figli come selezionati					
			$scope.schemaPropertiesSelected[getNodeIDXById(successors[x].id())] = $scope.schemaPropertiesSelected[getNodeIDXById($scope.node.data.id)];
		}
	}   
};

function replaceNaturalJoinSchema(m2m_data_schema, pos1, pos2, property){	
    m2m_data_schema.splice(pos1, 1);
    m2m_data_schema.splice(pos2, 1);
    m2m_data_schema.push({'name':property.name, 'type':property.type, 'enabled':true, 'selected':true});
    return m2m_data_schema;
}

function cointainsProperty(lista, property){
    var toReturn = false;
    for(var x=0; x<lista.length; x++){
	    if(lista[x].name == property.name &&
	       lista[x].type == property.type &&
	       lista[x].id == undefined){
            toReturn = true;
            break;			   
        }   
    }
    return toReturn;	
}

function getNaturalJoinSchema(join_schema){  // devo aver cliccato un nodo  
    var sources = window.cy.$("node[id='"+$scope.node.data.id+"']").incomers();
    var obj = [];
    var property = null;
    sources.forEach(function(elem){
        var elem_data = elem.data();
        // Se è un nodo, e non un arco
        if(elem_data.object != undefined){
            var schema_properties = elem_data.schema.m2m_data_schema;   
            schema_properties.forEach(function(x){
				if(isJoinProperty(elem_data.id, x.name)){
				    property = {'name':x.name, 'type':x.type, 'enabled':x.enabled, 'selected':x.selected};
				    if(!cointainsProperty(obj, property)){
				        obj.unshift(property);	
				    }				
				}
                else{
                    try{
						obj.push(x);
                    }
                    catch(err){ 

                    }
                }
            });            
        }
    });
    return obj;
};

/*********************************************************
***                     JOIN CSV                       ***
*********************************************************/
$scope.canUpload = function(){
	if(getConnectedNodes($scope.node).length == 0){
        return false;
	}
	return true;
};	
$scope.uploader = new FileUploader({
    url: '/default_url/',   
    alias : 'file', 
    transformRequest: angular.identity    
});

$scope.enableFileUploader = function(){	
	var errorOccurred = false;	
	// FILTERS
	$scope.uploader.filters.push({
		name: 'file',
		fn: function(item /*{File|FileLikeObject}*/, options) {
			var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
			return '|csv|'.indexOf(type) !== -1;
		}
	});		
	// CALLBACKS
	$scope.uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
		showSingleError("Only CSV file type are admitted.");
	};
	$scope.uploader.onAfterAddingFile = function(fileItem) {
		console.info('onAfterAddingFile', fileItem);
		console.log($scope.csv_delimiter[$scope.node.data.pos]);		
		if($scope.csv_delimiter[$scope.node.data.pos] == [] || $scope.csv_delimiter[$scope.node.data.pos].length == 0|| $scope.csv_delimiter[$scope.node.data.pos] == undefined){
            showSingleError("Please specify a delimiter.");	
            return;		
		}			
	};
	$scope.uploader.onAfterAddingAll = function(addedFileItems) {
		console.info('onAfterAddingAll', addedFileItems);
	};
	$scope.uploader.onBeforeUploadItem = function(item) {		
		$scope.APIurl = env_config.apiURL+'/api/v1/workflow/' + $scope.workflow.id + '/join_csv/'+$scope.node.data.id; // API URL
		item.url = $scope.APIurl;
		console.info('onBeforeUploadItem', item);	
	};
	$scope.uploader.onProgressItem = function(fileItem, progress) {
		console.info('onProgressItem', fileItem, progress);
	};
	$scope.uploader.onProgressAll = function(progress) {
		console.info('onProgressAll', progress);
	};
	$scope.uploader.onSuccessItem = function(fileItem, response, status, headers) {
		console.info('onSuccessItem', fileItem, response, status, headers);
	};
	$scope.uploader.onErrorItem = function(fileItem, response, status, headers) {
		console.info('onErrorItem', fileItem, response, status, headers);
	};
	$scope.uploader.onCancelItem = function(fileItem, response, status, headers) {
		console.info('onCancelItem', fileItem, response, status, headers);
	};
	$scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
		console.info('onCompleteItem', fileItem, response, status, headers);
		if(response.status == "error"){
		    fileItem.cancel();	
		    $scope.uploader.cancelAll();
		    $scope.uploader.clearQueue();		    
		    showSingleError("Please create a project before using that method.");
		    errorOccurred = true;		    
		}
		else {
		    errorOccurred = false;	
			workflowService.getCSVById(response.content.id).then(
				function(response2){
					var lines = processData(response2.content.file_content, $scope.csv_delimiter[$scope.node.data.pos].symbol);
					// Devo creare l'm2m_data_schema
					var obj = {};      
					var key = response.content.id; 					
					var j_schema = {};
					var csv_schema = {};
					var csvNodeData = {};	
					var source_id;	
					var source_data;
					var source_idx;
					var connected_nodes;
					var connected_schemas;
								
					try{
						j_schema.m2m_data_schema = window.cy.$("node[id='"+$scope.node.data.id+"']").data().schema.m2m_data_schema;
					} catch(err){
						j_schema.m2m_data_schema = [];
					}
						
					try{				
						csv_schema.m2m_data_schema = [];
						lines[0].forEach(function(elem){
							var splitted = elem.split('(');
							var name = splitted[0].trim();
							var type = splitted[1].split(')')[0].trim();
							var obj = {'name': name, 'type': type, 'id':response.content.id};
							csv_schema.m2m_data_schema.push(obj);
						});	
				    } catch(err){
						alertsManager.clearAlerts();
						$scope.$root.$broadcast('updateCustomAlert', {show:true});				  
						alertsManager.addAlert("CSV file doesn't satisfy format.", 'alert-danger');
						// Remove Alerts
						$timeout(function() {
							alertsManager.clearAlerts();
							$scope.$root.$broadcast('updateCustomAlert', {show:false});
						}, 2000);						
					   return;	
					}				    		
					csv_schema.m2m_data_schema = $scope.sortSchemaObj2(csv_schema);				
					csvNodeData.name = 'CSV';
					csvNodeData.id = response.content.id;
					csvNodeData.schema = csv_schema;	
					csvNodeData.object = 'csv_file';				
					connected_nodes = getConnectedNodes($scope.node);
					connected_schemas = getConnectedNodesSchema2($scope.node.data);					
					if(connected_nodes.length == 0 || connected_nodes.indexOf(key)==-1){ connected_nodes.push(key); }
					// Il nodo non risulta ancora tra i connected_schemas per cui lo aggiungo manualmente
					connected_schemas.push(csvNodeData);
					// Ottengo l'id della sorgente
					connected_nodes.forEach(function(elem){
					    if(elem.indexOf('s')!=-1){ source_id = elem; }	
					});									
					
					obj[key] = csv_schema.m2m_data_schema;
					$scope.joinSchemaProperties[$scope.node.data.pos].push(obj);
					if($scope.node.idx >= $scope.schemaPropertiesSelected.length){
						$scope.schemaPropertiesSelected.push([]);
					}     
					j_schema.sensor_type = 'joined';
					csv_schema.m2m_data_schema.forEach(function(elem){							
						$scope.schemaPropertiesSelected[$scope.node.idx].push(true);
						elem.enabled = true;
						elem.selected = true;
					});                                            
					for(var x=0; x<csv_schema.m2m_data_schema.length; x++){						
						csv_schema.m2m_data_schema[x].node_name = 'CSV';
						j_schema.m2m_data_schema.push(csv_schema.m2m_data_schema[x]);
						j_schema.m2m_data_schema[j_schema.m2m_data_schema.length-1].id = key;
					}                                
					// Setto lo schema a cui ho aggiunto le proprietà del nuovo nodo collegato.
					window.cy.$("node[id='"+$scope.node.data.id+"']").data('schema', j_schema);   
					window.cy.$("node[id='"+$scope.node.data.id+"']").data('connected_schemas', connected_schemas);   
					window.cy.$("node[id='"+$scope.node.data.id+"']").data('connected_nodes', connected_nodes);				        					
					// Ottengo il sample				
					var table = "<table class='table table-bordered'>";									
					table += "<thead><tr>";					
					
					for(var x=0; x<lines.length; x++){
					    if(x==0){
						    // Intestazione
						    lines[x].forEach(function(elem){							    
							    table += "<th>"+elem+"</th>";
							});
							table += "</tr>";							
							table += "<thead>";
							table += "<tbody>";
						    	
						}	
						else {
						    table += "<tr>";
						    lines[x].forEach(function(elem){
							    table += "<td>"+elem+"</td>";
							});						    					
							table += "</tr>";							
						}						
					}
					table += "</tbody>";
					table += "</table>";
					var sample = [];
					var sample_obj = {};
					var header = lines[0];
					var body = lines.slice(1);
					var mustContinue = true;
					var pos = 0;
					var body_length = body.length;
					while(mustContinue){
						for(var x=0; x<header.length; x++){
							var key = header[x];
							key = key.split('(')[0].trim();
							var value;						
							for(var y=0; y<body[0].length; y++){						   
							   value = body[y][0];	
							   sample_obj[key] = value;	
							   body[0].splice(0, 1);					   
							   break;
							}																											    
						}	
						body.splice(0, 1);	
						sample.push(sample_obj);
						pos+=1;									
						if(pos==body_length){
							mustContinue = false;
						}
				    }
				    j_schema.sample = sample;
				    window.cy.$("node[id='"+$scope.node.data.id+"']").data('schema', j_schema);					
				    window.cy.$("node[id='"+$scope.node.data.id+"']").data('html_sample', table);					
				},
				function(error){
					alertsManager.addAlert(error.content.message, 'alert-danger');
				}
			);		    
		}
	};
	$scope.uploader.onCompleteAll = function() {
		if(errorOccurred==false){
			alertsManager.clearAlerts();
			$scope.$root.$broadcast('updateCustomAlert', {show:true});				  
			alertsManager.addAlert('File uploaded', 'alert-success');
			// Remove Alerts
			$timeout(function() {
				alertsManager.clearAlerts();
				$scope.$root.$broadcast('updateCustomAlert', {show:false});
			}, 2000);
			$scope.uploader.clearQueue();											
	    }
	};	
};

function processData(allText, delimiter) {
    // split content based on new line
    var allTextLines = allText.split(/\r\n|\n/);
    var headers = allTextLines[0].split(delimiter);
    var lines = [];

    for ( var i = 0; i < allTextLines.length; i++) {
        // split content based on comma
        var data = allTextLines[i].split(',');
        if (data.length == headers.length) {
            var tarr = [];
            for ( var j = 0; j < headers.length; j++) {
                tarr.push(data[j]);
            }
            lines.push(tarr);
        }
    }
    //$scope.data = lines;
    return lines;
}

/*********************************************************
***           GESTIONE OPERATORE TRANSFORM             ***
*********************************************************/
function getTransformFunctionByInitial(initial){		
	for(var x=0; x<$scope.transform_functions.length; x++){
	    if($scope.transform_functions[x].initial == initial){
			return $scope.transform_functions[x];
		}	
	}
	return false;
}

function getVirtualFunctionByInitial(initial){
	for(var x=0; x<$scope.virtual_functions.length; x++){
	    if($scope.virtual_functions[x].initial == initial){
			return $scope.virtual_functions[x];
		}	
	}
	return false;	
}

var unregisterFunc = $scope.$watch('transformFunctionsSettings', function(){ 
     unregisterFunc();
});
var unregisterSelect = $scope.$watch('virtualSelections', function(){ 
     unregisterSelect();
});
var unregisterVirtNameAS = $scope.$watch('virtualNameAS', function(){ 
     unregisterVirtNameAS();
});

$scope.applyTransform = function(pos){
	var error = false;
	var errorMSG = '';
    // TAB TRANFORM
    for(var x=0; x<$scope.node.data.schema.m2m_data_schema.length; x++){
	    if($scope.transformFunctionsSettings[pos][x]!=true){
			if($scope.transformFunctionsSettings[pos][x] != undefined){		 
				$scope.node.data.schema.m2m_data_schema[x].function = 'transform';   
				$scope.node.data.schema.m2m_data_schema[x].initial = $scope.transformFunctionsSettings[pos][x].initial;		   		   
				$scope.node.data.schema.m2m_data_schema[x].nameAS = $scope.propertyNamesAS[pos][x];		   		   
		    }
		}	
	}
	//console.log($scope.virtualFunctionsSettings[$scope.node.data.pos]);	
	// TAB VIRTUAL
	// Rimuovo eventuali oggetti aggiunti in precedenza allo schema
	// e dopo riaggiungo i nuovi
	for(var x=0; x<$scope.node.data.schema.m2m_data_schema.length; x++){
		if($scope.node.data.schema.m2m_data_schema[x].function == 'virtual'){
		    $scope.node.data.schema.m2m_data_schema.splice(x, 1);
		}
	}
	for(var x=0; x<$scope.virtualFunctionsSettings[$scope.node.data.pos].length; x++){		
		var func_value = $scope.virtualFunctionsSettings[$scope.node.data.pos][x];
		var values = $scope.virtualSelections[$scope.node.data.pos].slice(x, func_value.arity);
		var nameAS = $scope.virtualNameAS[$scope.node.data.pos][x];
		var obj = {};
		obj.nameAS = nameAS;
		obj.name = nameAS;
		obj.enabled = true;
		obj.selected = true;
		obj.initial = func_value.initial;
		obj.function = 'virtual';
		obj.values = [];
		// Controllo se è stato inserito il nome della proprietà finale
		if(nameAS == ""){
		    showSingleError("Provide the AS value.");
		    return;	
		}
		// Riempio obj.values
		values.forEach(function(value){						
			if(value != false){			
				if(value.name == undefined){ obj.values.push(value); }
				else { 
					var toPush = {};
					toPush.name = value.name;
					toPush.type = value.type;
					obj.values.push(value); 
				}
			}
			else {
			    error = true;
			    errorMSG = "Specify a property or provide a value.";
			}
        });  
        try{
			if(obj.values[0].type != undefined){
				obj.type = angular.copy(obj.values[0].type);
			}
			else if(obj.values[1].type != undefined){
				obj.type = angular.copy(obj.values[1].type);	
			}
			else {
				error = true;
				errorMSG = "One of the properties must be selected from dropdown menu.";
				break;  	
			}
		} catch(err){
			error = true;
			errorMSG = "Function can't be applied.";
			break; 			
		}
        $scope.node.data.schema.m2m_data_schema.push(obj);    
        window.cy.$("node[id='"+$scope.node.data.id+"']").data('schema', $scope.node.data.schema);  
	}
	if(error){
		showSingleError(errorMSG);
		return;
	}
	showSingleMessage("Trasformation applied to dataflow. Remember to save your project.");
	console.log($scope.schemaPropertiesSelected[$scope.node.idx]);
};

function addAttrToSchemaProperty(properties, property, key, value){
    for(var x=0; x<properties.length; x++){
	    if(properties[x].name == property.name){
		    properties[x][key] = value;	
		    break;
		}			
	}
	return properties;
}

$scope.addVirtualColumn = function(pos){
    $scope.virtualFunctionsSettings[pos].push(false);    
};

$scope.composeVirtualColumns = function(pos, nodeID, id, index){
  try{
		if($("#"+id +" > .insertValue").length > 0){
            showSingleError("Changes are not admitted to declared functions. Remove it and add a new one.");
            return;
		}
		var func = $scope.virtualFunctionsSettings[pos][index];
		var arity = parseInt(func.arity);
		var data_type = func.data_type;          
		var html_element = "";
		$scope.virtualNameAS[pos].push("");
		for(var x=0; x<arity; x++){		
			$scope.virtualSelections[pos].push(false);		
			var length1 = $scope.virtualSelections[pos].length-1;
			var length2 = $scope.virtualNameAS[pos].length-1;
			if(data_type != 'date'){
				html_element += "<select class='form-control tab-node-name' id='"+nodeID+"_"+ length1+"'"+
					"ng-model='virtualSelections[node.data.pos]["+length1+"]'" +				
					"ng-options=\"p as p.name for p in node.data.schema.m2m_data_schema | AttributeByType:'"+data_type+"' track by p.name\">" +			
					"<option value=''>Select property</option>" +
				"</select>" + 
				"<span class='insertValue' ng-click='replaceTransformAttrWithValue(\""+nodeID+"\","+length1+")'>insert value</span>";
		    }
		    else {
                if(func.initial == "ADDday" || func.initial == "ADDhour"){
					$scope.addToDate[pos].push("");
					html_element += "<select class='form-control tab-node-name' id='"+nodeID+"_"+ length1+"'"+					
						"ng-model='virtualSelections[node.data.pos]["+length1+"]'" +				
						"ng-options=\"p as p.name for p in node.data.schema.m2m_data_schema | AttributeByType:'"+data_type+"' track by p.name\">" +			
						"<option value=''>Select property</option>" +					
					"</select>" + 
					"<input class='form-control tab-node-name' type='text' placeholder='quantity' ng-model='addToDate[pos][index]' />"
			    }
			    else {
					html_element += "<select class='form-control tab-node-name' id='"+nodeID+"_"+ length1+"'"+	
						"ng-model='virtualSelections[node.data.pos]["+length1+"]'" +				
						"ng-options=\"p as p.name for p in node.data.schema.m2m_data_schema | AttributeByType:'"+data_type+"' track by p.name\">" +			
						"<option value=''>Select property</option>" +
					"</select>";					
				}						
			}
			if(x<arity-1){
				html_element+= "<span class='form-control tab-node-name' style='text-align: center; max-width:68px; text-overflow: ellipsis;'>"+func.initial + "</span>";			    
			}
			else if(x==arity-1){ // se è l'ultimo elemento
				html_element+= "<span class='form-control tab-node-name' style='text-align: center; max-width: 45px; border: none; box-shadow: none;'>AS</span>";
				html_element+= "<input class='form-control tab-node-name' ng-model='virtualNameAS[node.data.pos]["+length2+"]' type='text' />";
			}
		}
		var el = angular.element(html_element);
		$('#'+id).append($compile(el)($scope));
      
  }catch(err){}	  
};

$scope.replaceTransformAttrWithValue = function(nodeID, pos){	
	$scope.virtualSelections[$scope.node.data.pos][pos] = "";
	var html_element = "<input class='form-control tab-node-name' type='text' ng-model='virtualSelections[node.data.pos]["+pos+"]' />";
	var el = angular.element();
    $('#'+nodeID+"_"+pos).replaceWith($compile(html_element)($scope));     
};

$scope.removeVirtualColumn = function(index){
	if(index != null){
		var virtual = $scope.virtualFunctionsSettings[$scope.node.data.pos][index];
		var arity = virtual.arity != undefined ? virtual.arity : 1;		
		var count = 0;
		for(var x=0; x<index; x++){
		    if($scope.virtualFunctionsSettings[$scope.node.data.pos][x] != false){
			    count+= parseInt($scope.virtualFunctionsSettings[$scope.node.data.pos][x].arity);
			}	
			else {
			    count+=1;	
			}
		}
		$scope.virtualFunctionsSettings[$scope.node.data.pos].splice(index, 1);
		$scope.virtualNameAS[$scope.node.data.pos].splice(index, 1);
		$scope.virtualSelections[$scope.node.data.pos].splice(count, arity);
		$scope.addToDate[$scope.node.data.pos].splice(index, 1);
	}
};

$scope.drawVirtual = function(node){
	try{
		var funcs = angular.copy($scope.virtualFunctionsSettings[node.data.pos]);
		var pos = 0;
		var html_element = "";
		unregisterFunc();
		unregisterSelect();
		unregisterVirtNameAS();
		var index = 0;				       										  
	}catch(err){console.log(err);}	
};
$scope.dps = [];
$scope.dpsBar = [{label: "Bit Rate", y: 0}];

/*********************************************************
***                   STREAM CHART                     ***
*********************************************************/		
$scope.startLineChart = function() {
	var chart = new CanvasJS.Chart("chartContainer2",
	{
		theme: "theme2",
			title:{
				text: "Streaming data"
			},
			axisY: {				
				title: "Value"
			},					
			legend:{
				verticalAlign: "top",
				horizontalAlign: "centre"
			},
		data: [
			{
				type: "splineArea",
				color: "rgba(40,175,101,0.6)",
				dataPoints: $scope.dps
			}		
		],
		height: 150,
	});
	
    chart.render();
    return chart;
};

$scope.startBarChart = function() {
	var chart = new CanvasJS.Chart("chartContainer3",
	{
		theme: "theme2",
			title:{ 
				text: "Bit Rate"
			},
			axisY: {				
				title: "Value"
			},					
			legend:{
				verticalAlign: "top",
				horizontalAlign: "centre"
			},
		data: [
			{
				type: "column",
				dataPoints: $scope.dpsBar
			}		
		],
		height: 150,
	});
	
    chart.render();
    return chart;
};

/*********************************************************
***                    WEB SOCKET                      ***
*********************************************************/

$scope.startFlinkConverter = function(){
	var json = $scope.getJSON("websocket");
	$scope.startWebSocket();
	workflowService.flinkConverter(json).then(
	  function(response){
		$scope.stopWebSocket();
	  },
	  function(error){
		console.log(error);
		$scope.stopWebSocket();
	  });	
};

$scope.wsCount = 0;
$scope.flink_elapsed_time = 0;
$scope.flink_rate = 0;

$scope.startWebSocket = function(){
  $scope.webSocketMessages = [];
  $scope.wsMSG = "";  
  console.log("start new socket");        
  var chart;
  $scope.ws = $websocket.$new({
        url: env_config.WSURL,
        lazy: false,
        reconnect: true,
        reconnectInterval: 2000,
        enqueue: false,
        mock: false,
        protocols: [],
        subprotocol: 'base46'
  });
  if($scope.ws.$ready()==false){
	$scope.ws.$open();  
  }  
  $scope.ws.$on('$open', function () {        
    console.log("Client: invio init al Server");
    var json = $scope.getJSON('websocket'); 
    console.log("JSON: " + json);
    json.topic = "init";
    $scope.ws.$emit('init', json); // Invia dati al Server sull'evento ping
    // Inizializzo CHART
    chart = $scope.startChart();    
  })
  .$on('$message', function (message) { // Evento pong
	console.log("Client: messaggio ricevuto" + $scope.wsCount);
    console.log(message);    
    $scope.$apply(function(){       
	   if(typeof message === 'object'){
           /*
$scope.webSocketMessages.push(message);
           $scope.wsMSG = message;
*/
           if(typeof message.elapsed_time != 'NaN'){           
               $scope.flink_elapsed_time = parseFloat(message.elapsed_time)/1000;
		   }
		   if(typeof message.rate != 'Nan'){
               $scope.flink_rate = Math.floor(parseFloat(message.rate)*100)/100;
		   }
		   if(typeof message.processed_tuples != 'Nan'){
               chart.options.data[0].dataPoints[0].y = message.processed_tuples;
		   }
		   if(typeof message.ds_size != 'Nan'){
               chart.options.data[0].dataPoints[1].y = message.ds_size;
		   }
           chart.render();
	   }
       if(message.stopWS == true){
           $scope.stopWebSocket();
       }
    });        
    $scope.wsCount+=1;
  })
  .$on('$close', function () {
	console.log('Client: connessione al Server chiusa');
  });
};

$scope.stopWebSocket = function(){
	console.log("Client: invio messaggio chiusura connessione");
	console.log($scope.ws.$status());
    $scope.ws.$close();
    console.log($scope.ws.$status());     
};

    
/*********************************************************
***                  WEB SOCKET UNIMI                  ***
*********************************************************/
$scope.xVal = 0;
$scope.yVal = 100;	
$scope.updateInterval = 1000;
$scope.dataLength = 10;
$scope.operator = "none";
$scope.startUnimiWebSocket = function(){
	var json = $scope.getJSON("websocket");
	$scope.startWebSocketUnimi();
    console.log(json);	
};

$scope.startUnimiWebSocket = function(dsntxt){
  console.log("start new socket");        
  var chart;
  $scope.wsU = $websocket.$new({
        url: env_config.WSURL_UNIMI,
        lazy: false,
        mock: false,
        protocols: [],
        subprotocol: 'base46'
  });  
  if($scope.wsU.$ready()==false){
	   console.log("ready_open");
	   $scope.wsU.$open();  
  }  
  $scope.wsU.$on('$open', function () {
    console.log("Client: invio init al Server");
    var json = $scope.getJSON('websocket'); 
    //console.log("JSON: " + json);
//     $scope.wsU.$emits(json); // Invia dati al Server sull'evento ping
  })
  .$on('$message', function (message) { // Evento pong
	console.log("Client: messaggio ricevuto");
	if($scope.operator == "monitor"){
		document.getElementById("chartContainer3").style.display = "none";
		document.getElementById("chartContainer2").style.display = "inline-block";
		$scope.LineChart(message);
	}
	else if($scope.operator == "rate"){
		document.getElementById("chartContainer2").style.display = "none";
		document.getElementById("chartContainer3").style.display = "inline-block";
		$scope.BarChart(message);
	}
	
  })
  .$on('$close', function () {
	console.log('Client: connessione al Server chiusa');
  });
};

$scope.stopWebSocketUNIMI = function(){
	console.log("Client: invio messaggio chiusura connessione");
	console.log($scope.wsU.$status());
    $scope.wsU.$close();
    console.log($scope.wsU.$status());     
};   
    
$scope.changeCy = function() {
    var json = $scope.getJSON("websocket");
    console.log(json);
//    window.cy.style().selector('node')
//    .style({
//      'background-color': '#3375de',
//    })
//  .update();
};
  

/*********************************************************
***             FUNZIONI PER MONITORING                ***
*********************************************************/
    
$scope.sendState = function(tab) {
    //console.log($scope.node.data.object);
	$scope.state_tab = $scope.node.data.object + "_" + tab;
    console.log($scope.state_tab);

};
$scope.sendIdE = function() {
    console.log($scope.edge);

};

$scope.LineChart = function(mex) {
	console.log(mex);
	
	/*
for(var i in data)
	{
	     var id = data[i].value;
	     console.log(id);
	}
*/
  	/*
$scope.yVal = parseFloat(mex.elements.nodes.data.value)
    var chart;
    chart = $scope.startLineChart();
    $scope.dps.push({
		x: $scope.xVal,
		y: $scope.yVal
	});
	$scope.xVal++;
    if ($scope.dps.length > $scope.dataLength)
	{
		$scope.dps.shift();				
	}
*/
};

$scope.BarChart = function(mex) {
  	var deltaY = Math.round(2 + Math.random() *(-2-2));
  	$scope.yVal = parseFloat(mex.elements.nodes.data.value) + deltaY;
    var chart;
    chart = $scope.startBarChart();
    $scope.dpsBar[0].y = $scope.yVal;
};

//MONITORING OUTGOING DATA
$scope.monitor = function() {
	console.log($scope.node.data.id);
	console.log($scope.node.data.object);
	$scope.operator = "monitor";
	$scope.jsonMonitor = {"elements": {
	    "nodes" : [{"data": {"id": $scope.node.data.id,"object": $scope.node.data.object, "mode": "outdata", "refresh":"all"}}]		
	    }
	};
    $scope.wsU.$emits($scope.jsonMonitor);
	// Call this function every 10 sec to refresh the client
	
    window.setInterval(function(){
        $scope.jsonMonitor = {"elements": {
	    "nodes" : [{"data": {"id": $scope.node.data.id,"object": $scope.node.data.object, "mode": "outdata", "refresh":"last"}}]		
	    }
	};
    $scope.wsU.$emits($scope.jsonMonitor);
    }, $scope.updateInterval);

};

//BITRATE INGOING DATA
$scope.bitrate = function() {
	console.log($scope.node.data.id);
	console.log($scope.node.data.object);
	$scope.operator = "rate";
	$scope.jsonBitrate = {"elements": {
	    "nodes" : [{"data": {"id": $scope.node.data.id,"object": $scope.node.data.object}}],
	    "topic" : [{"data": {"type": "bitrate"}}]		
	    }
};
    $scope.wsU.$emits($scope.jsonBitrate)
    console.log($scope.jsonBitrate);
};

//AVG INGOING DATA
$scope.avg = function() {
	console.log($scope.node.data.id);
	console.log($scope.node.data.object);
	$scope.jsonAvg = {"elements": {
	    "nodes" : [{"data": {"id": $scope.node.data.id,"object": $scope.node.data.object}}],
	    "topic" : [{"data": {"type": "avg"}}]		
	    }
};
    $scope.wsU.$emits($scope.jsonAvg)
    console.log($scope.jsonAvg);
}; 

//COMPRESSION RATIO INGOING DATA
$scope.compression = function() {
	console.log($scope.node.data.id);
	console.log($scope.node.data.object);
	$scope.jsonCompression = {"elements": {
	    "nodes" : [{"data": {"id": $scope.node.data.id,"object": $scope.node.data.object}}],
	    "topic" : [{"data": {"type": "compressionratio"}}]		
	    }
};
    $scope.wsU.$emits($scope.jsonCompression)
    console.log($scope.jsonCompression);
};  
});

angular.module('tesi.homeApp').filter('FunctionIsCompatible', function () {
	return function(filter, property) {
		var out = [];
		for (var i = 0; i < filter.length; i++){
			if(filter[i].type == property.type)
				out.push(filter[i]);
		}      
		return out;			
	};
}); 

angular.module('tesi.homeApp').filter('AttributeByType', function () {
	return function(properties, data_type) {
		var out = [];
		if(properties != undefined){
			for (var i = 0; i < properties.length; i++){
				if(properties[i].type == data_type)
					out.push(properties[i]);
			}  
		}    
		return out;			
	};
}); 


