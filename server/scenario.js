Meteor.publish(null, function() {
  return Scenarios.find({active: true});
});

Meteor.publish(null, function() {
  return Meteor.users.find({"status.online": true});
});

const cards = [0, 1, 2, 3, 4];

function generateScenario() {
  Scenarios.insert({
    active: true,
    cardSetup: _.shuffle(cards)
  });
}

Meteor.methods({
  "newScenario": function() {
    Meteor.call("endScenario");
    generateScenario();
  },
  "endScenario": function () {
    const current = Scenarios.findOne({active: true});

    if (current != null) {
      Scenarios.update(current._id, {$set: {active: false}});
    }
  }
});
