'use strict';
/*global Highcharts:false*/

angular.module('dashboardApp')
  .controller('PersonCtrl',
  ['$scope', '$location', '$routeParams', '$window', '$timeout', 'authService', 'sensors', 'csResource',
  'chartService',
  function ($scope, $location, $routeParams, $window, $timeout, authService, sensors, csResource, chartService) {
    var loggedIn = authService.loggedIn;
    if (!loggedIn) {
      //set redirection to this page as r, redirect to main page
      $window.location.href = '/';
      //$location.search('r', $location.path()).path('/');
      return;
    } else {
      $location.search('r', null);
    }

    $scope.userId = $routeParams.id;

    if ($scope.userId === authService.currentUser.user.id) {
      $scope.user = authService.currentUser.user;
    } else {
      // now try group user
      csResource.GroupUser.query({groupId: '1875'}, function(users) {
        for (var i=0; i < users.users.length; i++) {
          var user = users.users[i];
          if (user.id === $scope.userId) {
            $scope.user = user;
          }
        }
      });
    }

    $scope.sensors = [];

    sensors.listAllSensor().then(function(result){
      $scope.sensors = result;
      var weatherSensors = sensors.findFirstSensor(result, 'weather', $scope.userId);
      $scope.weatherSensor = weatherSensors[weatherSensors.length -1];

      var locationSensors = sensors.findFirstSensor(result, 'Location', $scope.userId);
      $scope.locationSensor = locationSensors[locationSensors.length -1];

      var sleepSensors = sensors.findFirstSensor(result, ['sleep', 'Sleep', 'Sleep Time', 'sleep_time'], $scope.userId);
      $scope.sleepSensor = sleepSensors[sleepSensors.length -1];

      var reachabilitySensors = sensors.findFirstSensor(result, 'Reachabilitys', $scope.userId);
      $scope.reachabilitySensor = reachabilitySensors[reachabilitySensors.length -1];

      var accelerometerSensors = sensors.findFirstSensor(result, 'accelerometer', $scope.userId);
      $scope.accelerometerSensor = accelerometerSensors[accelerometerSensors.length - 1];

      var activitySensors = sensors.findFirstSensor(result, 'Activity', $scope.userId);
      $scope.activitySensor = activitySensors[activitySensors.length - 1];


      if ($scope.weatherSensor) {
        //var aDayAgo = (new Date()).getTime() / 1000 - 24 * 60 * 60;
        var aWeekAgo = (new Date()).getTime() / 1000 - 7 * 24 * 60 * 60;
        var weatherInterval = 60*60; // hourly
        chartService.personalWeatherChart($scope.weatherSensor, aWeekAgo, weatherInterval).then(
            function(chart) {
              // this one directly render to #weatherChart because it has a tooltip.formatter
              // which not work for the `chart` directive
              chart.chart.renderTo = 'weatherChart';
              new Highcharts.Chart(chart);
            }
            );
      }

      if ($scope.sleepSensor) {
        var aMonthAgo = (new Date()).getTime() / 1000 - (30 * 24 * 60 * 60);
        var sleepInterval = 86400; // daily
        chartService.sleepChart($scope.sleepSensor, aMonthAgo, sleepInterval).then(
          function(chart) {
            // this one use `chart` directive to render
            $scope.personalSleepData = chart;
          }
        );
      }

      if ($scope.activitySensor) {
        var anHourAgo = (new Date()).getTime() / 1000 - (60 * 60);
        var activityInterval = 60; // minute
        chartService.activityChart($scope.activitySensor, anHourAgo, activityInterval).then(
          function(chart) {
            // this one use `chart` directive to render
            chart.chart.renderTo = 'activityChart';
            chart.chart.height = 220;
            var highchart = new Highcharts.Chart(chart);
            $scope.personalActivityChart = highchart;

            // update accelerometer data every 5 second
            var data = chart.series[0].data;
            var lastDate;
            if (data.length > 0) {
              lastDate = data[data.length-1].date/1000;
            }
            if (!lastDate) {
              console.log('no last date');
              lastDate = anHourAgo;
            }
            function updateActivity() {
              console.log('updating activity data');
              $scope.activityTimer = $timeout(function() {
                var sensorId = $scope.activitySensor.id;
                csResource.getAllData(csResource.SensorData, {id: sensorId, 'start_date': lastDate}, 'data').then(
                  function(data) {
                    if (data && data.length > 0 && data[data.length-1].date !== lastDate) {
                      console.log('got new activity data');
                      var series = highchart.series;
                      var serie = series[0];
                      lastDate = serie.data[serie.data.length-1].x;
                      for (var i in data) {
                        var point = data[i];
                        var value = point.value;
                        var date = point.date * 1000;
                        var activity = ['unknown', 'sit', 'stand'].indexOf(value);

                        if (!lastDate || date > lastDate) {
                          serie.addPoint([date, activity], true, true);
                          lastDate = date / 1000;
                        }
                      }
                    } else {
                      console.log('old data');
                    }
                  },
                  function() {
                    console.log('error while updating activity data');
                  }
                );
                updateActivity();
              }, 5000);
            }
            updateActivity();
          }
        );
      }

      if ($scope.accelerometerSensor) {
        var fiveMinuteAgo = (new Date()).getTime() / 1000 - (5 * 60);
        var accelerometerInterval = null;
        chartService.accelerometerChart($scope.accelerometerSensor, fiveMinuteAgo, accelerometerInterval).then(
          function(chart) {
            // this one use `chart` directive to render
            chart.chart.renderTo = 'accelerometerChart';
            chart.chart.height = 220;
            var highchart = new Highcharts.Chart(chart);
            $scope.personalAccelerometerData = highchart;

            // update accelerometer data every 5 second
            var lastData = null;
            var data = chart.series[0].data;
            var lastDate;
            if (data.length > 0 ) {
              lastDate = data[data.length-1].x/1000;
            }
            if (!lastDate) {
              console.log('no last date');
              lastDate = fiveMinuteAgo;
            }
            function updateAccelerometer() {
              $scope.accelerometerTimer = $timeout(function() {
                var sensorId = $scope.accelerometerSensor.id;
                csResource.getAllData(csResource.SensorData, {id: sensorId, 'start_date': lastDate}, 'data').then(
                  function(data) {
                    if (data && data.length > 0 && data[data.length-1].date !== lastDate) {
                      lastData = data[data.length-1];
                      lastDate = lastData.date;
                      for (var i in data) {
                        var point = data[i];
                        var value = JSON.parse(point.value);
                        var series = highchart.series;
                        var date = point.date * 1000;
                        var xaxis = value['x-axis'];
                        var yaxis = value['y-axis'];
                        var zaxis = value['z-axis'];
                        series[0].addPoint([date, xaxis], true, true);
                        series[1].addPoint([date, yaxis], true, true);
                        series[2].addPoint([date, zaxis], true, true);
                      }
                    } else {
                      //console.log('old data');
                    }
                  },
                  function() {
                    console.log('error while updating accelerometer data');
                  }
                );
                updateAccelerometer();
              }, 5000);
            }
            updateAccelerometer();
          }
        );
      }

      // kill timer on destroy
      $scope.$on('$destroy', function() {
        console.log('destroy: clearing timeout');
        $timeout.cancel($scope.accelerometerTimer);
        $timeout.cancel($scope.activityTimer);
      });
    });

  }]);
