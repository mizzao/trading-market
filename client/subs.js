Tracker.autorun(function() {
  const activeScenario = Scenarios.findOne();
  if (! activeScenario) return;

  Meteor.subscribe("setup", activeScenario.setup);
  Meteor.subscribe("priceData", activeScenario._id);
});

// Update the different game states
Tracker.autorun(function () {
  const current = Setups.findOne();

  if (!current) {
    Session.set("cardState", null);
    return;
  }

  if (current && current.revealedPositions.length === Actions.find({
      price: {$ne: null}
    }).count()) {
    console.log("Scenario done");

    Session.set("cardState", "completed");
  }
  else {
    Session.set("cardState", "active");
  }

});
