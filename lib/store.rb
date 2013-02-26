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

    def get_article(article_id)
      # overwrite with your own storage mechanism.
    end

    def list_articles(job_id)
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