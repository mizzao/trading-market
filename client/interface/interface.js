Template.interface.onRendered(function() {
  const numCards = new Array(5);
  const deck = new Deck(numCards);

  function arrange(next, arrangement) {
    const cards = deck.cards;

    cards.forEach(function(card, j) {
      card.setSide('back');
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
        rot: 0
      })

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
  deck.reveal = deck.queued(reveal);

  deck.mount(this.find(".card-holder"));
  deck.intro();
  deck.sort();

  deck.poker();

  this.autorun(function() {
    const current = Scenarios.findOne();
    if (current == null) {
      deck.reveal();
      return;
    }

    deck.shuffle();
    deck.arrange([current.cardSetup]);
  });
});

Template.controls.helpers({
  users: function() { return Meteor.users.find(); }
});

Template.controls.events({
  "click .new-scenario": function(e) {
    Meteor.call("newScenario");
  },
  "click .end-scenario": function(e) {
    Meteor.call("endScenario");
  }
});
