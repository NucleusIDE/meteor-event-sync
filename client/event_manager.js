/**
 * # EventSync
 *
 * Single point of interaction for event sync.
 */
var EventManager = function() {
  // This flag is used to prevent event ping-pong and re-inserts. When we recieve an event, we mark `EventSync.canEmitEvents` to false so that the client won't re-send received event.
  this.canEmitEvents = new ReactiveVar(true);
  this.isSyncingEvents = new ReactiveVar(false);
  this._eventSub = null;
  this._originatorId = new Mongo.ObjectID()._str;
  this._ExternalEventsFuncs = {};
  this._eventFilters = {};
  this._externalEvents = {};
  this.Utils = new EventUtils(window);
  this.Collection = NucleusEvent;
};

EventManager.prototype.start = function() {
  this.isSyncingEvents.set(true);
  this._eventSub = Meteor.subscribe('nucleus_events');
  this._setupAllEvents();
  this._startRecievingEvents();
};

EventManager.prototype.setOriginatorId = function(id) {
  this._originatorId = id;
};

EventManager.prototype.addEventFilter = function(eventName, filterFunc) {
  this._eventFilters[eventName] = this._eventFilters[eventName] || [];
  this._eventFilters[eventName].push(filterFunc);
};

EventManager.prototype.stop = function() {
  this.isSyncingEvents.set(false);
  this._eventSub.stop();
  this._tearDownAllEvents();
};

EventManager.prototype._setupAllEvents = function() {
  var self = this;

  this.click = new Click();
  this.dblclick = new DblClick();
  this.location = new LocationEvent();
  this.scroll = new Scroll();
  this.forms = new FormsEvent();
  this.login = new LoginEvent();

  _.keys(this._ExternalEventsFuncs).forEach(function(eventName) {
    self._externalEvents[eventName] = new self._ExternalEventsFuncs[eventName](self);
  });
};

EventManager.prototype._tearDownAllEvents = function() {
  var self = this;

  this.click.tearDown();
  this.dblclick.tearDown();
  this.location.tearDown();
  this.scroll.tearDown();
  this.forms.tearDown();
  this.login.tearDown();

  _.keys(this._externalEvents).forEach(function(eventName) {
    self._externalEvents[eventName].tearDown();
  });
};

EventManager.prototype.handleEvent = function(event) {
  /**
   * Simple proxy for handling all kind of events with same interface.
   * Form events are of many types (check forms). So we take special care of them
   */
  if (event.type === "forms") {
    this.forms[event.getName()].handleEvent(event);
  } else
    if(this[event.getName()]) {
      this[event.getName()].handleEvent(event);
    } else
      this._externalEvents[event.getName()].handleEvent(event);
};

EventManager.prototype._startRecievingEvents = function() {
  //Replay all events since latest route change.
  this.replayEventsSinceLastRouteChange();

  var events = NucleusEvent.getNewEvents();    //Get new events to be played.
  var eventListener = events.observe({
    added: function(event) {
      EventSync.handleEvent(event);
    }.bind(this)
  });

  Tracker.autorun(function() {
    if(! this.isSyncingEvents.get()) {
      console.log("Stopping EventListener");
      eventListener.stop();
    }

  }.bind(this));
};

EventManager.prototype.playEvents = function(events) {
  /**
   * Play an array of `events`. Because of the heavy-lifting done in `EventSync.initialize()`, all these methods are pretty thin and easy to read.
   */
  _.each(events, function(event) {
    if(!event) return;
    EventSync.handleEvent(event);
  });
};

EventManager.prototype.replayEventsSinceLastRouteChange = function() {
  /**
   * Replay all events that happened after latest route change.
   */

  // Get the last go event created by any logged in nucleus user.
  var lastGoEvent = NucleusEvents.find({name: "location"}, {sort: {triggered_at: -2}, limit: 1  }).fetch()[0];

  if(lastGoEvent) {
    //Get all the events that happened after `go` event
    var followingEvents = NucleusEvents.find({triggered_at: {$gt: lastGoEvent.triggered_at}}).fetch();
  }

  //Get the last login event that happened.
  var lastLoginEvent = NucleusEvents.find({name: "login", type: "login"}, {sort: {triggered_at: -1}, limit: 1}).fetch()[0];

  //Log in every user who want to sync events. This is so that we won't attempt to route a user to a page which is not accessible because they're not logged in or are logged in as some other user type.
  EventSync.playEvents([lastLoginEvent]);

  if(! lastGoEvent) return false;

  //FIXME: Find a reliable way to make sure last login event is played and user is logged in successfully before playing last route event
  Meteor.setTimeout(function() {
    /* The template to which the go event goes must be rendered before we can trigger events that follow.
     * Otherwise it interfere and some of the following events get triggered on the page before go event.
     *
     * FIXME: Find a reliable way to call following events after the template to which go event takes is rendered
     */
    EventSync.playEvents([lastGoEvent]);

    Meteor.setTimeout(function() {
      EventSync.playEvents(followingEvents);
    }, 300);
  }, 300);
};

EventManager.prototype.addExternalEvent = function(event) {
  this._ExternalEventsFuncs[event.name] = event;
};

