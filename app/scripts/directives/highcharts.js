'use strict';
/*global $:false*/
/*global Highcharts:false*/

angular.module('highcharts.directives',[])

.directive('chart', function () {
  return {
    restrict: 'E',
    template: '<div></div>',
    transclude:true,
    replace: true,

    link: function (scope, element, attrs) {
      var chartsDefaults = {
        chart: {
          renderTo: element[0],
          type: attrs.type || null,
          height: attrs.height || null,
          width: attrs.width || null
        }
      };

      //Update when charts data changes
      scope.$watch(function() { return attrs.value; }, function() {
        if(!attrs.value) {
          element.text('No data found');
        }
        // We need deep copy in order to NOT override original chart object.
        // This allows us to override chart data member and still the keep
        // our original renderTo will be the same
        var deepCopy = true;
        var newSettings = {};
        try {
          $.extend(deepCopy, newSettings, chartsDefaults, JSON.parse(attrs.value));
          new Highcharts.Chart(newSettings);
        } catch(err) {}
      });
    }
  };
});
