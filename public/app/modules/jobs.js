define([
  "app",
  "modules/articles"

], function(app, Article) {

  var Job = app.module();

  // a single job model
  Job.Model = Backbone.Model.extend({
    url : 'job',
    idAttribute : '_id',
    parse : function(data) {
      if (typeof data === "string") {
        return JSON.parse(data);  
      } else {
        return data;
      }
    }
  });

  // a collection of jobs
  Job.Collection = Backbone.Collection.extend({
    model : Job.Model,
    url : 'job/list'
  });

  // a single list item for the list of available jobs.
  Job.Views.ListItem = Backbone.View.extend({
    template : 'jobs/listItem',
    events : {
      "click li" : "onJobSelection"
    },

    onJobSelection : function() {
      var self = this;
      // fetch the articles for the model
      this.model.articles = new Article.Collection([], { job : this.model });
      this.model.articles.fetch().then(function() {
        app.trigger("job:select", self.model);  
      });
    },

    serialize: function() {
      return { 'job' : this.model.toJSON() };
    }
  });

  // a list of available jobs
  Job.Views.List = Backbone.View.extend({
    template : 'jobs/list',
    
    initialize : function() {
      this.listenTo(this.collection, "reset add", this.render);
    },

    beforeRender: function() {
      var list = this.$el.find('ul');
      list.children().remove();

      // append a child for each job.
      this.collection.each(function(job) {
        this.insertView('ul', new Job.Views.ListItem({ 
          model : job 
        }));

      }, this);
    },

    serialize : function() {
      return { collection : this.collection };
    }
  });

  // Form requesting a new query type
  Job.Views.Form = Backbone.View.extend({
    template : 'jobs/new',
    
    events : {
      'click button' : 'onSubmit'
    },

    // pass a job_list option pointing to the job list view.
    initialize : function(attrs, options) {
      this.job_list = options.job_list;
    },

    // interrupt normal form submission to use backbon'e save
    // method instead.
    onSubmit : function(e) {

      // save the url in our job model.
      var url_value = this.$el.find('#url').val();
      var name      = this.$el.find('#query_name').val();
      this.model.set({ 'url': url_value, 'name' : name });

      // save the model. On success add it to the job list!
      this.model.save({}, { wait: true }).then(_.bind(function() {

        // save a clone of this model. Note we're keeping the
        // original to put the form data into it.
        this.job_list.add(this.model.clone());

        // reset the origial model to an empty job
        this.model = new Job.Model();

        // clear the form, since we were successful.
        this.$el.find('#url').val('');
        this.$el.find('#query_name').val('');

      }, this));

      
      return false;
    }
  });

  return Job;
});