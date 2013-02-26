define([
  "app",
  "modules/jobs",
  "modules/articles"

], function(app, Job, Article) {
  
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
      this.$el.empty();
      if (this.model) {
        this.insertView('.article_list_container', new Article.Views.ListView({
          collection : this.model.articles
        }));
      }
    }
  });

  return Report;

});