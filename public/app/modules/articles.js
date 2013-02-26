define([
  "app"
], function(app) {

  var Article = app.module();

  Article.Model = Backbone.Model.extend({

    initialize : function(attrs, options) {
      // determine the balance of this article
      var results = this.get('metrics'),
          male = 0,
          female = 0,
          unknown = 0;

      _.each(results, function(score, metric) {
        if (score.result === "Female") {
          female++;
        } else if (score.result === "Male") {
          male++;
        } else {
          unknown++;
        }
      }, this);

      var total = female + male + unknown;
      var p = {
        female : female / total,
        male : male / total,
        unknown : unknown / total
      };

      if (p.female > 0.66) {
        this.classification = "female";
      } else if (p.female > 0.66) {
        this.classificaton = "male"; 
      } else {
        this.classification = "unknown";
      }
    }

  });

  Article.Collection = Backbone.Collection.extend({
    
    model : Article.Model,

    initialize : function(models, options) {
      this.job = options.job;
    },
    url: function() {
      return '/job/' + this.job.id + '/articles/list'
    }
  });

  Article.Views.ListItem = Backbone.View.extend({
    template : 'articles/listItem',
    tagName : 'li',
    className : 'article',
    events : {
      'click div.raw_toggle' : 'onRawToggle'
    },
    onRawToggle : function(event) {
      var raw = this.$el.find('div.raw');
      if (raw.is(':visible')) {
        $(event.target).html('+ raw results');
      } else {
        $(event.target).html('&#8211; raw results');
      }
      raw.toggle();
    },
    serialize : function() {
      var article = this.model.toJSON();
      article.classification = this.model.classification;
      return article;
    }
  });

  Article.Views.ListView = Backbone.View.extend({
    template : 'articles/list',

    initialize : function() {
      this.listenTo(this.collection, "reset add", this.render);
    },

    beforeRender: function() {
      var list = this.$el.find('ul');
      list.children().remove();

      // append a child for each article.
      this.collection.each(function(article) {
        this.insertView('ul', new Article.Views.ListItem({ 
          model : article 
        }));

      }, this);
    },

    serialize : function() {
      return { collection : this.collection };
    }

  });

  return Article;
});