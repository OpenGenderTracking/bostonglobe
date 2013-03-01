define([
  "app",
  "modules/articles",
  "d3"

], function(app, Article, d3) {

  var Timeline = app.module();
  
  // requires an article collection.
  Timeline.Views.Linechart = Backbone.View.extend({

    initialize : function(options) {
      
      this.height = options.height || 200;
      this.width  = options.width  || 300;
      this.metric = options.metric || null;

      // verify we have an article collection
      if (typeof this.collection === "undefined" ||
          !(this.collection instanceof Article.Collection)) {
        throw new Error("Must pass an article collection to Timeline.")
      }

      this.range  = options.range || this.collection.timeRange();
       
    },

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

      var classifications = this.chart.selectAll(".classification")
        .data(this.data, function(d) { return d.name; })
          .enter().append("g")
          .attr("class", "classification");

      var line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { 
          return self.xAxis(moment(d.date, 'YYYYMMDD').toDate()); 
        })
        .y(function(d) { 
          return self.yAxis(d.value); 
        });

      // mouse region
      classifications.append("path")
        .attr("d", function(d) { return line(d.values); })
        .attr("class", "mouseregion")
        .on("mouseover", function(d) {
          d3.select($(this).next()[0])
            .style("stroke-width", 3)
            .style("opacity", "1");
        })
        .on("mouseout", function(d) {
          d3.select($(this).next()[0])
            .style("stroke-width", 2)
            .style("opacity", "0.5");
        });

      classifications.append("path")
        .attr("class", function(d) { 
          return "line " + d.name; 
        })
        .attr("d", function(d) { return line(d.values); })
        .style("opacity", "0.5");

      
    }

  });


  return Timeline;
});
