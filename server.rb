require 'sinatra'
require 'haml'
require 'debugger'
require 'json'
require 'redis'
require 'confstruct'
require './helpers/job_api'

set :views, './public'

# get our configuration data
config = Confstruct::Configuration.new(YAML.load_file('config.yaml'))

get '/' do
  haml :index
end

# see config.ru for GenderTracker specific calls.