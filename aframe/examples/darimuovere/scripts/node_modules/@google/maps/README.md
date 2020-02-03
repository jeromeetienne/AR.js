Node.js Client for Google Maps Services
=======================================

[![Build Status](https://travis-ci.org/googlemaps/google-maps-services-js.svg?branch=master)](https://travis-ci.org/googlemaps/google-maps-services-js)
[![npm](https://img.shields.io/npm/v/@google/maps.svg)](https://www.npmjs.com/package/@google/maps)
[![codecov](https://codecov.io/gh/googlemaps/google-maps-services-js/branch/master/graph/badge.svg)](https://codecov.io/gh/googlemaps/google-maps-services-js)
![GitHub contributors](https://img.shields.io/github/contributors/googlemaps/google-maps-services-js?color=green)

Use Node.js? Want to [geocode][Geocoding API] something? Looking
for [directions][Directions API]?
This library brings the [Google Maps API Web Services] to your Node.js
application. ![Analytics](https://maps-ga-beacon.appspot.com/UA-12846745-20/google-maps-services-js/readme?pixel)

The Node.js Client for Google Maps Services is a Node.js Client library
for the following Google Maps APIs:

 - [Directions API]
 - [Distance Matrix API]
 - [Elevation API]
 - [Geocoding API]
 - [Places API]
 - [Roads API]
 - [Time Zone API]

Keep in mind that the same [terms and conditions](https://developers.google.com/maps/terms)
apply to usage of the APIs when they're accessed through this library.

## Attention!

This library is designed for server-side Node.js applications. Attempting to use it client-side, in either the browser or any other environment like React Native, may in some cases work, but mostly will not. Please refrain from reporting issues with these environments when attempting to use them, since **server-side Node.js applications is the only supported environment for this library**. For other environments, try the [Maps JavaScript API], which contains a comparable feature set, and is explicitly intended for use with client-side JavaScript.

## Features

 - **Retry on Failure** Automatically retry when intermittent failures occur.
   That is, when any of the retryable 5xx errors are returned from the API.

 - **Rate-limiting** Requests are rate-limited by the client, which helps
   prevent reaching the server-enforced rate limit.

## Quick Start

    $ npm install @google/maps

**Note:** You'll need to have npm 2.7.0 or greater installed, since this library is hosted as a
[scoped package](https://docs.npmjs.com/getting-started/scoped-packages).

Create a new client object by calling `createClient()`

```js
const googleMapsClient = require('@google/maps').createClient({
  key: 'your API key here'
});
```

Make requests to the Google Maps APIs by calling methods on the client object.

```js
// Geocode an address.
googleMapsClient.geocode({
  address: '1600 Amphitheatre Parkway, Mountain View, CA'
}, function(err, response) {
  if (!err) {
    console.log(response.json.results);
  }
});
```

You may use promise-based solution also.

```js
const googleMapsClient = require('@google/maps').createClient({
  key: 'your API key here',
  Promise: Promise
});

googleMapsClient.geocode({address: '1600 Amphitheatre Parkway, Mountain View, CA'})
  .asPromise()
  .then((response) => {
    console.log(response.json.results);
  })
  .catch((err) => {
    console.log(err);
  });
```

For more usage examples, check out [the tests](spec/e2e/).

View the [reference documentation](https://googlemaps.github.io/google-maps-services-js/docs/)

Additional documentation for the included web services is available at
https://developers.google.com/maps/.

## API keys

Each Google Maps Web Service request requires an API key. To get an API key, follow the [Get API Key](https://developers.google.com/maps/documentation/javascript/get-api-key#get-the-api-key) instructions in our Maps JS API docs.

When you have an API key, you can create a client object:

```js
var googleMapsClient = require('@google/maps').createClient({
  key: 'your API key here'
});
```

### Client IDs

Google Maps APIs Premium Plan customers can use their [client ID and secret][clientid] to authenticate,
instead of an API key.

```js
var googleMapsClient = require('@google/maps').createClient({
  clientId: 'Add your client ID here',
  clientSecret: 'Add your client secret here',
});
```

**Important:** This key should be kept secret on your server.

## Typescript

Community-built typings for this library are available in `@types/google__maps` (note the double underscore).

`npm install @types/google__maps`

## Developing

In order to run the end-to-end tests, you'll need to supply your API key via an
environment variable.

    $ export GOOGLE_MAPS_API_KEY=AIza-your-api-key
    $ npm test

## Support

This library is community supported. We're comfortable enough with the
stability and features of the library that we want you to build real
production applications on it. We will try to support, through Stack
Overflow, the public surface of the library and maintain
backwards compatibility in the future; however, while the library is in
version 0.x, we reserve the right to make backwards-incompatible
changes. If we do remove some functionality (typically because better
functionality exists or if the feature proved infeasible), our intention
is to deprecate and give developers a year to update their code.

If you find a bug, or have a feature suggestion, please
[log an issue][issues]. If you'd like to contribute, please read
[How to Contribute][contrib].

## Command-line Interface

Installing via npm also provides the `googlemaps` command-line utility,
which can then be used to pipe JSON results to other command-line programs:

```
$ googlemaps directions --origin 'Sydney Town Hall' --destination 'Parramatta, NSW'
```

[apikey]: https://developers.google.com/maps/faq#keysystem
[clientid]: https://developers.google.com/maps/documentation/business/webservices/auth

[Google Maps API Web Services]: https://developers.google.com/maps/apis-by-platform#web_service_apis
[Directions API]: https://developers.google.com/maps/documentation/directions/
[directions-key]: https://developers.google.com/maps/documentation/directions/get-api-key#key
[Distance Matrix API]: https://developers.google.com/maps/documentation/distancematrix/
[Elevation API]: https://developers.google.com/maps/documentation/elevation/
[Geocoding API]: https://developers.google.com/maps/documentation/geocoding/
[Time Zone API]: https://developers.google.com/maps/documentation/timezone/
[Roads API]: https://developers.google.com/maps/documentation/roads/
[Places API]: https://developers.google.com/places/web-service/

[issues]: https://github.com/googlemaps/google-maps-services-js/issues
[contrib]: https://github.com/googlemaps/google-maps-services-js/blob/master/CONTRIBUTING.md
[Maps JavaScript API]: https://developers.google.com/maps/documentation/javascript/
