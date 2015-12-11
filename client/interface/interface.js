Template.interface.onRendered(function() {
  const numCards = new Array(5);
  const deck = new Deck(numCards);

  function arrange(next, arrangement) {
    const cards = deck.cards;

    cards.forEach(function(card, j) {
      const position = arrangement.indexOf(card.i);

      // Shift left two and rightmost cards
      let placement;
      if (position <= 1)
        placement = position - 0.5;
      else if (position >= 4)
        placement = position + 1;
      else
        placement = position;

      card.animateTo({
        delay: 500,
        duration: 500,
        x: Math.round((placement - 2.05) * 140),
        y: Math.round(110),
        rot: 0,
        onComplete: function() {
          cb(j);
        }
      })

    });

    function cb(j) {
      if (j === cards.length - 1) next();
    }
  }

  function hide(next) {
    deck.cards.forEach(function(card) {
      card.setSide('back');
    });

    next();
  }

  function reveal(next) {
    deck.cards.forEach(function(card) {
      card.setSide('front');
    });

    next();
  }

  deck.arrange = deck.queued(arrange);
  deck.hide = deck.queued(hide);
  deck.reveal = deck.queued(reveal);

  deck.mount(this.find(".card-holder"));
  deck.intro();
  deck.sort();

  deck.poker();

  let setup;

  // Initial shuffle
  this.autorun(function() {
    const current = Scenarios.findOne();
    if (current == null) {
      deck.reveal();
      return;
    }

    deck.hide();

    for (i of Array(5)) deck.shuffle();

    deck.arrange([current.cardSetup]);

    setup = current.cardSetup;
  });

  // Reveal one card
  this.autorun(function() {
    const myTurn = Actions.findOne({userId: Meteor.userId()}, {fields: {position: 1}});
    if( !myTurn ) return;

    const revealed = setup[myTurn.position];
    console.log(`Showing card at position ${myTurn.position}: ${revealed}`);

    deck.queue(function(next) {
      deck.cards.find((c) => c.i == revealed).setSide('front');
      next()
    });
  });

  // Final reveal
  this.autorun(function() {
    const current = Scenarios.findOne();
    if (current && current.users.length === Actions.find({
        price: {$ne: null},
        scenario: current._id
      }).count()) {
      console.log("Done, showing all cards");
      deck.reveal();
    }
  })

});

Template.controls.helpers({
  showHistory: function() {
    const scenario = Scenarios.findOne();
    return scenario && scenario.showHistory ||
      Actions.find({price: null}).count() == 0;
  },
  users: function() {
    return Meteor.users.find();
  },
  myTurn: function() {
    const userId = Meteor.userId();
    if (!userId) return false;

    const turn = Actions.findOne({price: null}, {sort: {turn: 1}});
    if( turn && turn.userId === userId ) return true;
  }
});

Template.controls.events({
  "click .new-scenario.hist": function(e) {
    Meteor.call("newScenario", true);
  },
  "click .new-scenario.last": function(e) {
    Meteor.call("newScenario", false);
  },
  "click .end-scenario": function(e) {
    Meteor.call("endScenario");
  }
});


