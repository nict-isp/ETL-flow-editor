var tooltip = function(){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            $(element).hover(function(){
                // on mouseenter
                $(element).tooltip({container: 'body'});
                $(element).tooltip('show');
            }, function(){
                // on mouseleave
                $(element).tooltip({container: 'body'});
                $(element).tooltip('hide');
            });
        }
    };
};
 
angular.module('tesi.homeApp').directive('tooltip', tooltip);
