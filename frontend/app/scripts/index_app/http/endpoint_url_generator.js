(function () {
    'use strict';

    angular.module('tesi.indexApp').factory('endpointUrlGenerator', endpointUrlGenerator);

    function endpointUrlGenerator(env_config) {

        function createURL(endpointName, pathParams, queryParams) {
            var url = env_config.apiURL.concat('/') + endpointName;

            if (pathParams) {
                angular.forEach(pathParams, function (value, key) {
                    url = url.concat('/');
                    if (!(key.indexOf('_') === 0)) {
                        url = url.concat(value + '/' + key);
                    }
                    else {
                        url = url.concat(value);
                    }
                });
            }

            if (queryParams) {
                url = url.concat('?');
                angular.forEach(queryParams, function (value, key) {
                    url = url.concat(key + '=' + value);
                });
            }
            return url;
        }

        return {
            createURL: createURL
        };

    }
})();
