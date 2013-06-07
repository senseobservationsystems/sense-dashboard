'use strict';
/*global Highcharts:false*/

angular.module('dashboardApp.services')
  .factory('chartService',
    ['$q', 'csResource', 'csUtil',
    function ($q, csResource, csUtil) {
      Highcharts.setOptions({
        global: {
          useUTC: false
        }
      });

      /**
       * function to transform sensor data JSON to time series that is understood by highcharts
       * @param data sensor data object
       */
      function weatherDataToSeries(data) {
        var retval = [];
        // temperature
        var temperature = { name: 'Temperature (°C)', data: []};
        var humidity = { name: 'Humidity (%)', data: []};

        for (var i in data) {
          var date = data[i].date * 1000;
          var value = JSON.parse(data[i].value);

          var temp = value.temp - 273.15; // in kelvin
          temp = getFloat(temp, 2);
          temperature.data.push({
            x: date,
            y:temp,
            city: value.city
          });
          if(!value.humidity) { value.humidity = null; }
          humidity.data.push({x:date, y:value.humidity});
        }
        retval.push(temperature);
        retval.push(humidity);

        return retval;
      }

      /**
       * function to transform sensor data to JSON to time series that is understood by highcharts
       * @param data sensor data object
       */
      function numberDataToSeries(data) {
        var retval = [];
        // temperature
        var sleep = { pointInterval: 24 * 3600* 1000, name: 'Sleep (Hours)', data: [], type: 'column' };

        for (var i in data) {
          var date = data[i].date * 1000;
          var value = getFloat(data[i].value, 2);
          sleep.data.push({x: date, y: value});
        }
        retval.push(sleep);

        return retval;
      }

      function accelerometerDataToSeries(data) {
        var retval = [];
        // temperature
        var xaxis = { name: 'X axis', data: [], type: 'line' };
        var yaxis = { name: 'Y axis', data: [], type: 'line' };
        var zaxis = { name: 'Z axis', data: [], type: 'line' };

        for (var i in data) {
          var date = data[i].date * 1000;
          var value = JSON.parse(data[i].value);
          xaxis.data.push({x: date, y: getFloat(value['x-axis'], 3)});
          yaxis.data.push({x: date, y: getFloat(value['y-axis'], 3)});
          zaxis.data.push({x: date, y: getFloat(value['z-axis'], 3)});
        }
        retval.push(xaxis);
        retval.push(yaxis);
        retval.push(zaxis);

        return retval;
      }

      function activityDataToSeries(data) {
        var retval = [];
        var activities = ['unknown', 'sit', 'stand'];
        // temperature
        var activity = { name: 'Activity', data: [], type: 'line' };

        for (var i in data) {
          var date = data[i].date * 1000;
          var value = data[i].value;
          var activityIndex = activities.indexOf(value);
          activity.data.push({x: date, y: activityIndex});
        }
        retval.push(activity);

        return retval;
      }

      function getFloat(value, comma) {
        return csUtil.getFloat(value, comma);
      }


      /**
       * Main Service class
       */
      function ChartService() {

        /**
         * function to create personal weather graph
         * @param sensor the sensor object
         * @param start Date epoch time of the start date
         */
        this.personalWeatherChart = function(sensor, startDate, interval) {
          var deferred = $q.defer();

          // get all data point from StartDate
          csResource.getAllData(csResource.SensorData, {id: sensor.id, 'start_date': startDate, interval: interval}, 'data').then(
            function(response) {
              if (!response.success) {
                console.log('error while getting personal weather data');
                return;
              }
              var value = response.result;
              // transform Information to time series
              var series = weatherDataToSeries(value);
              var chart = {
                  chart: {
                    zoomType: 'x'
                  },
                  title: null,
                  yAxis: [{
                    labels: {
                      format: '{value}°C'
                    },
                    title: {
                      text: 'Temperature'
                    }
                  },
                  {
                    labels: {
                      format: '{value}%'
                    },
                    title: {
                      text: 'Humidity (%)'
                    },
                    opposite: true,
                    linkTo: 0
                  }
                  ],
                  xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: {
                      day: '%e. %b'
                    }
                  },
                  series: series,
                  tooltip: {
                    crosshairs: true,
                    shared: true,
                    formatter: function() {
                      var s = '<b>' + Highcharts.dateFormat('%a, %e %b %Y %H:%M',this.x) + '</b>';
                      for (var i in this.points) {
                        var point = this.points[i];
                        s += '<br/>';
                        s += '<span style="color:' + point.series.color + '">' + point.series.name + '</span>: <b>' + point.y + '</b>';

                        if (point.point.hasOwnProperty('city')) {
                          s += '<br/>' + 'city : ' + point.point.city;
                        }
                      }

                      return s;
                    }
                  }
                };

              deferred.resolve(chart);
            },
            function() { console.log('failed while fetching data for sensor: ' + sensor.id); }
          );

          return deferred.promise;
        };

        this.sleepChart = function(sensor, startDate, interval) {
          var deferred = $q.defer();

          // get all data point from StartDate
          csResource.getAllData(csResource.SensorData, {id: sensor.id, 'start_date': startDate, interval: interval}, 'data').then(
            function(response) {
              if (response.value) {
                console.log('error while getting sleep data');
                return;
              }
              var value = response.result;
              // transform Information to time series
              var series = numberDataToSeries(value);
              var chart = {
                  chart: {
                  },
                  title: null,
                  xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: {
                      day: '%e. %b'
                    },
                    minTickInterval: 24 * 3600 * 1000
                  },
                  series: series
                };

              deferred.resolve(chart);
            },
            function() { console.log('failed while fetching data for sensor: ' + sensor.id); }
          );

          return deferred.promise;
        };

        this.accelerometerChart = function(sensor, startDate, interval) {
          var deferred = $q.defer();

          // get all data point from StartDate
          csResource.getAllData(csResource.SensorData, {id: sensor.id, 'start_date': startDate, interval: interval}, 'data').then(
            function(response) {
              if (response.value) {
                console.log('error while getting accelerometer data');
                return;
              }
              var value = response.result;

              // transform Information to time series
              var series = accelerometerDataToSeries(value);
              var chart = {
                  chart: {
                  },
                  title: null,
                  xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: {
                      day: '%e. %b'
                    }
                  },
                  plotOptions: {
                    line: {
                      marker: {
                        enabled: false
                      }
                    }
                  },
                  tooltip: {
                    shared: true,
                    crosshairs: true
                  },
                  series: series
                };

              deferred.resolve(chart);
            },
            function() { console.log('failed while fetching data for sensor: ' + sensor.id); }
          );

          return deferred.promise;
        };

        this.activityChart = function(sensor, startDate, interval) {
          var deferred = $q.defer();

          // get all data point from StartDate
          csResource.getAllData(csResource.SensorData, {id: sensor.id, 'start_date': startDate, interval: interval}, 'data').then(
            function(response) {
              if (response.value) {
                console.log('error while getting activity data');
                return;
              }
              var value = response.result;

              // transform Information to time series
              var series = activityDataToSeries(value);
              var chart = {
                chart: {
                },
                title: null,
                xAxis: {
                  type: 'datetime',
                  dateTimeLabelFormats: {
                    day: '%e. %b'
                  }
                },
                yAxis: {
                  title: {
                    text: 'Activity'
                  },
                  min: 0,
                  minorGridLineWidth: 0,
                  gridLineWidth: 0,
                  alternateGridColor: null,
                  plotBands: [{ // Light air
                    from: 0,
                    to: 1.5,
                    color: 'rgba(68, 170, 213, 0.1)',
                    label: {
                      text: 'Sit',
                      style: {
                        color: '#606060'
                      }
                    }
                  }, {
                    from: 1.5,
                    to: 2.5,
                    color: 'rgba(0, 0, 0, 0)',
                    label: {
                      text: 'Stand',
                      style: {
                        color: '#606060'
                      }
                    }
                  }]
                },
                series: series,
                tooltip: {
                  crosshairs: true,
                  formatter: function() {
                    var s = '<b>' + Highcharts.dateFormat('%a, %e %b %Y %H:%M',this.x) + '</b>';
                    var point = this;
                    s += '<br/>';
                    s += '<span style="color:' + point.series.color + '">' + point.series.name + '</span>: <b>' + ['unknown', 'Sit', 'Stand'][point.y] + '</b>';

                    return s;
                  }
                }
              };

              deferred.resolve(chart);
            },
            function() { console.log('failed while fetching data for sensor: ' + sensor.id); }
          );

          return deferred.promise;
        };
      }

      return new ChartService();

    }]
  )
;

