# Default storage class for articles.

module Store
  class Default

    def initialize(config)
      @config = config
    end

    def get_job(job_id)
      # overwrite with your own storage mechanism.
    end

    def save_job(job)
      # overwrite with your own storage mechanism.
    end

    def update_job(job)
      # overwrite with your own storage mechanism.
    end

    def delete_job(job_id)
      # overwrite with your own storage mechanism.
    end

    # return the contents of an article. Props allow
    # specifying what properties should be returned.
    # The props argument is optional. Without
    # it, all content will be returned. 
    def get_article(article_id, props=nil)
      # overwrite with your own storage mechanism.
    end

    # which job to list articles for and what properties
    # should be returned. The props argument is optional. 
    # Without it, all content will be returned.
    def list_articles(job_id, props=nil)
      # overwrite with your own storage mechanism.
    end

    def save_article(article)
      # overwrite with your own storage mechanism.
    end

    def has_article?(article)
      # return true if article already exists
    end

  end
end