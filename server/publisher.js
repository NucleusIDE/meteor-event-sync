Meteor.publish('nucleus_events', function() {
  return NucleusEvents.find({triggered_at: {$gt: moment()-(10*1000*60)}}); //send 10 minute old events only
});
