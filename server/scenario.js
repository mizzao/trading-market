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

Meteor.publish("setup", function(id) {
  return Setups.find(id);
});

Meteor.publish("priceData", function(scenario) {
  return Actions.find({scenario});
});

const cards = [0, 1, 2, 3, 4];
const positions = [0, 1, 2, 3];

function generateSetup(numUsers) {

  const setup = _.shuffle(cards);
  const left = setup[0] + setup[1],
    right = setup[2] + setup[3];
  // Tiebreaker is the side that the largest card is on
  const tiebreaker = _.max(_.take(setup, 4));
  const tb = setup.indexOf(tiebreaker) >= 2;

  const outcome = (left !== right) ? (right > left) : tb;

  const revealed = [];

  for (let x = 0; x < numUsers; x++) {
    revealed.push(_.sample(positions));
  }

  return {
    cardSetup: setup,
    outcome,
    revealedPositions: revealed
  };
}

Meteor.methods({
  // Generate setups that will be used in scenarios later
  "generateSetups": function(numUsers, count) {
    check(count, Match.Integer);

    let x = 0;

    for (; x < count; x++) {
      Setups.insert(generateSetup(numUsers));
    }

    console.log(`${x} setups generated with ${numUsers} users each`);

    return x;
  },
  "newScenarioSet": function(showHistory) {
    if (Scenarios.findOne({completed: false})) {
      throw new Meteor.Error(400, "There are more existing scenarios to complete!");
    }

    // Insert setups corresponding to the scenarios in a random order
    _.shuffle( Setups.find().map( s => s._id) ).forEach( function(id) {
      Scenarios.insert({
        setup: id,
        showHistory,
        completed: false
      });
    });

  },
  "nextScenario": function () {
    const current = Scenarios.findOne({active: true});

    if (current != null) {
      Scenarios.update(current._id, {$set: {active: false, completed: true}});
    }

    const next = Scenarios.findOne({completed: false});

    if ( !next ) throw new Meteor.Error(400, "No more scenarios to do.");

    const users = Meteor.users.find({"status.online": true}).map((u) => u._id);
    const expected = Setups.findOne(next.setup).revealedPositions.length;

    if (users.length !== expected)
      throw new Meteor.Error(400, `Wrong number of online users, need ${expected}`);

    Scenarios.update(next._id, {$set: {active: true}});

    _.shuffle(users).forEach(function(userId, i) {
      Actions.insert({
        userId,
        scenario: next._id,
        turn: i
      });
    });

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
    const scenarios = Scenarios.find().fetch();

    const actions = [];

    for (s of scenarios) {
      const setup = Setups.findOne(s.setup);

      Actions.find({scenario: s._id, price: {$ne: null}}, {sort: {turn: 1}}).forEach((action) => {
        action.setup = setup._id;
        action.cardSetup = JSON.stringify(setup.cardSetup);
        action.revealed = setup.revealedPositions[action.turn];
        action.outcome = setup.outcome;
        action.showHistory = s.showHistory;
        actions.push(action);
      })
    }

    actions.sort((a, b) => a.timestamp - b.timestamp);

    return json2csv({data: actions, fields: [
      "setup", "scenario", "showHistory", "cardSetup", "outcome", "userId", "revealed",
      "turn", "price", "payoff", "timestamp"
    ]});
  }
});

function updateProfits(scenario, turn) {
  const s = Scenarios.findOne(scenario);
  const setup = Setups.findOne(s.setup);
  if( turn !== setup.revealedPositions.length - 1 ) return;

  let last = 0.5;
  Actions.find({scenario: s._id}, {sort: {turn: 1}}).forEach(function(a) {
    const payoff = Scoring.qsr(last, a.price, setup.outcome);

    // Update this payoff and total payoff
    Actions.update(a._id, {$set: {payoff} });
    Meteor.users.update(a.userId, {$inc: {profit: payoff}});

    last = a.price;
  });
}
