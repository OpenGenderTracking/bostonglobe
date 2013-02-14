# Gender Tracker Client for Boston Globe API

This sinatra application is a sample web client using the Boston Globe API. It relies on the [gendertracker](https://github.com/OpenGenderTracking/gendertracker) service.

It is in its infancy, and as such very incomplete!

## Requirements

1. get ruby-1.9.3-head by your favorite method of choice. I recommend rvm.
2. run `gem install bundler`
3. run `bundle install`
4. Intall redis
5. Run redis.
6. Make sure the genderTracker server is running.
7. Run the bostonglobe app by calling `thin start`

## Change log

### 2013/02/14

* Initial Boston Globe URL adding UI in place alongside basic job creation. No article processing happens yet.
* Created basic sinatra app infrastructure, merged in backbone-boilerplate and set up all routes appropriatly.
* No styling of any sort is presently in place, until we get some of the core infrastructure working.