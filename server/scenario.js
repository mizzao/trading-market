Meteor.publish(null, function() {
  return Scenarios.find({active: true});
});

Meteor.publish(null, function() {
  return Meteor.users.find({"status.online": true});
});

Meteor.publish("priceData", function(scenario) {
  return Actions.find({scenario});
});

const cards = [0, 1, 2, 3, 4];
const positions = [0, 1, 2, 3];

function generateScenario(showHistory) {
  // Get all online users, give them turns and positions
  const users = Meteor.users.find({"status.online": true}).map((u) => u._id);

  const id = Scenarios.insert({
    active: true,
    showHistory,
    users,
    cardSetup: _.shuffle(cards)
  });

  _.shuffle(users).forEach(function(userId, i) {
    Actions.insert({
      userId,
      scenario: id,
      position: _.sample(positions),
      turn: i
    });
  });
}

Meteor.methods({
  "newScenario": function(showHistory) {
    Meteor.call("endScenario");
    generateScenario(showHistory);
  },
  "endScenario": function () {
    const current = Scenarios.findOne({active: true});

    if (current != null) {
      Scenarios.update(current._id, {$set: {active: false}});
    }
  },
  "setPrice": function(scenario, price) {
    check(scenario, String);
    check(price, Number);

    const turn = Actions.findOne({scenario, price: null}, {sort: {turn: 1}});

    if( !turn || turn.userId !== Meteor.userId()) {
      throw new Meteor.Error(403, "It's not your turn!");
    }

    Actions.update(turn._id, { $set: {
      price,
      timestamp: new Date()
    }});
  },
  "downloadActions": function() {
    const scenarios = Scenarios.find({users: {$size: 4}}).fetch();

    const actions = [];

    for (s of scenarios) {
      Actions.find({scenario: s._id, price: {$ne: null}}).forEach((action) => {
        action.showHistory = s.showHistory;
        action.cardSetup = JSON.stringify(s.cardSetup);
        actions.push(action);
      })
    }

    actions.sort((a, b) => a.timestamp - b.timestamp);

    return json2csv({data: actions, fields: [
      "scenario", "cardSetup", "showHistory", "userId", "turn",
      "price", "position", "timestamp"
    ]});
  }
});
