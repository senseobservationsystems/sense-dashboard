'use strict';
/* jshint camelcase: false */

angular.module('dashboardApp.services')
  .factory('dashboardService',
      ['$q', 'csResource',
      function ($q, csResource) {

    function DashboardService() {
      this.users = {}; // user resource
      this.userIds = []; // list of user_id on this group
	    this.userIdMap = {}; // map user_id to user object
      this.sensorIds = []; // list of sensor_id on this group
	    this.sensorIdMap = {}; // map sensor_id to sensor object
      this.currentUser = {};
      this.timer = null;
      this.window = 5 * 60; // data window. in seconds

      this.getUsers = function(groupId, currentUser) {
        this.currentUser = currentUser;
        var deferred = $q.defer();

        // getting group user list from commonsense
        var self = this;
        self.users = csResource.GroupUser.query({groupId: groupId}, function(users) {
          for (var i=0; i < users.users.length; i++) {
            var user = self.users.users[i];
            //user.location = user.reachability = ''; // initial state
            self.userIds.push(user.id);
            self.userIdMap[user.id] = user;
          }

          // getting related sensor
          csResource.GroupSensor.query({groupId: groupId, details: 'full'}, function(result) {
            var failure = function() {
              console.log('failed while getting last data point for sensor' + sensor.id);
            };

            var processResult = function(result) {
              if (result.data.length > 0) {
                var sensorId = result.data[0].sensor_id;
                var sensor = self.sensorIdMap[sensorId];
                sensor.processData(result.data);
              }
            };
            for (var i=0; i < result.sensors.length; i++) {
              var sensor = result.sensors[i];
              if (self.keepSensor(sensor)) {
                self.sensorIds.push(sensor.id);
                self.sensorIdMap[sensor.id] = sensor;
                if (sensor.owner) {
                  sensor.user = self.userIdMap[sensor.owner.id];
                } else {
                  sensor.user = currentUser;
                }

                // give function to process sensor data
                if (sensor.name === 'Location') {
                  sensor.processData = self.processLocation;
                } else if (sensor.name === 'Reachability') {
                  sensor.processData = self.processReachability;
                } else {
                  sensor.processData = self.processNothing;
                }

                // get the last data point for each of the sensor
                csResource.SensorData.query({id: sensor.id, last: 1}, processResult, failure);
              }
            }

            deferred.resolve(self.users);
          });

        });

        return deferred.promise;
      };

      /**
       * only return if owner sensor is on the userids list, and sensor name is "location", "reachability"
       */
      this.keepSensor = function(sensor) {
        var owner = sensor.owner;
        if (!owner) { // no owner property means it's the user's sensor
          sensor.owner = {id: this.currentUser.id};
          return true;
        }

        var keepsensor = ['Location', 'Reachability'];
        return  this.userIds.indexOf(owner.id) >= 0 && keepsensor.indexOf(sensor.name) >= 0;
      };

      /** this function get last sensor data from commonsense
       */
      this.fetchSensorData = function() {
        var startDate = (new Date()).getTime() / 1000 - this.window;
        //var startDate = (new Date()).getTime() / 1000 - (60*60); // 5 minutes ago
        console.log('fetching sensor data ' + startDate);

        var self = this;
        var params = {'start_date': startDate};
        for (var i in this.sensorIds) {
          params['sensor_id[' + i + ']' ] = this.sensorIds[i];
        }

        var promise = csResource.getAllData(csResource.MultipleSensorData, params, 'data');
        promise.then(function(value) {
          // for each sensor get only last data point
          var dataSensorMap = {};
          if (value) {
            for (var i = 0; i < value.length; i++) {
              var data = value[i];
              if (!dataSensorMap[data.sensor_id]) {
                dataSensorMap[data.sensor_id] = [data];
              } else {
                dataSensorMap[data.sensor_id].push(data);
              }
            }
          }

          // make each sensor process the last data point
          for (var key in self.sensorIdMap) {
            var sensor = self.sensorIdMap[key];
            sensor.processData(dataSensorMap[sensor.id]);
          }
        },
        function(reason) {
          console.log('error while fetching data ' + reason);
        });
      };

      /**
       * Process location data
       * @param data Array array of sensor data
       */
      this.processLocation = function(data) {
        if (data && data.length > 0) {
          var location = 'Unknown';
          var point = data[data.length -1];
          var now = (new Date()).getTime() / 1000;

          // only accept last 12 hour data
          if (now - point.date < 12 * 60 * 60) {
            location = point.value;
          }

          this.user.location = location;
        }
      };

      this.processReachability = function(data) {
        var reachable = 'reachable';

        if (data && (data.length > 0) ) {
          var point = data[data.length -1];
          var now = (new Date()).getTime() / 1000;

          if (now - point.date < 12 * 60 * 60) {
            reachable = point.value;
          }
        }

        this.user.reachability = reachable;
      };

      this.processNothing = function() {
        // noop
      };
    }

    return new DashboardService();
  }])
;

