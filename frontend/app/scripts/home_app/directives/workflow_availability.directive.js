(function(){
    var checkWorkflow = function($q, workflowService) {
        return {
            require: 'ngModel',
            link: function(scope, element, attributes, ngModel) {
                ngModel.$asyncValidators.checkWorkflow = function(modelValue, viewValue) {					
                    return workflowService.checkWorkflow(viewValue).then(function(response){
						console.log(response);
                       if(response.content.available){
                           return true;
                       }
                        else{
                           return $q.reject('exists');
                       }
                    });

                };

                scope.$watch('modelValue', function() {
                    ngModel.$validate();
                });
            }
        };
    };

    angular.module('tesi.homeApp').directive('checkWorkflow', checkWorkflow);
})();
