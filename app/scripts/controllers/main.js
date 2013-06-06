'use strict';

angular.module('dashboardApp')
  .controller('MainCtrl', ['$scope', 'authService', '$window', '$location', function ($scope, authService, $window, $location) {
    $scope.user = {};

    $scope.doLogin = function() {
      authService.login($scope.user.username, $scope.user.password).then(function() {
        var location = '/dashboard';
        if ($location.search().r) {
          location = $location.search().r;
        }
        $location.path(location);
      },
      function(error) {
        $window.alert('Login Failed : ' + error.data.error);
      });
    };
  }]);
