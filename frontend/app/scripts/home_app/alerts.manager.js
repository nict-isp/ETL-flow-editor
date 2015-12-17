angular.module('tesi.homeApp').factory('alertsManager', [function() {
	'use strict';
    return {
        alerts: {},
        addAlert: function(message, type) {
            this.alerts[type] = this.alerts[type] || [];
            this.alerts[type].push(message);
        },
        clearAlerts: function() {
            for(var x in this.alerts) {
                delete this.alerts[x];
            }
        }
    };
}]);
