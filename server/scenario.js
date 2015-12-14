Meteor.publish(null, function() {
  return Scenarios.find({active: true});
});

Meteor.publish(null, function() {
  return Meteor.users.find({"status.online": true}, {
    fields: {
      username: 1,
      profit: 1
    }
  });
});

Meteor.publish("priceData", function(scenario) {
  return Actions.find({scenario});
});

const cards = [0, 1, 2, 3, 4];
const positions = [0, 1, 2, 3];

function generateScenario(showHistory) {
  // Get all online users, give them turns and positions
  const users = Meteor.users.find({"status.online": true}).map((u) => u._id);
  const setup = _.shuffle(cards);
  const left = setup[0] + setup[1],
    right = setup[2] + setup[3];
  // Tiebreaker is the side that the largest card is on
  const tiebreaker = _.max(_.take(setup, 4));
  const tb = setup.indexOf(tiebreaker) >= 2;

  const outcome = (left !== right) ? (right > left) : tb;

  const id = Scenarios.insert({
    active: true,
    showHistory,
    users,
    cardSetup: setup,
    outcome
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

    const action = Actions.findOne({scenario, price: null}, {sort: {turn: 1}});

    if( !action || action.userId !== Meteor.userId()) {
      throw new Meteor.Error(403, "It's not your turn!");
    }

    Actions.update(action._id, { $set: {
      price,
      timestamp: new Date()
    }});

    // If all actions done, compute a profit
    updateProfits(action.scenario, action.turn);
  },
  "resetProfit": function() {
    Meteor.users.update({}, {$set: {profit: 0}}, {multi: true});
  },
  "downloadActions": function() {
    // XXX hardcoded usercount
    const scenarios = Scenarios.find({users: {$size: 4}}).fetch();

    const actions = [];

    for (s of scenarios) {
      Actions.find({scenario: s._id, price: {$ne: null}}).forEach((action) => {
        action.outcome = s.outcome;
        action.showHistory = s.showHistory;
        action.cardSetup = JSON.stringify(s.cardSetup);
        actions.push(action);
      })
    }

    actions.sort((a, b) => a.timestamp - b.timestamp);

    return json2csv({data: actions, fields: [
      "scenario", "showHistory", "cardSetup", "outcome", "userId", "position",
      "turn", "price", "payoff", "timestamp"
    ]});
  }
});

function updateProfits(scenario, turn) {
  const s = Scenarios.findOne(scenario);
  if( turn !== s.users.length - 1 ) return;

  let last = 0.5;
  Actions.find({scenario: s._id}, {sort: {turn: 1}}).forEach(function(a) {
    const payoff = Scoring.lsr(last, a.price, s.outcome);

    // Update this payoff and total payoff
    Actions.update(a._id, {$set: {payoff} });
    Meteor.users.update(a.userId, {$inc: {profit: payoff}});

    last = a.price;
  });
}
