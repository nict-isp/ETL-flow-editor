(function(){

  'use strict';

  angular.module('tesi.homeApp').service('authService', authService);

  function authService($window, $location){

        function _checkAuth() {
            if($window.localStorage['token'] != undefined) {
                return true;
            }           
            return false;
        }        

        return{
            checkAuth: _checkAuth
        }
  }
})();