//,-----------------------------------------------------------
//| START COPIED CODE
//| Copied from browser-event-sync.
//`-----------------------------------------------------------
var _ElementCache = function () {
  var cache = {},
      guidCounter = 1,
      expando = "data" + (new Date()).getTime();

  this.getData = function (elem) {
    var guid = elem[expando];
    if (!guid) {
      guid = elem[expando] = guidCounter++;
      cache[guid] = {};
    }
    return cache[guid];
  };

  this.removeData = function (elem) {
    var guid = elem[expando];
    if (!guid) return;
    delete cache[guid];
    try {
      delete elem[expando];
    }
    catch (e) {
      if (elem.removeAttribute) {
        elem.removeAttribute(expando);
      }
    }
  };
};

/**
 * Fix an event
 */
var _fixEvent = function (event, elem) {
  function returnTrue() {
    return true;
  }
  function returnFalse() {
    return false;
  }

  var $window = elem.ownerDocument ? elem.ownerDocument.defaultView || elem.ownerDocument.parentWindow : elem;
  if (!event || !event.stopPropagation) {
    var old = event || $window.event;
    // Clone the old object so that we can modify the values
    event = {};
    for (var prop in old) {
      event[prop] = old[prop];
    }

    // The event occurred on this element
    if (!event.target) {
      event.target = event.srcElement || $window.document;
    }

    // Handle which other element the event is related to
    event.relatedTarget = event.fromElement === event.target ?
      event.toElement :
      event.fromElement;

    // Stop the default browser action
    event.preventDefault = function () {
      event.returnValue = false;
      event.isDefaultPrevented = returnTrue;
    };

    event.isDefaultPrevented = returnFalse;

    // Stop the event from bubbling
    event.stopPropagation = function () {
      event.cancelBubble = true;
      event.isPropagationStopped = returnTrue;
    };

    event.isPropagationStopped = returnFalse;

    // Stop the event from bubbling and executing other handlers
    event.stopImmediatePropagation = function () {
      this.isImmediatePropagationStopped = returnTrue;
      this.stopPropagation();
    };

    event.isImmediatePropagationStopped = returnFalse;

    // Handle mouse position
    if (event.clientX !== null) {
      var doc = document.documentElement, body = document.body;

      event.pageX = event.clientX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY +
        (doc && doc.scrollTop || body && body.scrollTop || 0) -
        (doc && doc.clientTop || body && body.clientTop || 0);
    }

    // Handle key presses
    event.which = event.charCode || event.keyCode;

    // Fix button for mouse clicks:
    // 0 == left; 1 == middle; 2 == right
    if (event.button !== null) {
      event.button = (event.button & 1 ? 0 :
                      (event.button & 4 ? 1 :
                       (event.button & 2 ? 2 : 0)));
    }
  }

  return event;
};

/**
 * @constructor
 */
var _EventManager = function (cache) {
  var nextGuid = 1;

  this.addEvent = function (elem, type, fn) {
    var data = cache.getData(elem);
    if (!data.handlers) data.handlers = {};

    if (!data.handlers[type])
      data.handlers[type] = [];

    if (!fn.guid) fn.guid = nextGuid++;

    data.handlers[type].push(fn);

    if (!data.dispatcher) {
      data.disabled = false;
      data.dispatcher = function (event) {

        if (data.disabled) return;
        event = _fixEvent(event, elem);

        var handlers = data.handlers[event.type];
        if (handlers) {
          for (var n = 0; n < handlers.length; n++) {
            handlers[n].call(elem, event);
          }
        }
      };
    }

    if (data.handlers[type].length == 1) {
      if (document.addEventListener) {
        elem.addEventListener(type, data.dispatcher, false);
      }
      else if (document.attachEvent) {
        elem.attachEvent("on" + type, data.dispatcher);
      }
    }

  };

  function tidyUp(elem, type) {

    function isEmpty(object) {
      for (var prop in object) {
        return false;
      }
      return true;
    }

    var data = cache.getData(elem);

    if (data.handlers[type].length === 0) {

      delete data.handlers[type];

      if (document.removeEventListener) {
        elem.removeEventListener(type, data.dispatcher, false);
      }
      else if (document.detachEvent) {
        elem.detachEvent("on" + type, data.dispatcher);
      }
    }

    if (isEmpty(data.handlers)) {
      delete data.handlers;
      delete data.dispatcher;
    }

    if (isEmpty(data)) {
      cache.removeData(elem);
    }
  }

  this.removeEvent = function (elem, type, fn) {

    var data = cache.getData(elem);

    if (!data.handlers) return;

    var removeType = function (t) {
      data.handlers[t] = [];
      tidyUp(elem, t);
    };

    if (!type) {
      for (var t in data.handlers) removeType(t);
      return;
    }

    var handlers = data.handlers[type];
    if (!handlers) return;

    if (!fn) {
      removeType(type);
      return;
    }

    if (fn.guid) {
      for (var n = 0; n < handlers.length; n++) {
        if (handlers[n].guid === fn.guid) {
          handlers.splice(n--, 1);
        }
      }
    }
    tidyUp(elem, type);

  };

  this.proxy = function (context, fn) {
    if (!fn.guid) {
      fn.guid = nextGuid++;
    }
    var ret = function () {
      return fn.apply(context, arguments);
    };
    ret.guid = fn.guid;
    return ret;
  };
  /////////////////////
  // END COPIED CODE //
  /////////////////////
};

EventSync = new EventManager();
EventSync.cache = new _ElementCache();
_.extend(EventSync, new _EventManager(EventSync.cache));
