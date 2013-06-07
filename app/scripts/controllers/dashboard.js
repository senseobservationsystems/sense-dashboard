'use strict';
/* global dashboardDebug */

angular.module('dashboardApp')
  .controller('DashboardCtrl',
      ['$scope', '$location', '$timeout', 'authService', 'dashboardService',
      function ($scope, $location, $timeout, authService, dashboardService) {
    $scope.loggedIn = authService.loggedIn;
    if (!$scope.loggedIn) {
      $location.path('/');
      return;
    }

    $scope.$watch(function() {
      return dashboardDebug;
    }, function() {
      $scope.dashboardDebug = dashboardDebug;
    });

    $scope.pollData = function() {
      $scope.timer = $timeout(function() {
        dashboardService.fetchSensorData();
        $scope.pollData();
      }, 2000); //pool new data every 2 second
    };

    $scope.initialize = function() {
      dashboardService.initialize(1875, authService.currentUser.user).then(
        function(users) {
          $scope.users = users;
          dashboardService.fetchSensorData();
          $scope.pollData();
        }
      );
    };

    $scope.$on('$destroy', function() {
      $timeout.cancel($scope.timer);
    });

    $scope.fullName = function(user) {
      return user.name + ' ' + user.surname;
    };

    function compare(a,b) {
      if (a && !b) { return 1; }
      if (!a && b) { return -1; }
      if (!a && !b) { return 0; }
      if (a < b) { return -1; }
      if (a > b) { return 1; }
      return 0;
    }

    function compareWho(a,b) {
      var result = compare($scope.fullName(a), $scope.fullName(b));
      return result;
    }

    function compareWhere(a,b) {
      return compare(a.location, b.location);
    }

    function compareReachable(a,b) {
      return compare(a.reachability, b.reachability);
    }


    $scope.sortUser = function(column) {
      $scope.sort = column.toLowerCase();
      $scope.dir = $scope.dir === 'asc' ? 'desc': 'asc';

      switch(column) {
      case 'who':
        $scope.users.users.sort(compareWho);
        break;
      case 'where':
        $scope.users.users.sort(compareWhere);
        break;
      case 'reachable':
        $scope.users.users.sort(compareReachable);
        break;
      }

      if ($scope.dir === 'desc') {
        $scope.users.users.reverse();
      }
    };
  }]);
