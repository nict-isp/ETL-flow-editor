(function(){

    'use strict';

    angular.module('tesi.indexApp').service('loginService', loginService);

    function loginService($q, serviceCaller){

        function _login(user){

            var deferred = $q.defer();

            serviceCaller.doRequest("POST","api/v1/auth/login",{}, user)
                 .then(function(response){
                 if(serviceCaller.isSuccessResponse(response)){
                   deferred.resolve(response);
                 }
                 else{
                   deferred.reject(response);
                 }
            });

            return deferred.promise;
        }

        return {
            login: _login
        }
    }

})();
