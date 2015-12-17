(function(){

  'use strict';

  angular.module('tesi.homeApp').service('dcnService', dcnService);

  function dcnService($q, $http, serviceDcnCaller){
 
        
        function _transformJSON(json) {
            return serviceDcnCaller.doRequest("POST","",{}, json);

        }        

        return{
            transformJSON: _transformJSON
        }


  }





})();
