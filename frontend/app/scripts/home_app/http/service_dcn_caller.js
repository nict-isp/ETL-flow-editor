(function(){

 angular.module('tesi.homeApp').service('serviceDcnCaller', serviceDcnCaller);

   function serviceDcnCaller($http, $q, endpointUrlGenerator,$window){

     window.authHeaders = {};

      function _doGetRequest(endpointName, pathParams){
        var deferred = $q.defer(),
            endpointUrl = endpointUrlGenerator.createDCNURL(endpointName, pathParams);          
            var responsePromise = $http({method: 'get', url: endpointUrl, headers: window.authHeaders }); 
 
            responsePromise.success(function(response) {				
                      deferred.resolve(response) });

            responsePromise.error(function(response) {
                      deferred.reject(response) });

        return deferred.promise;

      }

      function _doPostRequest(endpointName, pathParams, bodyParams){

       var deferred = $q.defer(),
           endpointUrl = endpointUrlGenerator.createDCNURL(endpointName, pathParams);
		   responsePromise = $http({method: 'POST', url: endpointUrl, transformResponse: undefined, data: bodyParams, headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

           responsePromise.success(function(response, status, headers, config) {
			   console.log("Success status " + status);
               deferred.resolve(response) }
           );

           responsePromise.error(function(response, status, headers, config) {
			   console.log("Error status " + status);			   
               deferred.reject(response) }
           );

         return deferred.promise;
      }

       function _doPutRequest(endpointName, pathParams, bodyParams){

           var deferred = $q.defer(),
               endpointUrl = endpointUrlGenerator.createDCNURL(endpointName, pathParams),

               responsePromise = $http({method: 'put', url: endpointUrl, headers: authHeaders, data: bodyParams});

           responsePromise.success(function(response) {
               deferred.resolve(response) });

           responsePromise.error(function(response) {
               deferred.reject(response) });

           return deferred.promise;
       }
       
       function _doDeleteRequest(endpointName, pathParams, bodyParams){

           var deferred = $q.defer(),
               endpointUrl = endpointUrlGenerator.createDCNURL(endpointName, pathParams),

               responsePromise = $http({method: 'delete', url: endpointUrl, headers: authHeaders, data: bodyParams});

           responsePromise.success(function(response) {
               deferred.resolve(response) });

           responsePromise.error(function(response) {
               deferred.reject(response) });

           return deferred.promise;
       }       


      function _doRequest(METHOD, endpointName, pathParams, bodyParams){
        _setAuthHeaders();
        if(METHOD === 'GET'){
         return _doGetRequest(endpointName, pathParams)
        }
        else if(METHOD === 'POST'){
         return _doPostRequest(endpointName, pathParams, bodyParams)
        }
        else if(METHOD == 'PUT'){
		  return _doPutRequest(endpointName, pathParams, bodyParams)
		}
        else if(METHOD == 'DELETE'){
		  return _doDeleteRequest(endpointName, pathParams, bodyParams)
		}
		

      }

      function _setAuthHeaders(){

       /*var token = $window.sessionStorage.getItem("token");
        if(token){       
           window.authHeaders = {'X-Access-Token': token, 'Authorization': 'Bearer ' + token};
         }*/
      }

      function _isSuccessResponse(response){
        if(response != null){
          return true
        }
        return false
      }

     return {
      doRequest : _doRequest,
      isSuccessResponse: _isSuccessResponse
     }

   }

})();
