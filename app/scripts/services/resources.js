'use strict';

angular.module('dashboardApp.resource', [])
  .service('csResource', ['$resource', '$http', '$q', function($resource, $http, $q) {
    this.baseUri = 'http://api.sense-os.nl';

    this.CurrentUser = $resource(this.baseUri + '/users/current.json');

    this.User = $resource(this.baseUri + '/users/:id.json', {id: '@id'});

    this.Group = $resource(this.baseUri + '/groups.json', {}, { query: {method:'GET', isArray:false}});

    this.GroupUser = $resource(this.baseUri + '/groups/:groupId/users', {}, { query: {method:'GET', isArray:false}});

    this.GroupSensor = $resource(this.baseUri + '/groups/:groupId/sensors', {}, { query: {method:'GET', isArray:false}});

    this.Sensor = $resource(this.baseUri + '/sensors.json', {}, { query: {method:'GET', isArray:false}});

    this.MultipleSensorData = $resource(this.baseUri + '/sensors/data.json', {}, { query: {method:'GET', isArray:false}});

    this.SensorData = $resource(this.baseUri + '/sensors/:id/data.json', {id: '@id'}, { query: {method:'GET', isArray:false}});

    this.getDataRec = function(resource, parameter, resourceName, page, perPage, result, deferred) {
      var param = angular.extend({page: page, 'per_page': perPage}, parameter);
      var self = this;
      resource.query(param, function(cresult) {
        result = result.concat(cresult[resourceName]);
        if (cresult[resourceName].length === perPage) {
          self.getDataRec(resource, parameter, resourceName, page + 1, perPage, result, deferred);
        } else {
          deferred.resolve({success: true, result: result});
        }
      }, function() {
        // TODO: Handle 409 to retry the call
        console.log('error while retreiving resource');
        deferred.resolve({success: false, result: result});
      });
    };

    this.getAllData = function(resource, parameter, resourceName) {
      var deferred = $q.defer();
      this.getDataRec(resource, parameter, resourceName, 0, 1000, [], deferred);

      return deferred.promise;
    };
  }])
;

