'use strict';
/*global $:false*/

angular.module('dashboardApp.services')
  .factory('sensors',
    ['$q', 'csResource', 'authService',
    function ($q, csResource, authService) {
    function Sensors() {
      this.listAllSensor = function() {
        var deffered = $q.defer();
        var sensorGroupDeffered = $q.defer();

        // get sensor
        var allSensorPromise = csResource.getAllData(csResource.Sensor, {}, 'sensors');

        // get all group
        var allGroupPromise = csResource.getAllData(csResource.Group, {}, 'groups');

        allGroupPromise.then(function(groups) {
          // get all sensor belongs to group
          var groupPromise  = [];
          for (var i in groups) {
            groupPromise.push(csResource.getAllData(csResource.GroupSensor, {groupId: groups[i].id, details: 'full'}, 'sensors'));
          }

          $q.all(groupPromise).then(function(sensors) {

            var retval = [];
            for (var i in sensors) {
              retval = retval.concat(sensors[i]);
            }
            sensorGroupDeffered.resolve(retval);
          }, function() { console.log('error while getting sensor from groups'); }
          );

        }, function() { console.log('error getting list of sensor of a group'); }
        );

        var promise = $q.all([allSensorPromise, sensorGroupDeffered.promise]);
        promise.then(function(sensorArray) {
          var retval = [];
          var currentUserId = authService.currentUser.user.id;

          for (var i in sensorArray) {
            // assign current_user for the first promise (own sensor)
            var current = sensorArray[i];
            for (var j in current) {
              var sensor = current[j];
              if (!sensor) { continue; }
              if (!sensor.owner) {
                sensor.owner = {id: currentUserId};
              }
            }

            retval = retval.concat(sensorArray[i]);
          }
          deffered.resolve(retval);
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

    return new Sensors();
  }])
;

