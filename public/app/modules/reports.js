define([
  "app",
  "modules/jobs",
  "modules/articles",
  "modules/vis/timeline",
   "modules/vis/summary"

], function(app, Job, Article, Timeline, Summary) {
  
  var Report = app.module();

  Report.Views.Main = Backbone.View.extend({
    template : "reports/main",

    initialize : function() {
      this.model = null;
      this.listenTo(app, "job:select", this.onJobSelect);
    },

    onJobSelect: function(job) {
      this.setModel(job);
    },

    // allows the resetting of the model.
    setModel : function(job) {
      this.model = job;
      this.render();
    },

    beforeRender: function() {
      this.$el.find('.article_summary').empty();
      if (this.model) {
        this.insertView('.article_summary', new Summary.Views.Main({
          collection : this.model.articles
        }));
      }

      // render timeline
      this.$el.find('.article_timeline').empty();
      if (this.model) {
        this.insertView('.article_timeline', new Timeline.Views.Linechart({
          collection : this.model.articles
        }));
      }

      // render article list
      this.$el.find('.article_list_container').empty();
      if (this.model) {
        this.insertView('.article_list_container', new Article.Views.ListView({
          collection : this.model.articles
        }));
      }
    }
  });

  return Report;

});