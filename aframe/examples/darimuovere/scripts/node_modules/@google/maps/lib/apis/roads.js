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
 * Makes a snap-to-roads request.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.snapToRoads
 * @function
 * @param {Object} query
 * @param {LatLng[]} query.path
 * @param {boolean} [query.interpolate]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.snapToRoads = {
  url: 'https://roads.googleapis.com/v1/snapToRoads',
  supportsClientId: false,
  validator: v.object({
    path: utils.arrayOf(utils.latLng),
    interpolate: v.optional(v.boolean),
    retryOptions: v.optional(utils.retryOptions),
    timeout: v.optional(v.number)
  })
};

/**
 * Makes a nearest roads request.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.nearestRoads
 * @function
 * @param {Object} query
 * @param {LatLng[]} query.points
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.nearestRoads = {
  url: 'https://roads.googleapis.com/v1/nearestRoads',
  supportsClientId: false,
  validator: v.object({
    points: utils.arrayOf(utils.latLng),
    retryOptions: v.optional(utils.retryOptions),
    timeout: v.optional(v.number)
  })
};

/**
 * Makes a speed-limits request for a place ID. For speed-limits
 * requests using a path parameter, use the snappedSpeedLimits method.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.speedLimits
 * @function
 * @param {Object} query
 * @param {string[]} query.placeId
 * @param {string} [query.units] Either 'KPH' or 'MPH'
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.speedLimits = {
  url: 'https://roads.googleapis.com/v1/speedLimits',
  supportsClientId: false,
  validator: v.object({
    placeId: v.array(v.string),
    units: v.optional(v.oneOf(['KPH', 'MPH'])),
    retryOptions: v.optional(utils.retryOptions),
    timeout: v.optional(v.number)
  })
};

/**
 * Makes a speed-limits request for a path.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.snappedSpeedLimits
 * @function
 * @param {Object} query
 * @param {LatLng[]} query.path
 * @param {string} [query.units] Either 'KPH' or 'MPH'
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.snappedSpeedLimits = {
  url: 'https://roads.googleapis.com/v1/speedLimits',
  supportsClientId: false,
  validator: v.object({
    path: utils.arrayOf(utils.latLng),
    units: v.optional(v.oneOf(['KPH', 'MPH'])),
    retryOptions: v.optional(utils.retryOptions),
    timeout: v.optional(v.number)
  })
};
