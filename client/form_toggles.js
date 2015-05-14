/**
 * # input:toggles
 *
 * Handle capturing, syncing and receiving form toggle-able input events. These include:
 * * checkboxes
 * * radio buttons
 * * select input
 */

InputToggleEvent = function() {
  var EVENT_NAME  = "input:toggles",
      $document = window.document,
      utils = new EventUtils(window);

  this.initialize = function () {
    var browserEvent = this.syncBrowserEvent;
    this.addEvents(EventSync, browserEvent);

    return this;
  };

  this.tearDown = function() {
    var browserEvent = this.syncBrowserEvent;
    this.removeEvents(EventSync, browserEvent);
  };

  this.syncBrowserEvent = function (event) {

    if (EventSync.canEmitEvents.get()) {
      var elem = event.target || event.srcElement;
      var data;
      if (elem.type === "radio" || elem.type === "checkbox" || elem.tagName === "SELECT") {
        var ev = new NucleusEvent();

        data = utils.getElementData(elem);
        ev.setName(EVENT_NAME);
        ev.type = 'forms';
        data.type = elem.type;
        data.checked = elem.checked;
        ev.setTarget(data);
        ev.setValue(elem.value);
        ev.broadcast();
      }
    } else {
      EventSync.canEmitEvents.set(true);
    }
  };

  this.handleEvent = function (event) {
    var data = JSON.parse(event.target);
    EventSync.canEmitEvents.set(false);

    var elem = utils.getSingleElement(data.tagName, data.index);

    if (elem) {
      if (data.type === "radio") {
        elem.checked = true;
      }
      if (data.type === "checkbox") {
        elem.checked = data.checked;
      }
      if (data.tagName === "SELECT") {
        elem.value = event.value;
      }
      return elem;
    }
    return false;
  };

  this.addEvents = function (eventManager, event) {

    var elems   = $document.getElementsByTagName("select");
    var inputs  = $document.getElementsByTagName("input");

    addEvents(elems);
    addEvents(inputs);

    function addEvents(domElems) {
      for (var i = 0, n = domElems.length; i < n; i += 1) {
        eventManager.addEvent(domElems[i], "change", event);
      }
    }
  };

  this.removeEvents = function (eventManager, event) {
    var elems   = $document.getElementsByTagName("select");
    var inputs  = $document.getElementsByTagName("input");

    addEvents(elems);
    addEvents(inputs);

    function addEvents(domElems) {
      for (var i = 0, n = domElems.length; i < n; i += 1) {
        eventManager.removeEvent(domElems[i], "change", event);
      }
    }
  };

  return this.initialize();
};
