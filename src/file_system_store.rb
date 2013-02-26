require 'lib/store'

module Store
  class FileSystemStore < Store::Default

    def initialize(config)
      super(config)
    end

    def get_job(job_id)
      full_path = File.expand_path(
        File.join(
          File.dirname(__FILE__), 
          "../", 
          @config.FileSystemStore.jobs.path,
          job_id + ".json"
        ) 
      )

      JSON.parse(File.open(full_path, 'r').read)
    end

    def list_jobs
      job_files = Dir[File.expand_path(
            File.join(
              File.dirname(__FILE__), 
              "../", 
              @config.FileSystemStore.jobs.path,
              "*.json")
            )
      ]

      jobs = []
      job_files.each do |job_file|
        jobs << JSON.parse(
          File.open(job_file, 'r').read
        )
      end
      jobs
    end

    def save_job(job)
      full_path = File.expand_path(
        File.join(
          File.dirname(__FILE__), 
          "../", 
          @config.FileSystemStore.jobs.path,
          job[:_id] + ".json"
        ) 
      )

      new_job = JSON.pretty_generate(job)
      file = File.open(full_path, 'w')
      file.write(new_job)
      file.close
    end

    def update_job(job)
      save_job(job)
    end
    
    def get_article(article_id)
      article = { "id" => article_id }
      JSON.parse(
        File.open(article_path(article), 'r').read
      )
    end

    def list_articles(job_id)
      job = get_job(job_id)
      articles = []
      job["article_ids"].each do |article_id|
        articles << get_article(article_id)
      end
      articles
    end

    def update_article(article)
      save_article(article)
    end

    def save_article(article)
      new_article = JSON.pretty_generate(article)
      file = File.open(article_path(article), 'w')
      file.write(new_article)
      file.close
    end

    def has_article?(article)
      File.exists?(article_path(article))
    end

    private 
    def article_path(article)
      File.expand_path(
        File.join(
          File.dirname(__FILE__), 
          "../", 
          @config.FileSystemStore.articles.path,
          article["id"] + ".json"
        ) 
      )
    end
  end
end