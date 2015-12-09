Template.priceInfo.onRendered(function() {
  const svg = d3.select(this.find("svg"));
  const $svg = this.$("svg");

  const margin = { left: 40, bottom: 30, top: 10, right: 10 };
  const width = $svg.width() - margin.left - margin.right;
  const height = $svg.height() - margin.bottom - margin.top;

  const x = d3.scale.linear().range([0, width]);
  const y = d3.scale.linear().domain([0,1]).range([height, 0]);

  const xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5);
  const yAxis = d3.svg.axis().scale(y).orient("left").ticks(5)
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
    const data = Actions.find({}, {sort: {timestamp: 1}}).fetch();
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

Template.trade.onRendered(function() {
  const $disp = this.$(".amount");

  this.$(".slider").slider({
    min: 0.0,
    max: 1.0,
    step: 0.01,
    value: 0.5,
    slide: function(event, ui) {
      $disp.text( ui.value.toFixed(2) );
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

    Meteor.call("setPrice", currentScenario._id, value);
  }
});
