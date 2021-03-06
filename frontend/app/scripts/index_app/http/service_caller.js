(function(){

 angular.module('tesi.indexApp').service('serviceCaller', serviceCaller);

   function serviceCaller($http, $q, endpointUrlGenerator,$window){

      var authHeaders = {};
      window.authHeaders = {};
      
      function _doGetRequest(endpointName, pathParams){

        var deferred = $q.defer(),
            endpointUrl = endpointUrlGenerator.createURL(endpointName, pathParams);

        var responsePromise = $http({method: 'get', url: endpointUrl, headers: window.authHeaders});

        responsePromise.success(function(response) {
            deferred.resolve(response) });

        responsePromise.error(function(response) {
            deferred.reject(response) });

        return deferred.promise;

      }

      function _doPostRequest(endpointName, pathParams, bodyParams){

       var deferred = $q.defer(),
           endpointUrl = endpointUrlGenerator.createURL(endpointName, pathParams);
       var responsePromise = $http({method: 'post', url: endpointUrl, data: bodyParams, headers: window.authHeaders});

           responsePromise.success(function(response) {
                     deferred.resolve(response) });

           responsePromise.error(function(response) {
                     deferred.reject(response) });

         return deferred.promise;
      }

       function _doPutRequest(endpointName, pathParams, bodyParams){

           var deferred = $q.defer(),
               endpointUrl = endpointUrlGenerator.createURL(endpointName, pathParams);

           var responsePromise = $http({method: 'put', url: endpointUrl, headers: window.authHeaders, data: bodyParams});

           responsePromise.success(function(response) {
               deferred.resolve(response) });

           responsePromise.error(function(response) {
               deferred.reject(response) });

           return deferred.promise;
       }


      function _setAuthHeaders(){
          var token_local = $window.localStorage['token'];
          if(token_local){       
              window.authHeaders = {'X-Access-Token': token_local, 'Authorization': 'Bearer ' + token_local};
          }
      }


      function _doRequest(METHOD, endpointName, pathParams, bodyParams){
        _setAuthHeaders();
        if(METHOD === 'GET'){
         return _doGetRequest(endpointName, pathParams)
        }
        if(METHOD === 'POST'){
         return _doPostRequest(endpointName, pathParams, bodyParams)
        }

          if(METHOD == 'PUT'){
              return _doPutRequest(endpointName, pathParams, bodyParams)
          }

      }

      function _isSuccessResponse(response){
        if(response && response.status === 'success'){
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
