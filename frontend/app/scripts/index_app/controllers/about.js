'use strict';

/**
 * @ngdoc function
 * @name tesiApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the tesiApp
 */
angular.module('tesi.indexApp')
  .controller('AboutCtrl', ['$scope', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  }]);
