/**
 # NucleusEvents
 ## Attributes
 * * name:                         String
 * * app_name:                     String (app or nucleus)
 * * triggered_at:                 Date
 * * users_done:                   Array (of mongo_ids) *This is the list of users which have played this event already*
 * * originator:                  mongo_id (user who triggered the event in first place)
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

  setAppName: function(name) {
    this.app_name = name;
  },
  getAppName: function() {
    return this.app_name;
  },

  setValue: function(val) {
    this.value = val;
  },

  getDoneUsers: function() {
    return this.users_done;
  },
  markDoneForMe: function() {
    //Mark this event done for currently logged in user.
    var userId = NucleusUser.me()._id;
    this.users_done.push(userId);
    this.save();
  },
  broadcast: function() {
    /**
     * This method should be called in place of `this.save()`. Because of a bug in `channikhabra:stupid-models` it wasn't possible to override `this.save()` because the methods in this block are piled up the prototype chain.
     */

    var userId = NucleusClient.getWindow().NucleusUser.me()._id;
    console.log("BROADCASTING EVENT", this.type);

    this.users_done = [userId];
    this.originator = userId;
    this.triggered_at = moment().toDate().getTime();
    this.save();
  }
});

NucleusEvent.getNewEvents = function() {
  /**
   * Get events which are
   * * emitted at most 10 seconds ago
   * * aren't created by the current user
   * * aren't already played for current user
   */
  var userId = NucleusUser.me()._id;
  var events = NucleusEvents.find({triggered_at: {$gt: moment()-10*1000}, originator: {$ne: userId}}).map(function(event) {
    if (! _.contains(event.users_done, userId))
      return event;
  });
  return _.compact(events);
};
