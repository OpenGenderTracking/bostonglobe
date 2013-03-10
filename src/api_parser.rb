require 'lib/parser'
require 'open-uri'
require 'cgi'
require 'xml'
require 'sanitize'

module Parsers
  class APIParser < Parsers::Default

    def initialize(job, config, store)

      super(job, config, store)

      # fix url
      @job[:url] = check_url(@job[:url])

      # store the job to start. we will save it
      # again when we are done adding items to it.
      @job[:status] = 'getting articles'
      @store.save_job(@job)

      # do we have full text?
      @full_text = false
      if (@config.full_articles)
        @full_text = true
      end
    end

    # we have:
    # @job with a job_id and url
    def fetch

      fetch_all_articles(@job[:url])

      # when done fetching save the job
      @store.update_job(@job)

    end

    def generate_id(entry)
      
      # determine article id somehow here.
      entry["id"]

    end

    def parse(entry)
      
      article = {}

      article["id"] = self.generate_id(entry)

      # only save articles that don't already exist.
      if (!@store.has_article?(article))
        article["url"] = entry["data"]["canonicalurl"][0]
        article["title"] = entry["data"]["headline"][0]
        article["pub_date"] = entry["data"]["printpublicationdate"][0]
        article["byline"] = entry["data"]["byname"][0]

        if (@full_text)
          # try to find the full text file
          file_path = article["id"] + '.uuid.xml'

          file_path = File.expand_path(
            File.join(
              @config.full_articles.path,
              file_path 
            ) 
          )

          begin
            if (File.exists?(file_path))
              article_body = XML::Parser.string(File.open(file_path).read)
              article_body = article_body.parse

              article_body.find('//content').each do |body|
                article["body"] = Sanitize.clean(body.content)
                article["original_body"] = body.content
              end
            else 
              throw Exception.new("File doesn't exist")
            end
          rescue
            article["body"] = entry["data"]["summary"][0]
            article["original_body"] = entry["data"]["summary"][0]
          end

        else
          article["body"] = entry["data"]["summary"][0]
          article["original_body"] = entry["data"]["summary"][0]
        end

        # save the article with whatever store we're using.
        @store.save_article(article)
      end

      # save this article as being a part of the job.
      @job[:article_ids] << article["id"]

      article
    end

    private

    def fetch_all_articles(url)

      puts "fetching #{url}"
      data = open(url).read
      
      parsed_data = JSON.parse(data)

      # how many?
      start_index = get_start(url)
      total = parsed_data["hits"]["found"]
      on_current_page = parsed_data["hits"]["hit"].length

      articles = parsed_data["hits"]["hit"]

      articles.each do |article|
        self.parse(article)
      end

      if (start_index + on_current_page + 1 < total)
        new_url = set_start(url, start_index + on_current_page)
        fetch_all_articles(new_url)
      end

    end 

    def get_start(url)
      /start=([0-9]+)/.match(url)[1].to_i rescue 0
    end

    def set_start(url, new_start)
      url.gsub(/start=[0-9]+/, "start=#{new_start}")
    end

    # overwrite the return fields to just be what we need.
    def check_url(url)
      return url.gsub(/return-fields=[[a-z_\-0-9]+,?]+/m, "return-fields=canonicalurl,headline,summary,printpublicationdate,byname")
    end

  end
end