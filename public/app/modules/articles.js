define([
  "app"
], function(app) {

  var Article = app.module();

  Article.Model = Backbone.Model.extend({});

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
    serialize : function() {
      return this.model.toJSON();
    }
  });

  Article.Views.ListView = Backbone.View.extend({
    template : 'articles/list',

    initialize : function() {
      this.listenTo(app, 'job:select', this.render);
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