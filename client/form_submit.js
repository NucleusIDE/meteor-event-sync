/**
 * # input:submit
 *
 * Handle capturing, syncing and receiving form submit events.
 */

FormSubmitEvent = function() {
  var EVENT_NAME  = "input:submit",
      $document = window.document,
      utils = new EventUtils(window);

  this.initialize = function () {
    EventSync.addEvent($document.body, "submit", this.syncBrowserEvent);
    EventSync.addEvent($document.body, "reset", this.syncBrowserEvent);
  };

  this.tearDown = function () {
    EventSync.removeEvent($document.body, "submit", this.syncBrowserEvent);
    EventSync.removeEvent($document.body, "reset", this.syncBrowserEvent);
  };

  this.syncBrowserEvent = function (event) {
    if (EventSync.canEmitEvents.get()) {
      var elem = event.target || event.srcElement;
      var data = utils.getElementData(elem);
      data.type = event.type;

      var ev = new NucleusEvent();
      ev.setName(EVENT_NAME);
      ev.type = 'forms';
      ev.setTarget(data);
      ev.broadcast();
    } else {
      EventSync.canEmitEvents.set(true);
    }
  };

  this.handleEvent = function (event) {
    var data = JSON.parse(event.target);
    var elem = utils.getSingleElement(data.tagName, data.index);
    EventSync.canEmitEvents.set(false);

    if (elem && data.type === "submit") {
      //We wrap elem as a jquery object becuase elem.submit() don't trigger any event handlers on submit added in meteor app and cause reload
      // but $(elem).submit() triggers event handlers correctly
      $(elem).submit();
    }
    if (elem && data.type === "reset") {
      elem.reset();
    }

    return false;
  };
};
