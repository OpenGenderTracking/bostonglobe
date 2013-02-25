# Gender Tracker Client for Boston Globe API

This sinatra application is a sample web client using the Boston Globe API. It relies on the [gendertracker](https://github.com/OpenGenderTracking/gendertracker) service.

It is in its infancy, and as such very incomplete!

## Requirements

1. get ruby-1.9.3-head by your favorite method of choice. I recommend rvm.
2. run `gem install bundler`
3. run `bundle install`
4. Intall redis
5. Run redis.
6. Install MongoDB
7. Run mongodb with the config file inside your `db` folder. Be sure to edit it appropriatly.
6. Make sure the genderTracker server is running.
7. Run the bostonglobe app by calling `thin start`

## Setup

Once all requirements are in place, you may need to update the following files:

1. `db/mongo.conf` - specifies the mongo server details. If you already have a server, feel free to use it instead. Otherwise this contains some basic details. Note we're using that same db folder to store the logs and mongo data files. Change those appropriatly based on your environment.

2. `config.yaml` 

* `redis`
 * `host` - the host name of your redis queue server
 * `port` - the port of the redis server
 * `namespace` - the prefix for redis keys

* `storeType` - The type of backend data store to use: `MongoStore` or `FileSystemStore`. Be sure to change the appropriate connectivity/path information in the section corresponding to the store type you picked.

## Change log

### 2013/02/25

Added support for using mongo db. Articles now get parsed and stored in either mongo or on the file system. Users can choose based on config file setting.

### 2013/02/24

Added fetching and parsing of boston globe API. This supports pagination of multipage results.

### 2013/02/14

* Initial Boston Globe URL adding UI in place alongside basic job creation. No article processing happens yet.
* Created basic sinatra app infrastructure, merged in backbone-boilerplate and set up all routes appropriatly.
* No styling of any sort is presently in place, until we get some of the core infrastructure working.