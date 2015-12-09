Tracker.autorun(function() {
  const activeScenario = Scenarios.findOne();
  if (! activeScenario) return;
  Meteor.subscribe("priceData", activeScenario._id);
});
