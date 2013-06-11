'use strict';

angular.module('dashboardApp')
  .controller('LogoutCtrl', ['$scope', 'authService', '$location', function ($scope, authService, $location) {
    authService.logout();
    $location.path('/');
    return;
  }]);
