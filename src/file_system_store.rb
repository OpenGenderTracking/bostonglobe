require 'lib/store'

module Store
  class FileSystemStore < Store::Default

    def initialize(config)
      super(config)
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