/**
 * #ScrollEvent
 */

Scroll = function() {
  var EVENT_NAME = "scroll",
      $window = window,
      utils = utils = new EventUtils($window);

  this.$window = $window;

  this.initialize = function () {
    NucleusEventManager.addEvent($window, EVENT_NAME, this.syncEvent);
    return this;
  };

  this.tearDown = function () {
    NucleusEventManager.removeEvent($window, EVENT_NAME, this.syncEvent);
  };

  /**
   * Send events over the wire.
   */
  var appScrollSynced = false;
  this.syncEvent = function () {
    var canEmit = NucleusEventManager.canEmitEvents.get();
    var syncScroll = function() {
      var ev = new NucleusEvent();
      ev.setName(EVENT_NAME);
      ev.position = this.getScrollPosition();
      ev.broadcast();
      appScrollSynced = false;
    }.bind(this);

    if(canEmit) {
      if(! appScrollSynced) {
        var that = this;
        var roller = {
          y: that.getScrollPosition().raw.y,
          x: that.getScrollPosition().raw.x
        };
        NucleusEventManager.appUtils.executeWhenStopRolling(
          roller, ['x', 'y'], syncScroll, 1000
        );
        appScrollSynced = true;
      }
    } else
      NucleusEventManager.canEmitEvents.set(true);
  }.bind(this);

  this.handleEvent = function (data) {
    NucleusEventManager.canEmitEvents.set(false);

    var scrollSpace = utils.getScrollSpace();
    //I couldn't understand the meaning of below lines for code from browser-sync
    // if (bs.opts && bs.opts.scrollProportionally) {
    return $window.scrollTo(0, scrollSpace.y * data.position.proportional); // % of y axis of scroll to px
    // } else {
    // return $window.scrollTo(0, data.position.raw);
    // }
  };

  this.getScrollPosition = function () {
    var pos = utils.getBrowserScrollPosition();
    return {
      raw: pos, // Get px of y axis of scroll
      proportional: this.getScrollTopPercentage(pos) // Get % of y axis of scroll
    };
  };

  this.getScrollPercentage = function (scrollSpace, scrollPosition) {
    var x = scrollPosition.x / scrollSpace.x;
    var y = scrollPosition.y / scrollSpace.y;

    return {
      x: x || 0,
      y: y
    };
  };

  this.getScrollTopPercentage = function (pos) {
    var scrollSpace = utils.getScrollSpace();
    var percentage  = this.getScrollPercentage(scrollSpace, pos);
    return percentage.y;
  };

  return this.initialize();
};
