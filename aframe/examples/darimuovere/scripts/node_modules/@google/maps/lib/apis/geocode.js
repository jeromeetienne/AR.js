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
 * Makes a geocode request.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.geocode
 * @function
 * @param {Object} query
 * @param {string} [query.address]
 * @param {Object} [query.components]
 * @param {Object} [query.bounds]
 * @param {number} query.bounds.south
 * @param {number} query.bounds.west
 * @param {number} query.bounds.north
 * @param {number} query.bounds.east
 * @param {string} [query.region]
 * @param {string} [query.language]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.geocode = {
  url: 'https://maps.googleapis.com/maps/api/geocode/json',
  validator: v.object({
    address: v.optional(v.string),
    components: v.optional(utils.pipedKeyValues),
    bounds: v.optional(utils.bounds),
    region: v.optional(v.string),
    language: v.optional(v.string),
    retryOptions: v.optional(utils.retryOptions),
    timeout: v.optional(v.number)
  })
};

/**
 * Makes a reverse geocode request.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.reverseGeocode
 * @function
 * @param {Object} query
 * @param {LatLng} [query.latlng]
 * @param {string} [query.place_id]
 * @param {string} [query.result_type]
 * @param {string} [query.location_type]
 * @param {string} [query.language]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.reverseGeocode = {
  url: 'https://maps.googleapis.com/maps/api/geocode/json',
  validator: v.compose([
    v.mutuallyExclusiveProperties(['place_id', 'latlng']),
    v.mutuallyExclusiveProperties(['place_id', 'result_type']),
    v.mutuallyExclusiveProperties(['place_id', 'location_type']),
    v.object({
      latlng: v.optional(utils.latLng),
      place_id: v.optional(v.string),
      result_type: v.optional(utils.arrayOf(v.string)),
      location_type: v.optional(utils.arrayOf(v.oneOf([
        'ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER', 'APPROXIMATE'
      ]))),
      language: v.optional(v.string),
      retryOptions: v.optional(utils.retryOptions),
      timeout: v.optional(v.number)
    })
  ])
};
