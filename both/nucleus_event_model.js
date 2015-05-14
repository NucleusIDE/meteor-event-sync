/**
 # NucleusEvents
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

NucleusEvents = new Meteor.Collection('nucleus_events');
NucleusEvent = Model(NucleusEvents);

NucleusEvent.extend({
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

  broadcast: function() {
    /**
     * This method should be called in place of `this.save()`. Because of a bug in
     * `channikhabra:stupid-models` it wasn't possible to override `this.save()` because the
     * methods in this block are piled up the prototype chain.
     */

    this.originator_id = EventSync._originatorId;
    this.triggered_at = moment().toDate().getTime();
    this.save();
  }
});

NucleusEvent.getNewEvents = function() {
  /**
   * Get events which are
   * * emitted at most 10 seconds ago
   */
  var events = NucleusEvents.find({triggered_at: {$gt: moment()-10*1000}, originator_id: {$ne: EventSync._originatorId}});
  return events;
};
