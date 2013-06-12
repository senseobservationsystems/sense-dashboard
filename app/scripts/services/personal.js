'use strict';
/*global $:false*/

angular.module('dashboardApp.services')
  .factory('personalSensor',
    ['$q', 'csResource', 'authService',
    function ($q, csResource, authService) {
    function PersonalSensor() {
      this.initialize = function(groupId) {
        var deffered = $q.defer();

        csResource.getAllData(csResource.GroupSensor, {groupId: groupId, details: 'full'}, 'sensors').then(function(response) {
          if (!response.success) {
            console.log('error getting sensor for group ' + groupId);
            deffered.reject();
          }

          var sensors = response.result;
          var currentUserId = authService.currentUser.user.id;

          for (var j in sensors) {
            var sensor = sensors[j];
            if (!sensor) { continue; }
            if (!sensor.owner) {
              sensor.owner = {id: currentUserId};
            }
          }

          deffered.resolve(sensors);
        });

        return deffered.promise;
      };

      /**
       * function to get Sensor From list of sensor
       * @param sensorArray the list of sensors
       * @param name  Sensor Name or array of sensor name
       * @param owner (optional) user id of the owner of the sensor. use 'me' for returning own sensor
       */
      this.findFirstSensor = function(sensorArray, name, ownerId) {
        var retval = [];
        if (!$.isArray(name)) { name = [name]; }
        for (var i in sensorArray) {
          var sensor = sensorArray[i];
          if (!sensor) { continue; }

          if (name.indexOf(sensor.name) >= 0) {
            if (!ownerId) {
              retval.push(sensor);
            } else if (ownerId && sensor.owner.id === ownerId) {
              retval.push(sensor);
            }
          }
        }

        retval.sort(this.compareSensorById);
        return retval;
      };

      this.compareSensorById = function(a, b) {
        if (a && !b) { return 1; }
        if (!a && b) { return -1; }
        if (!a && !b) { return 0; }
        var idA = parseInt(a.id, 10);
        var idB = parseInt(b.id, 10);
        if (idA < idB) { return -1; }
        if (idA > idB) { return 1; }
        return 0;
      };
    }

    return new PersonalSensor();
  }])
;

