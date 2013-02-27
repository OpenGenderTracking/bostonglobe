require 'sinatra/base'
require 'sinatra/async'
require 'redis'
require 'eventmachine'
require 'em-hiredis'
require 'uuid'
require 'yaml'
require 'mongo'
require 'src/api_parser'
require 'src/mongo_store'
require 'src/file_system_store'
require 'active_support/inflector'

class JobAPI < Sinatra::Base
  register Sinatra::Async

  # make sure all connections are initialized
  before '/?*' do
    if (!@config)
      @config = Confstruct::Configuration.new(YAML.load_file('config.yaml'))
    end
    if (!@pub)
      # publishing service
      @pub = EM::Hiredis.connect("redis://#{@config.redis.host}:#{@config.redis.port}/4")
    end
    if (!@sub)
      # publishing service
      @sub = EM::Hiredis.connect("redis://#{@config.redis.host}:#{@config.redis.port}/4")
    end
    if (!@read)
      # reading (non evented)
      @read = Redis.new(:host => @config.redis.host, :port => @config.redis.port)
    end
    if (!@store)
      # start a store based on configuration details
      # available stores are MongoStore and FileSystemStore.
      @store = "Store::#{@config.storeType}".constantize.new(@config)
    end
  end


  # new job request comes into /jobs.
  # with a url and name.
  apost '/' do

    job_request_id = @config.redis.namespace + UUID.generate()
    job_id = nil
    request_body = JSON.parse(request.body.read.to_s)

    # request a new job id.
    @pub.publish 'new_job', job_request_id
    @sub.subscribe job_request_id
    @sub.subscribe 'process_article_done'

    @sub.on(:message) do |channel, message|
      if (channel == job_request_id)

        # we've recieved a new job id. Awesome!
        # save this job to mongo
        job_document = {
          :_id => message,
          :name => request_body["name"],
          :url => request_body["url"],
          :status => 'started',
          :article_ids => [],
          :date => Time.now()
        }

        # for not use a file system store.
        parser = Parsers::APIParser.new(
          job_document,
          @config,
          @store
        )

        # will get articles
        # will store them in the store
        # will store the job when its done with it
        parser.fetch

        # return the job
        body job_document.to_json

        # TODO: start processing job here!
        job_document[:article_ids].each do |article_id|
          
          # get the article
          article = @store.get_article(article_id)
          
          # send it to be processed
          @pub.publish "process_article", { :article => article, :job_id => job_document["_id"] }.to_json()

        end

      elsif (channel == 'process_article_done')
        
        # an article was processed. yey.
        article = JSON.parse(message)["article"]
        article.delete("_id")

        # re-save it
        @store.update_article(article)
      end
    end
  end

  # return all availabe jobs in the system
  get '/list' do
    jobs = @store.list_jobs
    body jobs.to_json
  end

  # delete a specific job from the available job list.
  delete '/:job_id' do
    job_id = params[:job_id]
    @read.hdel job_id

    # TODO: need to propagate that this job has been deleted. Not sure what
    # this means yet.
    response = { :job_id => job_id }.to_json
    body response
  end

  get '/:job_id/articles/list' do
    job_id = params[:job_id]
    @store.list_articles(job_id, ["title", "url", "id", "byline", "pub_date"]).to_json
  end
end
