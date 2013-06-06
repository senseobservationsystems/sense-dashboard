'use strict';

angular.module('dashboardApp.services')
  .factory('csUtil',
    [
    function () {
      function CsUtil() {
        this.getFloat = function(value, comma) {
          value = parseFloat(value);
          var power = Math.pow(10, comma);
          return Math.round(value * power) / power;
        };
      }

      return new CsUtil();
    }
  ])
;

