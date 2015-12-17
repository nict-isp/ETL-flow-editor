angular.module('tesi.homeApp').directive('datepicker', function ($parse) {
    return function (scope, element, attrs, controller) {
        var ngModel = $parse(attrs.ngModel);
        $(function(){		
            element.datepicker({
                showOn:"both",
                changeYear:true,
                changeMonth:true,
                dateFormat:'yy/mm/dd',
                maxDate: '2020/31/12', //new Date(),
                yearRange: '1990:2020',
                onSelect:function (dateText, inst) {
					if(attrs.name == 'start_date'){
						var start = $(".start_date_"+scope.node.data.id).val();
						var end = $(".end_date_"+scope.node.data.id).val();
						if(end){						    
						    var start_date = new Date(start);	
						    var end_date = new Date(end);
						    // se start > end, errore						   
						    if(start_date.getTime() > end_date.getTime()){							    
							    scope.showSingleError('Start date must be less than end date');							    						        
						        dateText = ' ';    
							}	
						}
					}					
					if(attrs.name == 'end_date'){
						var start = $(".start_date_"+scope.node.data.id).val();
						var end = $(".end_date_"+scope.node.data.id).val();
						if(start){						    
						    var start_date = new Date(start);	
						    var end_date = new Date(end);
						    // se end > start, errore						   
						    if(end_date.getTime() < start_date.getTime()){							    
							    scope.showSingleError('End date must be greater than start date');							    
							    dateText = ' ';
							}	
						}
					}    					                					
                    scope.$apply(function(scope){
                        // Change binded variable
                        ngModel.assign(scope, dateText);
                    });
                }
            });
        });
    }
});

function putObject(path, object, value) {
    var modelPath = path.split(".");

    function fill(object, elements, depth, value) {
        var hasNext = ((depth + 1) < elements.length);
        if(depth < elements.length && hasNext) {
            if(!object.hasOwnProperty(modelPath[depth])) {
                object[modelPath[depth]] = {};
            }
            fill(object[modelPath[depth]], elements, ++depth, value);
        } else {
            object[modelPath[depth]] = value;
        }
    }
    fill(object, modelPath, 0, value);
}
