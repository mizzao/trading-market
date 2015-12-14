Tracker.autorun(function() {
  const activeScenario = Scenarios.findOne();
  if (! activeScenario) return;
  Meteor.subscribe("priceData", activeScenario._id);
});

// Update the different game states
Tracker.autorun(function () {
  const current = Scenarios.findOne();

  if (!current) {
    Session.set("cardState", null);
    return;
  }

  if (current && current.users.length === Actions.find({
      price: {$ne: null},
      scenario: current._id
    }).count()) {
    console.log("Scenario done");

    Session.set("cardState", "completed");
  }
  else {
    Session.set("cardState", "active");
  }

});
