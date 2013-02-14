$LOAD_PATH << '.'
require 'server'

map "/" do
  run Sinatra::Application
end

map "/job" do
  run JobAPI
end