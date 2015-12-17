(function(){
	'use strict';
    var checkEmail = function(userService,$q) {
        return {
            require: 'ngModel',
            link: function(scope, element, attributes, ngModel) {

                ngModel.$asyncValidators.checkEmail = function(modelValue, viewValue) {
                    return userService.checkEmail(viewValue).then(function(response){

                       if(response.content.available){
                           return true;
                       }
                       else if(response.content.available == false) {
						   if(response.content.owner == true) {
							   return true;
						   }   
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

    angular.module('tesi.homeApp').directive('checkEmail', checkEmail);
})();
