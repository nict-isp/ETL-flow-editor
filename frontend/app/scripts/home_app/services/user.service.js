(function(){

  'use strict';

  angular.module('tesi.homeApp').service('userService', userService);

  function userService($q, serviceCaller){

        function _getUser() {
            return serviceCaller.doRequest('GET','api/v1/user',{},{});
        }

        function _checkEmail(email){
            return serviceCaller.doRequest('POST', 'api/v1/user/check_email',{},{email:email});
        }      
        
        function _update(user){
			var deferred = $q.defer();
			
            serviceCaller.doRequest('PUT','api/v1/user',{},user)
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
        
        function _checkPassword(password){
			var deferred = $q.defer();
			
            serviceCaller.doRequest('POST','api/v1/user/password/check',{},{oldPassword:password})
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
        
        function _updatePassword(newPass){
			var deferred = $q.defer();
			
            serviceCaller.doRequest('PUT','api/v1/user/password',{},{newPass:newPass})
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

        return{
            getUser: _getUser,
            checkEmail: _checkEmail,
            checkPassword: _checkPassword,
            updatePassword: _updatePassword,
            update: _update
        }


  }





})();
