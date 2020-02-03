/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Google Maps Service module.
 * @module @google/maps
 */

/**
 * Creates a Google Maps client. The client object contains all the API methods.
 *
 * @param {Object} options
 * @param {string} options.key API key (required, unless clientID and
 *     clientSecret provided).
 * @param {string=} options.clientId Maps API for Work client ID.
 * @param {string=} options.clientSecret Maps API for Work client secret (a.k.a.
 *     private key).
 * @param {string=} options.channel Maps API for Work channel.
 * @param {number=} options.timeout Timeout in milliseconds.
 *     (Default: 60 * 1000 ms)
 * @param {string=} options.language Default language for all queries.
        See https://developers.google.com/maps/faq#languagesupport
 * @param {number=} options.rate.limit Controls rate-limiting of requests.
 *     Maximum number of requests per period. (Default: 50)
 * @param {number=} options.rate.period Period for rate limit, in milliseconds.
 *     (Default: 1000 ms)
 * @param {number=} options.retryOptions.interval If a transient server error
 *     occurs, how long to wait before retrying the request, in milliseconds.
 *     (Default: 500 ms)
 * @param {Function=} options.Promise - Promise constructor (optional).
 * @return {GoogleMapsClient} The client object containing all API methods.
 */
exports.createClient = function(options) {
  options = options || {};

  if (options.experienceId && typeof options.experienceId === "string") {
    options.experienceId = [options.experienceId];
  }

  var makeApiCall = require("./internal/make-api-call").inject(options);
  var deprecate = require("util").deprecate;

  var makeApiMethod = function(apiConfig) {
    return function(query, callback, customParams) {
      query = apiConfig.validator(query);
      query.supportsClientId = apiConfig.supportsClientId !== false;
      query.options = apiConfig.options;
      if (options.language && !query.language) {
        query.language = options.language;
      }
      // Merge query and customParams.
      var finalQuery = {};
      customParams = customParams || {};
      [query, customParams].map(function(obj) {
        Object.keys(obj)
          .sort()
          .map(function(key) {
            finalQuery[key] = obj[key];
          });
      });
      return makeApiCall(apiConfig.url, finalQuery, callback);
    };
  };

  var geocode = require("./apis/geocode");
  var geolocation = require("./apis/geolocation");
  var timezone = require("./apis/timezone");
  var directions = require("./apis/directions");
  var distanceMatrix = require("./apis/distance-matrix");
  var elevation = require("./apis/elevation");
  var roads = require("./apis/roads");
  var places = require("./apis/places");

  return {
    directions: makeApiMethod(directions.directions),
    distanceMatrix: makeApiMethod(distanceMatrix.distanceMatrix),
    elevation: makeApiMethod(elevation.elevation),
    elevationAlongPath: makeApiMethod(elevation.elevationAlongPath),
    geocode: makeApiMethod(geocode.geocode),
    geolocate: makeApiMethod(geolocation.geolocate),
    reverseGeocode: makeApiMethod(geocode.reverseGeocode),
    findPlace: makeApiMethod(places.findPlace),
    places: makeApiMethod(places.places),
    placesNearby: makeApiMethod(places.placesNearby),
    place: makeApiMethod(places.place),
    placesPhoto: makeApiMethod(places.placesPhoto),
    placesAutoComplete: makeApiMethod(places.placesAutoComplete),
    placesQueryAutoComplete: makeApiMethod(places.placesQueryAutoComplete),
    snapToRoads: makeApiMethod(roads.snapToRoads),
    nearestRoads: makeApiMethod(roads.nearestRoads),
    speedLimits: makeApiMethod(roads.speedLimits),
    snappedSpeedLimits: makeApiMethod(roads.snappedSpeedLimits),
    timezone: makeApiMethod(timezone.timezone),
    setExperienceId: (...ids) => {
      if (typeof ids === "string") {
        ids = [ids];
      }
      options.experienceId = ids;
    },
    getExperienceId: _ => options.experienceId,
    clearExperienceId: _ => {
      options.experienceId = null;
    }
  };
};

exports.cli = require("./internal/cli");
exports.util = require("./util");
