require 'sinatra/base'
require 'sinatra/async'
require 'redis'
require 'eventmachine'
require 'em-hiredis'
require 'uuid'
require 'yaml'

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

    @sub.on(:message) do |channel, message|
      if (channel == job_request_id)

        # we've recieved a new job id. Awesome!
        # save this job in our jobs list (in redis.)
        response = { 
          :job_request_id => job_request_id,
          :job_id => message, 
          :name => request_body["name"], 
          :url => request_body["url"],
          :status => 'started'
        }.to_json

        # save this job in our jobs list.
        @read.hset key_for('jobs'), message, response

        # return the response
        body response
      end
    end
  end

  # return all availabe jobs in the system
  get '/list' do
    jobs = []
    jobs_raw = @read.hvals(key_for('jobs'))

    jobs_raw.each do |job|
      jobs << JSON.parse(job)
    end
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

  def key_for(q)
    return @config.redis.namespace + @config.redis.key_names[q]
  end 

end
