/**
 * # input:text
 *
 * Handle capturing, syncing and receiving form text input events.
 */
InputTextEvent = function() {
  var EVENT_NAME  = "input:text",
      $document = window.document,
      utils = new EventUtils(window);

  this.initialize = function () {
    NucleusEventManager.addEvent($document.body, "keyup", this.syncBrowserEvent);

    return this;
  };

  this.tearDown = function () {
    NucleusEventManager.removeEvent($document.body, "keyup", this.syncBrowserEvent);
  };

  this.syncBrowserEvent = function (event) {
    var elem = event.target || event.srcElement;

    if (NucleusEventManager.canEmitEvents.get()) {
      if (elem.tagName === "INPUT" || elem.tagName === "TEXTAREA") {
        var value = elem.value;

        var ev = new NucleusEvent();
        ev.setName(EVENT_NAME);
        ev.type = 'forms';
        ev.setTarget(utils.getElementData(elem));
        ev.setValue(value);
        ev.broadcast();
      }
    } else {
      NucleusEventManager.canEmitEvents.set(true);
    }
  };

  this.handleEvent = function (event) {
    var data = event.getTarget();
    NucleusEventManager.canEmitEvents.set(false);

    var elem = utils.getSingleElement(data.tagName, data.index);
    if (elem) {
      elem.value = event.value;
      return elem;
    }
    return false;
  };

  return this.initialize();
};
