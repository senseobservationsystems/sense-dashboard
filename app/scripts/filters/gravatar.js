'use strict';
/*global Crypto:false*/

angular.module('gravatarFilters', [])
  .filter('gravatarUrl', function() {
    return function(email, size) {
      if (email) {
        var retval = 'http://www.gravatar.com/avatar/';
        retval += Crypto.MD5(email);

        if (size) {
          retval += '?s=' + size;
        }

        return retval;
      }
    };
  });
