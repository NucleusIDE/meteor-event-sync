/**
 * # ClickEvent
 * Handle capturing, syncing and receiving click events.
 */
Click = function() {
  var EVENT_NAME  = "click",
      $document = window.document,
      utils = new EventUtils(window);

  this.initialize = function () {
    /**
     * Add the click event listener to body of the window of given app
     */
    NucleusEventManager.addEvent($document.body, EVENT_NAME, this.syncBrowserEvent);
    return this;
  };
  this.tearDown = function() {
    NucleusEventManager.removeEvent($document.body, EVENT_NAME, this.syncBrowserEvent);
  };
  this.triggerClick = function (elem) {
    //Let's use jquery to trigger the click instead of doing it ourselves. Jquery's click work well with Router.go()/MobiRouter.go()
    //calls. Other way of triggering click event cause a window reload which is certainly not what we want
    $(elem).click();

    /* <!--
     var evObj;
     if ($document.createEvent) {
     evObj = $document.createEvent("MouseEvents");
     evObj.initEvent("click", true, true);
     elem.dispatchEvent(evObj);
     } else {
     if ($document.createEventObject) {
     evObj = $document.createEventObject();
     evObj.cancelBubble = true;
     elem.fireEvent("on" + "click", evObj);
     }
     }
     --> */
  };
  this.syncBrowserEvent = function (event) {
    /**
     * Send event over the wire i.e save event in mango db
     */
    var canEmit = NucleusEventManager.canEmitEvents.get();

    if (canEmit) {
      var elem = event.target || event.srcElement;
      if (elem.type === "checkbox" || elem.type === "radio") {
        utils.forceChange(elem);
        return;
      }

      var ev = new NucleusEvent();
      ev.setName(EVENT_NAME);
      ev.setTarget(utils.getElementData(elem));
      ev.broadcast();
    }
    else NucleusEventManager.canEmitEvents.set(true);
  };
  this.handleEvent = function (event) {
    /**
     * Handle the event that has been received over the wire.
     */
    NucleusEventManager.canEmitEvents.set(false);

    var target = event.getTarget();
    var elem = utils.getSingleElement(target.tagName, target.index);
    if (elem) {
      this.triggerClick(elem);
    }
  };

  return this.initialize();
};
