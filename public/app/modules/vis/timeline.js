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

      // bin things by dates
      this.data = this.collection.binData();
      console.log(this.collection.timeRange());

      // initialize basic chart container
      this.chart = d3.select(this.el).append("svg")
        .attr("height", this.height)
        .attr("width", this.width);
    },

    beforeRender : function() {

    },

    

  });


  return Timeline;
});
