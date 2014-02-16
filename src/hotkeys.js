/*
 * angular-hotkeys
 *
 * Automatic keyboard shortcuts for your angular apps
 *
 * (c) 2014 Wes Cruver
 * License: MIT
 */


// TODOS:
// - check to make sure key is not already bound, if it is, unbind it
//

(function() {

'use strict';

angular.module('cfp.hotkeys', []).provider('hotkeys', function() {

  function symbolize (key) {
    var map = {
      command   : '⌘',
      shift     : '⇧',
      left      : '←',
      right     : '→',
      top       : '↑',
      bottom    : '↓',
      'return'  : '↩',
      backspace : '⌫'
    };
    return map[key] || key;
  }

  function Hotkey (key, description, callback, persistent) {
    // TODO: Check that the values are sane because we could
    // be trying to instantiate a new Hotkey with outside dev's
    // supplied values
    this.key = key;
    this.description = description;
    this.callback = callback;
    this.persistent = persistent;
  }

  this.$get = ['$rootElement', '$rootScope', '$compile', function ($rootElement, $rootScope, $compile) {

    var scope = $rootScope.$new();
    scope.hotkeys = [];
    scope.helpVisible = !false;

    $rootScope.$on('$routeChangeStart', function(event, route) {
      console.log('route changed:', event, route.hotkeys);
      purgeHotkeys();

      if (route.hotkeys) {
        angular.forEach(route.hotkeys, function (hotkey) {
          // todo: perform check to make sure not already defined:
          hotkey[3] = false;
          _add.apply(this, hotkey);
        });
      }
      console.log(scope.hotkeys);
    });


    // TODO: Make this configurable:
    var helpMenu = angular.element('<div class="cfp-hotkeys" ng-show="helpVisible"><table><tbody>' +
                                      '<tr ng-repeat="hotkey in hotkeys | filter:{description: \'!$$undefined$$\'}">' +
                                        '<td class="cfp-hotkeys-keys"><span ng-repeat="key in hotkey.hotkey" class="cfp-hotkeys-key">' +
                                          '{{key}}' +
                                        '</span></td>' +
                                        '<td class="cfp-hotkeys-text">{{hotkey.description}}</td>' +
                                      '</tr>' +
                                   '</tbody></table></div>');



    // Auto-create a help menu:
    // TODO: Make this configurable
    _add('?', 'Show this help menu', toggleHelp);
    angular.element(document.body).append($compile(helpMenu)(scope));
    // console.log($compile(helpMenu)(scope)[0]);


    /**
     * Purges all transient hotkeys (such as those defined in routes)
     *
     * Without this, the same hotkey would get recreated everytime
     * the route is accessed.
     */
    function purgeHotkeys() {
      // TODO: hotkey is used as an argument everywhere, but the object type
      // is always different.  perhaps I sohuld create a hotkey object so it
      // is consistent all the time.
      angular.forEach(scope.hotkeys, function (hotkey) {
        if (!hotkey.persistent) {
          _del(hotkey);
        }
      });
    }

    function toggleHelp() {
      scope.helpVisible = !scope.helpVisible;
    }

    function _add (key, description, callback, persistent) {
      if (description instanceof Function) {
        callback = description;
        description = '$$undefined$$';
      }

      // any items added through the public API are for controllers
      // that persist through navigation, and thus undefined should mean
      // true in this case.
      if (persistent === undefined) {
        persistent = true;
      }

      Mousetrap.bind(key, wrapApply(callback));

      // format the hotkey for display:
      // hotkey = hotkey.split(/[\s]/);
      // for (var i = 0; i < hotkey.length; i++) {
      //   switch (hotkey[i]) {
      //     case 'ctrl':
      //     case 'alt':
      //     case 'option':
      //     case 'meta':
      //     case 'mod':
      //       hotkey[i] = hotkey[i].toUpperCase();
      //       break;
      //     default:
      //       hotkey[i] = symbolize(hotkey[i]);
      //       break;
      //   }
      // }

      scope.hotkeys.push(new Hotkey(key, description, callback, persistent));

    }

    /**
     * delete and unbind a Hotkey
     * @param  {mixed} hotkey Either the bound key or an instance of Hotkety
     * @return {boolean}        true if successful
     */
    function _del (hotkey) {
      var key = (hotkey instanceof Hotkey) ? hotkey.key : hotkey;

      Mousetrap.unbind(key);

      for (var i = 0; i < scope.hotkeys.length; i++) {
        if (scope.hotkeys[i].key === key) {
          scope.hotkeys.splice(i, 1);
        }
      }
    }

    /**
     * Get a Hotkey object by key binding
     * @param  {[string]} key they key the Hotkey is bound to
     * @return {Hotkey}   The Hotkey object
     */
    function _get (key) {
      angular.forEach(scope.hotkeys, function (hotkey) {
        if (hotkey.key === key) {
          return hotkey;
        }
      });
      return false;
    }

    function wrapApply (callback) {
      // return mousetrap a function to call
      return function (event) {
        // this takes place outside angular, so we'll have to call
        // $apply() to make sure angular's digest happens
        $rootScope.$apply(function() {
          // call the original hotkey callback with the keyboard event
          callback(event);
        });
      };
    }

    return {
      add: _add,
      del: _del,
      get: _get
    };

  }];

});



})();