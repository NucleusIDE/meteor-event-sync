/**
 ## Attributes
 * * name:                         String
 * * triggered_at:                 Date
 *
 * * target:                       Object `{tagName: 'DIV', index: 0}` (can have extra params 'type' and 'checked' for checkbox/selec/radio)
 * * position:                     Object (for scroll)
 *
 * * value:                        String (for form inputs and nucleus-file-change events)
 *
 * * type:                         String (used for
 *   * location: popstate or null,
 *   * login: login or logout,
 *   * form-data: forms,
 *   * scroll: editorScroll (for nucleus editor scroll))
 */

var throttled = function(func, time, context, args) {
  time = time || 300;
  args = args || [];
  context = context || this;

  var _timeout = null;
  return function() {
    if (_timeout)
      Meteor.clearTimeout(_timeout);

    _timeout = Meteor.setTimeout(function() {
      func.apply(context, args);
    }, time);
  };
};

NucleusEvent = Ultimate('NucleusEvent').extends(UltimateModel, {
  setTarget: function(target) {
    this.target = JSON.stringify(target);
  },
  getTarget: function() {
    return JSON.parse(this.target);
  },
  setName: function(name) {
    this.name = name;
  },
  getName: function() {
    return this.name;
  },

  setValue: function(val) {
    this.value = val;
  },

  broadcast: function () {
    var self = this;
    throttled(function() {
      /**
       * This method should be called in place of `this.save()`. Because of a bug in
       * `channikhabra:stupid-models` it wasn't possible to override `this.save()` because the
       * methods in this block are piled up the prototype chain.
       */

      self.originator_id = EventSync._originatorId;
      self.triggered_at = moment().toDate().getTime();
      self.save();
    }.bind(this), 400)();
  }
});

NucleusEvents = NucleusEvent.collection;

NucleusEvent.getNewEvents = function() {
  /**
   * Get events which are
   * * emitted at most 10 seconds ago
   */
  var events = NucleusEvents.find({triggered_at: {$gt: moment()-10*1000}, originator_id: {$ne: EventSync._originatorId}});
  return events;
};
