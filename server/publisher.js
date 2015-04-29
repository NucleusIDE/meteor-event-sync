Meteor.publish('nucleus_events', function() {
  return NucleusEvents.find({});
});
