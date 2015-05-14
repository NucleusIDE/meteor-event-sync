/**
 * # LocationEvent
 * Handle capturing, syncing and receiving route change events.
 */

LocationEvent = function() {
  var EVENT_NAME = 'location',
      $window = window,
      utils = new EventUtils($window);

  /**
   * Override router go calls, and add `popstate` event for handling back/forward events in browser
   */
  this.initialize = function() {
    this.overRideGoCalls();
    EventSync.addEvent($window, 'popstate', this.syncGoPushstate);

    return this;
  };

  this.tearDown = function() {
    this.undoGoCallOverRide();
    EventSync.removeEvent($window, 'popstate', this.syncGoPushstate);
  };

  this.overRideGoCalls = function() {
    if($window.Router) {
      $window.Router.originalGo = $window.Router.go;
      $window.Router.go = this.syncGoCall('Router');
    }
    if($window.MobiRouter) {
      $window.MobiRouter.originalGo = $window.MobiRouter.go;
      $window.MobiRouter.go = this.syncGoCall('MobiRouter');
    }
  };

  this.undoGoCallOverRide = function() {
    if($window.Router)
      $window.Router.go = $window.Router.originalGo;
    if($window.MobiRouter)
      $window.MobiRouter.go = $window.MobiRouter.originalGo;
  };

  var locTimeout = null;
  this.syncGoCall = function(router) {
    /**
     * Send route change events over the wire i.e save them in mongo db.
     */
    return function() {
      var args = Array.prototype.slice.call(arguments, 0);
      //Play the original go call as it should for the client originating the event
      var ret = $window[router].originalGo.apply($window[router], args);
      this.pushHistory();

      var processLocationEvent = function() {
        if (EventSync.canEmitEvents.get()) {
          var ev = new NucleusEvent();

          ev.setName(EVENT_NAME);
          ev.router = router;
          ev.args = args;
          ev.broadcast();
        } else {
          EventSync.canEmitEvents.set(true);
        }
      };

      if (locTimeout) {
        Meteor.clearTimeout(locTimeout);
      }

      locTimeout = Meteor.setTimeout(function() {
        processLocationEvent();
      },300);

      return ret;
    }.bind(this);
  };

  //Here starts the touchy part for handling back/forward events. Iron-router don't put any stat in pushstate, so we have to do some sorcery ourself
  this.history = ['/'];
  this.curIndex = 0;
  /**
   * Broadcast popstate events
   */
  this.syncGoPushstate = function() {
    var loc = this;

    var movedDirection = function(list, url, cursor) {
      if(list[cursor + 1] === url) return 'forward';
      else return 'back';
    };

    if (EventSync.canEmitEvents.get()) {
      var hist = loc.history,
          cursor = loc.curIndex,
          url = $window.location.pathname;

      var ev = new NucleusEvent();
      ev.setName(EVENT_NAME);
      ev.type = 'popstate';

      if(movedDirection(hist, url, cursor) === 'back') {
        cursor = cursor - 1;
        loc.curIndex = cursor;

        ev.setValue('back');
        ev.broadcast();
        return;
      }
      else {
        cursor = cursor + 1;
        loc.curIndex = cursor;

        ev.setValue('forward');
        ev.broadcast();
        return;
      }
    } else {
      EventSync.canEmitEvents.set(true);
    }
  };

  //we maintain our version of browser history to play back/forward events
  this.pushHistory = function(item, cursor) {
    item = item || $window.location.pathname;
    cursor = cursor || this.curIndex;

    var len = this.history.length,
        maxLen = 20,
        history = this.history;

    if(cursor > maxLen) cursor = maxLen

    if(len < maxLen) {
      if(cursor !== len-1) {
        for (var j = 0; j > cursor && j < len; j++) {
          history[j+1] = history[j];
        }
      }
      history[cursor+1] = item;
    } else{
      for(var i = 0; i < cursor; i++) {
        history[i] = history[i+1];
      }
      history[cursor] = item;
    }

    this.history = history;
    cursor += 1;
    this.curIndex = cursor;
  };

  //Handle received events
  this.handleEvent = function(event) {
    EventSync.canEmitEvents.set(false);

    if(event.type === 'popstate') {
      var action = event.value;

      //Let's not go back if user is on first page
      if (action === 'back' && $window.history.state.initial) {
        return;
      }
      $window.history[action]();
      return;
    }

    var router = event.router,
        args = event.args;

    return $window[router].go.apply($window[router], args);
  };

  return this.initialize();
};
