Template.priceInfo.onRendered(function() {
  const svg = d3.select(this.find("svg"));
  const $svg = this.$("svg");

  const margin = { left: 40, bottom: 30, top: 10, right: 10 };
  const width = $svg.width() - margin.left - margin.right;
  const height = $svg.height() - margin.bottom - margin.top;

  const x = d3.scale.linear().range([0, width]);
  const y = d3.scale.linear().domain([0,1]).range([height, 0]);

  const xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
  const yAxis = d3.svg.axis().scale(y).orient("left").ticks(10)
    .innerTickSize(-width);

  svg.select(".chart").attr("transform", `translate(${margin.left},${margin.top})`);

  const svgX = svg.select(".x.axis");
  svg.select(".y.axis").call(yAxis);

  svgX.attr("transform", `translate(0,${height})`).call(xAxis);

  const path = d3.select("path.line");

  const valueline = d3.svg.line()
    .x((d, i) => x(i))
    .y(d => y(d.price));

  this.autorun(function () {
    const data = Actions.find({price: {$ne: null}}, {sort: {timestamp: 1}}).fetch();
    const result = [ {price: 0.5} ].concat(data);

    if (data.length == 0) {
      x.domain([0, 1]);
      path.attr("d", null);
    }
    else {
      x.domain([0, data.length]);
      path.attr("d", valueline(result));
    }

    svgX.call(xAxis);
  });
});

Template.priceLast.onRendered(function() {
  const svg = d3.select(this.find("svg"));
  const $svg = this.$("svg");

  const margin = { left: 40, bottom: 30, top: 10, right: 10 };
  const width = $svg.width() - margin.left - margin.right;
  const height = $svg.height() - margin.bottom - margin.top;

  const x = d3.scale.linear().domain([0,1]).range([0, width]);
  const y = d3.scale.linear().domain([0,1]).range([height, 0]);

  const yAxis = d3.svg.axis().scale(y).orient("left").ticks(10)
    .innerTickSize(-width);

  svg.select(".chart").attr("transform", `translate(${margin.left},${margin.top})`);

  svg.select(".y.axis").call(yAxis);

  const path = d3.select("path.line");

  const valueline = d3.svg.line()
    .x((d, i) => x(i))
    .y(d => y(d));

  this.autorun(function () {
    const data = lastPrice();
    const result = [data, data];

    path.attr("d", valueline(result));
  });
});

function lastPrice() {
  const last = Actions.findOne({price: {$ne: null}}, {sort: {timestamp: -1}, limit: 1});
  if (last) return last.price;
  return 0.5;
}

Template.trade.onCreated(function() {
  // Not reactive, make sure this template only renders once last price shows
  this.sliderVal = new ReactiveVar(lastPrice());
});

Template.trade.helpers({
  leftProb: function() {
    const prob = Template.instance().sliderVal.get();
    return (1-prob).toFixed(2);
  },
  rightProb: function() {
    const prob = Template.instance().sliderVal.get();
    return prob.toFixed(2);
  },
  leftWin: function() {
    const prob = Template.instance().sliderVal.get();
    return Scoring.qsr(lastPrice(), prob, false);
  },
  rightWin: function() {
    const prob = Template.instance().sliderVal.get();
    return Scoring.qsr(lastPrice(), prob, true);
  }
});

Template.trade.onRendered(function() {
  this.$(".slider").slider({
    min: 0.00,
    max: 1.00,
    step: 0.01,
    value: this.sliderVal.get(),
    slide: (event, ui) => {
      this.sliderVal.set(ui.value);
    }
  });
});

Template.trade.events({
  "click .set-price": function(e, t) {
    const value = t.$(".slider").slider("value");
    const currentScenario = Scenarios.findOne();

    if (! currentScenario ) {
      bootbox.alert("Currently not trading!");
      return;
    }

    Meteor.call("setPrice", currentScenario._id, value, function(err) {
      if (err) bootbox.alert(err);
    });
  }
});

Template.profitBadge.helpers({
  color: function() {
    if (this < 0) return "alert-danger";
    return "alert-success";
  },
  formatted: function () {
    const text = this && this.toFixed && this.toFixed(3);
    return this > 0 ? "+" + text: text;
  }
});

Template.userTable.helpers({
  actions: function() {
    return Actions.find({}, {sort: {turn: 1}})
  },
  rowStyle: function () {
    return this.price ? "info" : "warning";
  },
  username: function() {
    const user = Meteor.users.findOne(this.userId);
    return user && user.username;
  },
  lastPayoff: function() {
    return this.payoff && this.payoff;
  },
  totalPayoff: function() {
    const user = Meteor.users.findOne(this.userId);
    return user && user.profit;
  }
});
