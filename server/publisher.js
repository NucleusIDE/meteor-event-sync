Meteor.publish('nucleus_events', function() {
  return NucleusEvents.find({triggered_at: {$gt: moment()-10*1000}});
});
