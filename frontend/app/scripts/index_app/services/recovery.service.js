(function(){

    'use strict';

    angular.module('tesi.indexApp').service('recoveryService', recoveryService);

    function recoveryService($q, serviceCaller){

        function _sendRecoveryEmail(email){

            var deferred = $q.defer();

            serviceCaller.doRequest("POST","api/v1/auth/sendRecoveryEmail",{}, {emailAddress:email})
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
        
        function _checkToken(email, token){

            var deferred = $q.defer();

            serviceCaller.doRequest("POST","api/v1/auth/checkRecoveryToken",{}, {emailAddress:email, recovery_code:token})
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
        
        function _setPass(email, tokenID, newPass){

            var deferred = $q.defer();

            serviceCaller.doRequest("PUT","api/v1/auth/recoverySetPassword",{}, {emailAddress:email, tokenID:tokenID, newPass:newPass})
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
            sendRecoveryEmail: _sendRecoveryEmail,
            checkToken : _checkToken,
            setNewPassword : _setPass
        }
    }

})();
