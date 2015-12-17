(function(){
	'use strict';
    var checkEmail = function(signupService,$q) {
        return {
            require: 'ngModel',
            link: function(scope, element, attributes, ngModel) {

                ngModel.$asyncValidators.checkEmail = function(modelValue, viewValue) {
                    return signupService.checkEmail(viewValue).then(function(response){

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

    angular.module('tesi.indexApp').directive('checkEmail', checkEmail);
})();
