require './lib/store'
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
      @jobs.insert(job)
    end

    def update_job(job)
      @jobs.update({ "_id" => job[:_id] }, job)
    end

    def delete_job(job_id)
      # note this doesn't remove the articles. That's because jobs can share
      # articles.
      @jobs.remove({ "_id" => job_id })
    end

    def get_article(article_id, props=nil)
      article = @articles.find("id" => article_id).first
      if (props)
        temp = {
          "metrics" => article["metrics"]
        }
        props.each do |p|
          temp[p] = article[p]
        end
        temp
      else
        article
      end
    end

    def list_articles(job_id, props=nil)
      job = @jobs.find("_id" => job_id).first
      articles = @articles.find("id" => { "$in" => job["article_ids"] })

      a = articles.to_a

      if (props)
        articles_subset = []
        a.each do |article|
          temp = {
            "metrics" => article["metrics"]
          }
          props.each do |p|
            temp[p] = article[p]
          end
          articles_subset << temp
        end
        return articles_subset
      else
        a
      end
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