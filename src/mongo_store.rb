require 'lib/store'
require 'mongo'

module Store
  class MongoStore < Store::Default

    include Mongo

    def initialize(config)
      @config = config
      @mongo = MongoClient.new(
        @config.MongoStore.mongo.host, 
        @config.MongoStore.mongo.port
      ).db("bostonglobe")
      
      @jobs = @mongo.collection("jobs")
      @articles = @mongo.collection("articles")
    end

    def get_job(job_id)
      @jobs.find("_id" => job_id).first
    end

    def list_jobs
      jobs = []
      @jobs.find.each { |row| 
        jobs << row
      }
      jobs
    end
    
    def save_job(job)
      # overwrite with your own storage mechanism.
      @jobs.insert(job)
    end

    def update_job(job)
      # overwrite with your own storage mechanism.
      @jobs.update({ "_id" => job[:_id] }, job)
    end

    def get_article(article_id)
      @articles.find("id" => article_id).first
    end

    def list_articles(job_id)
      job = @jobs.find("_id" => job_id).first
      articles = @articles.find("id" => { "$in" => job["article_ids"] })
      articles.to_a
    end

    def update_article(article)
      @articles.update({ "id" => article["id"] }, article)
    end

    def save_article(article)
      # overwrite with your own storage mechanism.
      @articles.insert(article)
    end

    def has_article?(article)
      # return true if article already exists
      @articles.find("id" => article["id"]).to_a.length > 0
    end

  end
end