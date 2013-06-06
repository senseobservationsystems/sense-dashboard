'use strict';
/*global Crypto:false*/

angular.module('dashboardApp.services', ['dashboardApp.resource'])
  .service('authService',
     ['$q', '$http', 'csResource','$cookies',
      function($q, $http, csResource, $cookies) {
    this.sessionId = '';
    this.currentUser = {};

    this.loggedIn = false;

    this.login = function(username, password) {
      var deffered = $q.defer();
      var user = {'username': username, 'password': Crypto.MD5(password)};

      var self = this;
      $http.post(csResource.baseUri + '/login.json', user)
      .success(function(data, status, headers) {
        self.sessionId = headers('X-SESSION_ID');
        $cookies.sessionId = self.sessionId;
        $http.defaults.headers.common['X-SESSION_ID'] = self.sessionId;

        self.loggedIn = true;
        self.currentUser = csResource.CurrentUser.get(function() {
          deffered.resolve(self.sessionId);
        });
      })
      .error(function(data, status) {
        var reason = {message: 'Cant login to commonsense', data: data, status: status};
        self.loggedIn = false;
        deffered.reject(reason);
      });

      // only execute after two are done

      return deffered.promise;
    };
  }]);

