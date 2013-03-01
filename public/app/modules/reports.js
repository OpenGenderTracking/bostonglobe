define([
  "app",
  "modules/jobs",
  "modules/articles",
  "modules/vis/timeline",
  "modules/vis/summary",
  "modules/vis/stack",

], function(app, Job, Article, Timeline, Summary, Stack) {
  
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

      this.$el.find('.article_authors').empty();
      if (this.model) {
        var authors = new Article.Authors(this.model.articles.authors());
        this.insertView('.article_authors', new Article.Views.AuthorsList({
          collection : authors
        }));
      }

      // render timeline
      this.$el.find('.article_timeline').empty();
      if (this.model) {
        var range = this.model.articles.timeRange();
        if (range.isRange) {
          this.insertView('.article_timeline', new Stack.Views.Bars({
            collection : this.model.articles,
            range : range,
            width: 600,
            height: 300
          }));
        }
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