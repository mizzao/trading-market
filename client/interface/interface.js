Template.deck.onRendered(function() {
  const $deck = this.firstNode;

  for( let i = 0; i < 5; i++ ) {
    let card = Deck.Card(i);

    card.enableDragging();
    card.enableFlipping();
    card.setSide('front');

    card.mount($deck);
  }

});
