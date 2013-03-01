define([
  "app",
  "modules/articles",
  "d3"

], function(app, Article, d3) {

  var Stack = app.module();
  
  // default type
  Stack.Views.Default = Backbone.View.extend({
    initialize: function(options) {

      this.height = options.height || 200;
      this.width  = options.width  || 300;
      this.metric = options.metric || null;

      // verify we have an article collection
      if (typeof this.collection === "undefined" ||
          !(this.collection instanceof Article.Collection)) {
        throw new Error("Must pass an article collection to Timeline.")
      }

      this.range  = options.range || this.collection.timeRange();
    }
  });

  Stack.Views.Bars = Stack.Views.Default.extend({
    afterRender: function() {
      var self = this;

      // bin things by dates
      this.data = this.collection.binData();
      console.log(this.data);

      // initialize basic chart container
      this.chart = d3.select(this.el).append("svg")
        .attr("height", this.height)
        .attr("width", this.width)
        
      var stack = d3.layout.stack()
        .offset("zero")
        .values(function(d) { return d.values; })
        .x(function(d) { return moment(d.date, 'YYYYMMDD').toDate(); })
        .y(function(d) { return d.value; });

      var z = d3.scale.ordinal().range(["lightpink", "darkgray", "lightblue"]);
      var format = d3.time.format("%b");

      this.xAxis =  d3.scale.ordinal()
        .rangeRoundBands([40, this.width])
        .domain(this.collection.all_dates); //TODO SORT THIS

      this.yAxis = d3.scale.linear()
        .range([20, this.height - 30])
        .domain([0, this.collection.max_count]);

      var xAxis = d3.svg.axis()
        .scale(this.xAxis)
        .ticks(4)
        .orient("bottom");

      var yAxis = d3.svg.axis()
        .scale(this.yAxis)
        .ticks(3)
        .orient("left");

      // this.chart.append("g")
      //   .attr("class", "x axis")
      //   .attr("transform", "translate(0," + (this.height - 24) + ")")
      //   .call(xAxis);

      // add a y labeling
      this.chart.append("line")
        .attr("class", "y axis")
        .attr("x1", 40)
        .attr("x2", this.width)
        .attr("y1", this.height - 20 - this.yAxis(this.collection.max_count))
        .attr("y2", this.height - 20 -this.yAxis(this.collection.max_count))
        .attr("stroke", "#555")
        .attr("stroke-dasharray", "4,4")
      this.chart.append("text")
        .attr("x", this.width)
        .attr("y", this.height - 5 - this.yAxis(this.collection.max_count))
        .attr("text-anchor", "end")
        .text(this.collection.max_count);

      var layers = stack(this.data);

      var gender = this.chart.selectAll("g.gender")
        .data(this.data)
          .enter()
            .append("svg:g")
            .attr("class", function(d) {
              return "gender " + d.name;
            });

      var rect = gender.selectAll("rect")
        .data(function(d) {
          return d.values;
        })
        .enter()
          .append("svg:rect")
          .attr("data", function(d) { return d.value })
          .attr("x", function(d) { 
            return self.xAxis(d.date); 
          })
          .attr("y", function(d) { 
            // return self.yAxis(d.y0);
            return self.height -self.yAxis(d.y0) - self.yAxis(d.y);
          })
          .attr("height", function(d) { 
            if (d.value === 0) {
              return 0;
            } else {
              return self.yAxis(d.y);  
            }
            
          })
          .attr("width", self.xAxis.rangeBand());

      //Add a label per date.
      // var label = this.chart.selectAll("text")
      //     .data(this.xAxis.domain())
      //   .enter().append("text")
      //     .attr("x", function(d) { return self.xAxis(d.date) + self.xAxis.rangeBand() / 2; })
      //     .attr("y", 6)
      //     .attr("text-anchor", "middle")
      //     .attr("dy", ".71em")
      //     .text(format);
    }
  });

  // requires an article collection.
  Stack.Views.Chart = Stack.Views.Default.extend({

    afterRender : function() {
      var self = this;

      // bin things by dates
      this.data = this.collection.binData();
      var dataMin = Infinity, dataMax = 0;

      // find min and max for specific data
      _.each(this.data, function(bin){

        _.each(bin.values, function(datum) {
          var value = datum.value;

          if (value > dataMax) {
            dataMax = value;
          }
          if (value < dataMin) {
            dataMin = value;
          }
        });
      });

      // initialize basic chart container
      this.chart = d3.select(this.el).append("svg")
        .attr("height", this.height)
        .attr("width", this.width);

      var stack = d3.layout.stack()
        .offset("zero")
        .values(function(d) { return d.values; })
        .x(function(d) { return moment(d.date, 'YYYYMMDD').toDate(); })
        .y(function(d) { return d.value; });


      var area = d3.svg.area()
        .interpolate("cardinal")
        .x(function(d) { return  self.xAxis(moment(d.date, 'YYYYMMDD').toDate()); })
        .y0(function(d) { return self.yAxis(d.y0); })
        .y1(function(d) { return self.yAxis(d.y0 + d.y); });

      var layers = stack(this.data);

      this.xAxis = d3.time.scale()
        .range([40, this.width - 10])
        .domain([this.range.min.toDate(), this.range.max.toDate()]);

      this.yAxis = d3.scale.linear()
        .range([this.height - 25, 0])
        .domain([0, dataMax]);

      var xAxis = d3.svg.axis()
        .scale(this.xAxis)
        .ticks(5)
        .orient("bottom");

      var yAxis = d3.svg.axis()
        .scale(this.yAxis)
        .ticks(3)
        .orient("left");

      this.chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (this.height - 24) + ")")
        .call(xAxis);

      this.chart.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(40,1)")
        .call(yAxis);

      var z = d3.scale.category20c();

      this.chart.selectAll(".layer")
        .data(layers)
      .enter()
        .append("path")
        .attr("class", function(d) {
          return "layer " + d.name;
        })
        .attr("d", function(d) { return area(d.values); });
        // .style("fill", function(d, i) { return z(i); });
    }

  });

  return Stack;
});