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
 */;

var utils = require('../internal/convert');
var v = require('../internal/validate');

/**
 * A Find Place request takes a text input, and returns a place.
 * The text input can be any kind of Places data, for example,
 * a name, address, or phone number.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.findPlace
 * @function
 * @param {Object} query
 * @param {string} query.input
 * @param {string} query.inputtype
 * @param {string} [query.language]
 * @param {Array<string>} [query.fields]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.findPlace = {
  url: 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
  validator: v.compose([
    v.object({
      input: v.string,
      inputtype: v.oneOf(['textquery', 'phonenumber']),
      language: v.optional(v.string),
      fields: v.optional(utils.arrayOf(v.compose([v.oneOf([
        'formatted_address', 'geometry', 'geometry/location', 'geometry/location/lat',
        'geometry/location/lng', 'geometry/viewport', 'geometry/viewport/northeast',
        'geometry/viewport/northeast/lat', 'geometry/viewport/northeast/lng',
        'geometry/viewport/southwest', 'geometry/viewport/southwest/lat',
        'geometry/viewport/southwest/lng', 'icon', 'id', 'name',
        'permanently_closed', 'photos', 'place_id', 'scope', 'types',
        'vicinity', 'opening_hours', 'price_level', 'rating', 'plus_code'
      ]), v.deprecate(["alt_id", "id", "reference", "scope"])]), ',')),
      locationbias: v.optional(v.string),
      retryOptions: v.optional(utils.retryOptions),
      timeout: v.optional(v.number)
    }),
    function (query) {
      if (!query.locationbias || query.locationbias == 'ipbias') {
        return query;
      }
      var isLatLng = function (latLng) {
        latLng = latLng.split(',');
        return latLng.length == 2 && !isNaN(latLng[0]) && !isNaN(latLng[1]);
      };
      var parts = query.locationbias.split(':');
      switch (parts[0]) {
        case 'point':
          if (isLatLng(parts[parts.length - 1])) {
            return query;
          }
          break;
        case 'circle':
          parts = parts[parts.length - 1].split('@');
          if (!isNaN(parts[0]) && isLatLng(parts[parts.length - 1])) {
            return query;
          }
          break;
        case 'rectangle':
          parts = parts[parts.length - 1].split('|');
          if (parts.length == 2 && isLatLng(parts[0]) && isLatLng(parts[1])) {
            return query;
          }
          break;
      }
      throw new v.InvalidValueError('invalid locationbias');
    }
  ])
};

/**
 * Makes a places request.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.places
 * @function
 * @param {Object} query
 * @param {string} query.query
 * @param {string} [query.language]
 * @param {LatLng} [query.location]
 * @param {number} [query.radius]
 * @param {number} [query.minprice]
 * @param {number} [query.maxprice]
 * @param {boolean} [query.opennow]
 * @param {string} [query.type]
 * @param {string} [query.pagetoken]
 * @param {string} [query.region]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.places = {
  url: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
  validator: v.object({
    query: v.optional(v.string),
    language: v.optional(v.string),
    location: v.optional(utils.latLng),
    radius: v.optional(v.number),
    minprice: v.optional(v.number),
    maxprice: v.optional(v.number),
    opennow: v.optional(v.boolean),
    type: v.optional(v.string),
    pagetoken: v.optional(v.string),
    retryOptions: v.optional(utils.retryOptions),
    timeout: v.optional(v.number),
    region: v.optional(v.string)
  })
};

/**
 * Makes a nearby places request.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.placesNearby
 * @function
 * @param {Object} query
 * @param {LatLng} query.location
 * @param {string} [query.language]
 * @param {number} [query.radius] Required unless using `rankby=distance`
 * @param {string} [query.keyword]
 * @param {number} [query.minprice]
 * @param {number} [query.maxprice]
 * @param {string} [query.name]
 * @param {boolean} [query.opennow]
 * @param {string} [query.rankby] Either 'prominence' or 'distance'
 * @param {string} [query.type]
 * @param {string} [query.pagetoken]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.placesNearby = {
  url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
  validator: v.compose([
    v.mutuallyExclusivePropertiesRequired(['location', 'pagetoken']),
    v.object({
      location: v.optional(utils.latLng),
      language: v.optional(v.string),
      radius: v.optional(v.number),
      keyword: v.optional(v.string),
      minprice: v.optional(v.number),
      maxprice: v.optional(v.number),
      name: v.optional(v.string),
      opennow: v.optional(v.boolean),
      rankby: v.optional(v.oneOf(['prominence', 'distance'])),
      type: v.optional(v.string),
      pagetoken: v.optional(v.string),
      retryOptions: v.optional(utils.retryOptions),
      timeout: v.optional(v.number)
    })
  ])
};

/**
 * Makes a place detail request.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.place
 * @function
 * @param {Object} query
 * @param {string} query.placeid
 * @param {string} query.sessiontoken Unique string identifying a single user's session. For convenience use require('@google/maps').util.placesAutoCompleteSessionToken()
 * @param {string} [query.language]
 * @param {Array<string>} [query.fields]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.place = {
  url: 'https://maps.googleapis.com/maps/api/place/details/json',
  validator: v.object({
    placeid: v.string,
    sessiontoken: v.optional(v.string),
    language: v.optional(v.string),
    fields: v.optional(utils.arrayOf(v.compose([v.oneOf([
      'address_component', 'adr_address', 'alt_id', 'formatted_address',
      'geometry', 'geometry/location', 'geometry/location/lat',
      'geometry/location/lng', 'geometry/viewport', 'geometry/viewport/northeast',
      'geometry/viewport/northeast/lat', 'geometry/viewport/northeast/lng',
      'geometry/viewport/southwest', 'geometry/viewport/southwest/lat',
      'geometry/viewport/southwest/lng', 'icon', 'id', 'name', 'permanently_closed', 'photo',
      'place_id', 'scope', 'type', 'url', 'utc_offset', 'vicinity',
      'formatted_phone_number', 'international_phone_number', 'opening_hours',
      'website', 'price_level', 'rating', 'reviews', 'user_ratings_total', 'plus_code'
    ]), v.deprecate(["alt_id", "id", "reference", "scope"])]), ',')),
    retryOptions: v.optional(utils.retryOptions),
    timeout: v.optional(v.number)
  })
};

/**
 * Makes a place photos request.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.placesPhoto
 * @function
 * @param {Object} query
 * @param {string} query.photoreference
 * @param {number} [query.maxwidth]
 * @param {number} [query.maxheight]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.placesPhoto = {
  url: 'https://maps.googleapis.com/maps/api/place/photo',
  validator: v.compose([
    v.atLeastOneOfProperties(['maxwidth', 'maxheight']),
    v.object({
      photoreference: v.string,
      maxwidth: v.optional(v.number),
      maxheight: v.optional(v.number),
      retryOptions: v.optional(utils.retryOptions),
      timeout: v.optional(v.number)
    })
  ])
};

/**
 * Makes a places autocomplete request.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.placesAutoComplete
 * @function
 * @param {Object} query
 * @param {string} query.input
 * @param {string} query.sessiontoken Unique string identifying a single user's session. For convenience use require('@google/maps').util.placesAutoCompleteSessionToken()
 * @param {number} [query.offset]
 * @param {LatLng} [query.location]
 * @param {string} [query.language]
 * @param {number} [query.radius]
 * @param {string} [query.origin]
 * @param {string} [query.types]
 * @param {Object} components
 * @param {boolean} [query.strictbounds]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.placesAutoComplete = {
  url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
  validator: v.object({
    input: v.string,
    sessiontoken: v.optional(v.string),
    offset: v.optional(v.number),
    location: v.optional(utils.latLng),
    language: v.optional(v.string),
    radius: v.optional(v.number),
    origin: v.optional(v.string),
    types: v.optional(v.oneOf(['geocode', 'address', 'establishment', '(regions)', '(cities)'])),
    components: v.optional(utils.pipedKeyValues),
    strictbounds: v.optional(v.boolean),
    retryOptions: v.optional(utils.retryOptions),
    timeout: v.optional(v.number)
  })
};


/**
 * Makes a places query autocomplete request.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.placesQueryAutoComplete
 * @function
 * @param {Object} query
 * @param {string} query.input
 * @param {number} [query.offset]
 * @param {LatLng} [query.location]
 * @param {string} [query.language]
 * @param {number} [query.radius]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.placesQueryAutoComplete = {
  url: 'https://maps.googleapis.com/maps/api/place/queryautocomplete/json',
  validator: v.object({
    input: v.string,
    offset: v.optional(v.number),
    location: v.optional(utils.latLng),
    language: v.optional(v.string),
    radius: v.optional(v.number),
    retryOptions: v.optional(utils.retryOptions),
    timeout: v.optional(v.number)
  })
};
