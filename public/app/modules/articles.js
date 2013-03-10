define([
  "app",
  "moment"
], function(app, moment) {

  var Article = app.module();

  Article.Model = Backbone.Model.extend({
    defaults : {
      "title" : ""
    },

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

    balanceByPronounOnly : function() {
      this.classification = this.get("metrics").pronouns.result.toLowerCase();
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

      if (p.female > 0.5) {
        this.classification = "female";
      } else if (p.male > 0.5) {
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

    authors : function() {
      var authors = {};
      this.each(function(article) {
        var author = article.get("byline");
        authors[author] = authors[author] || { 
          count : 0, 
          gender : article.get("metrics").byline_gender.result 
        };
        authors[author].count++;
      });

      var author_list = [];
      _.each(authors, function(author, name) {
        author_list.push({
          name : name,
          count : author.count,
          gender : author.gender
        });
      });
      return author_list;
    },

    // bins data by gender -> date -> count.
    binData : function(byMetric) {

      var bins = {
        male : {}, female : {}, unknown : {}
      };

      var range = this.timeRange();

      var all_dates = [];

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

        parsed_date = moment(date, 'YYYYMMDD');


        // if we're looking at more than 12 weeks, bin by month
        var twelveWeeks = 1000 * 60 * 60 * 24 * 7 * 12;
        var oneWeek = 1000 * 60 * 60 * 24 * 8;

        if ((range.max - range.min) <= oneWeek) {
          moment_date = parsed_date.format('YYYYMMDD');
        } else if ((range.max - range.min) > twelveWeeks) {
          moment_date = parsed_date.subtract('days', parsed_date.date()).format('YYYYMMDD');  
        } else {
          moment_date = parsed_date.subtract('days', parsed_date.day()).format('YYYYMMDD');  
        }

        bins[gender][moment_date] = bins[gender][moment_date] || 0;
        bins[gender][moment_date]++;  

        all_dates.push(moment_date);
      }, this);

      // pad the data to at least have all the same x points.
      this.all_dates = _.sortBy(_.unique(all_dates), function(date) {
        return moment(date).valueOf();
      });
      this.max_count = 0;
      var sum = 0;

      for(var i = 0; i < all_dates.length; i++) {
        sum = 0;
        _.each(bins, function(dates, gender) {
          if (typeof dates[all_dates[i]] === "undefined") {
            dates[all_dates[i]] = 0
          }
          sum += dates[all_dates[i]];
        });

        if (sum > this.max_count) {
          this.max_count = sum;
        }
      }

      // pad the data with zeroes for missing values.
      // for(var i = range.min; i < range.max; i = moment(i).add('days', 1)) {
      //   var d = i.format('YYYYMMDD');

      //   _.each(bins, function(dates, gender) {
      //     if (typeof dates[d] === "undefined") {
      //       dates[d] = 0
      //     }
      //   });
      // }

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

        data.push({ 
          name : gender, 
          values : genderData 
        }); 
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

  // author container. Has:
  // name
  // count
  // gender
  Article.Author = Backbone.Model.extend({});
  Article.Authors = Backbone.Collection.extend({
    model: Article.Author,
    comparator : function(article) {
      return -article.get("count");
    }
  });

  Article.Views.AuthorListItem = Backbone.View.extend({
    template: "articles/authorListItem",
    tagName: "li",
    events: {
      "click" : "onAuthorListSelection"
    },

    onAuthorListSelection : function(){
      url = "http://50.17.92.83/s?key=chris&bq=(and%20byname:'" + this.model.name + "'%20printpublicationdate:" + moment().subtract("days", 60).format("YYYYMMDD") + ".." + moment().format("YYYYMMDD") + ")&return-fields=id&start=0&size=50&rank=-printpublicationdate";
      Job.Views.Form.enqueueNewJob(url , "author: " + this.model.name);
    },

    serialize: function() {
      return this.model.toJSON();
    }
  });

  Article.Views.AuthorsList = Backbone.View.extend({
    template : "articles/authorList",
    beforeRender: function() {
      this.collection.each(function(author) {
        this.insertView('ul', new Article.Views.AuthorListItem({ 
          model : author 
        }));
      }, this);
    }
  });

  return Article;
});
