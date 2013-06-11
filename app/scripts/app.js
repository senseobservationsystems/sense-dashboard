'use strict';
/* jshint unused: false */

var dashboardDebug = false;
angular.module('dashboardApp',
  ['ngResource', 'ngCookies', 'dashboardApp.services', 'gravatarFilters', 'highcharts.directives'])
  .config(function ($routeProvider, $httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $routeProvider
      .when('/', {
        templateUrl: 'views/login.html',
        controller: 'MainCtrl'
      })
      .when('/dashboard', {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl'
      })
      .when('/person/:id', {
        templateUrl: 'views/person.html',
        controller: 'PersonCtrl'
      })
      .when('/logout', {
        templateUrl: 'views/login.html',
        controller: 'LogoutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
