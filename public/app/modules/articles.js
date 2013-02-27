define([
  "app",
  "moment"
], function(app, moment) {

  var Article = app.module();

  Article.Model = Backbone.Model.extend({

    initialize : function(attrs, options) {

      // determine article classification
      this.balanceByBylineOnly();
    },

    // for now, determine the classification
    // only by the byline. This is unfortunate
    // but a result of not so strong a pronoun
    // count because we don't have full text.
    balanceByBylineOnly : function() {
      this.classification = this.get("metrics").byline_gender.result.toLowerCase();
    },

    // determine the classification of an article
    // by averaging the available metrics.
    balanceByAverage : function() {
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
        this.classification = "male"; 
      } else {
        this.classification = "unknown";
      }
    },

    // Because our pronoun counts are so low since we only have
    // the summary data, we have to compute an estimate
    // of the balance by just doing a > or < check. This is a total
    // lie and shouldn't be used in practice to evaluate anything.
    // This is for demo only!
    parse : function(data) {

      if (data.metrics.pronouns.result == "Unknown") {
        // try to flip it based on which we have more of.
        if (data.metrics.pronouns.counts.female > 
            data.metrics.pronouns.counts.male &&
            data.metrics.pronouns.counts.female > 
            data.metrics.pronouns.counts.neutral) {
          data.metrics.pronouns.result = "Female";
        } else if (data.metrics.pronouns.counts.male > 
            data.metrics.pronouns.counts.felame &&
            data.metrics.pronouns.counts.male > 
            data.metrics.pronouns.counts.neutral) {
          data.metrics.pronouns.result = "Male";
        }
      }
      return data;
    }

  });

  Article.Collection = Backbone.Collection.extend({
    
    model : Article.Model,

    initialize : function(models, options) {
      this.job = options.job;
    },
    url: function() {
      return '/job/' + this.job.id + '/articles/list'
    },

    // returns the pubdate range
    timeRange : function() {
      var dates = this.pluck("pub_date");

      var parsedDates = _.map(dates, function(date) {
        return moment(date, 'YYYYMMDD');
      });

      var min = _.min(parsedDates),
          max = _.max(parsedDates);

      return {
        isRange : min.valueOf() === max.valueOf() ? false : true,
        min : min,
        max : max
      }
    },

    // bins data by gender -> date -> count.
    binData : function(byMetric) {

      var bins = {
        male : {}, female : {}, unknown : {}
      };

      this.each(function(article){
        var date   = article.get("pub_date"),
            gender = null;

        if (typeof byMetric === "undefined") {
          // we are counting by all metrics
          gender = article.classification;

        } else {
          // we are counting by a specific metric.
          gender = article.get("metrics")[byMetric].result.toLowerCase();
        }

        bins[gender][date] = bins[gender][date] || 0;
        bins[gender][date]++;  

      }, this);

      var data = [];

      // go over male, female, unknown
      _.each(bins, function(bin, gender) {

        var genderData = [];
        
        // go over articles in each.
        _.each(bin, function(count, date) {
          genderData.push({
            date : date, value : count
          });
        });  

        data[gender] = genderData;
      });
      
      return data;
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