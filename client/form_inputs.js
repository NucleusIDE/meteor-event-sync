/**
 * # input:text
 *
 * Handle capturing, syncing and receiving form text input events.
 */
InputTextEvent = function(appName) {
  var EVENT_NAME  = "input:text",
      APP_NAME = appName,
      $document = NucleusClient.getWindow(APP_NAME).document,
      utils = NucleusEventManager.getUtils(APP_NAME);

  this.initialize = function () {
    NucleusEventManager.addEvent($document.body, "keyup", this.syncBrowserEvent);
  };

  this.tearDown = function () {
    NucleusEventManager.removeEvent($document.body, "keyup", this.syncBrowserEvent);
  };

  this.syncBrowserEvent = function (event) {
    var elem = event.target || event.srcElement;

    if (NucleusEventManager.canEmitEvents) {
      if (elem.tagName === "INPUT" || elem.tagName === "TEXTAREA") {
        //we don't want to sync keyboard events in chat box etc.
        //FIXME: Need more robust solution here than hard-coded id
        if(APP_NAME==='nucleus' && elem.id !== 'sidebar-commit-message')
          return;

        var value = elem.value;

        var ev = new NucleusEvent();
        ev.setName(EVENT_NAME);
        ev.setAppName(APP_NAME);
        ev.type = 'forms';
        ev.setTarget(utils.getElementData(elem));
        ev.setValue(value);
        ev.broadcast();
      }
    } else {
      NucleusEventManager.canEmitEvents = true;
    }
  };

  this.handleEvent = function (event) {
    var data = event.getTarget();
    NucleusEventManager.canEmitEvents = false;

    var elem = utils.getSingleElement(data.tagName, data.index);
    if (elem) {
      elem.value = event.value;
      return elem;
    }
    return false;
  };
};
