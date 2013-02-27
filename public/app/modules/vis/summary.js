define([
  "app",
  "modules/articles",
  "d3"
], function(app, Article, d3) {

  var Summary = app.module();
  
  Summary.Views.Main = Backbone.View.extend({
    template : "vis/summary/main",
    
    initialize : function(options) {

      this.height = options.height || 100;
      this.width = options.width || 100;

      // verify we have an article collection
      if (typeof this.collection === "undefined" ||
          !(this.collection instanceof Article.Collection)) {
        throw new Error("Must pass an article collection to Timeline.")
      }
    },

    afterRender : function() {
      this.chart = d3.select(this.$el.find('div.summary_squares')[0])
        .style("height", this.height + "px")
        .style("width", this.width + "px");

      // make the treemap
      var data = this.toTreemapData();
      var treemap = d3.layout.treemap()
        .value(function(d) {
          return d.total;
        })
        .size([this.height, this.width])
        .padding(1)
        .mode('slice');

      this.chart.datum(data)
        .selectAll("div")
        .data(treemap.nodes)
        .enter()
          .append("div")
          .attr("class", function(d) {
            return "treemap_cell " + d.name.toLowerCase();
          })
          .style("left",   function(d){ return d.x + "px"; })
          .style("top",    function(d){ return d.y + "px"; })
          .style("width",  function(d){ 
            return d.dx - 1 + "px"; 
          })
          .style("height", function(d){ 
            return d.dy - 1 + "px"; 
          });
    },

    toTreemapData : function() {
      var data = this.serialize();

      return { 
        name : "root",
        children : [
          { name : "Female",  total : data.breakdown.female },
          { name : "Male",    total : data.breakdown.male },
          { name : "Unknown", total : data.breakdown.unknown },
        ]
      };
    },


    serialize : function() {
      var d = {};
      d.breakdown = { male : 0, female : 0, unknown : 0 };
      
      // total number of articles
      d.total = this.collection.length;
      
      // compute the resulting classifications.
      this.collection.each(function(article) {
        d.breakdown[article.classification] += 1;
      });

      d.articles = this.collection.toJSON();

      return d;
    }
  });

  return Summary;
});
