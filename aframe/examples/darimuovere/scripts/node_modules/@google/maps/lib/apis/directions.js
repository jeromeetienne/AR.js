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
 * Makes a directions request.
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.directions
 * @function
 * @param {Object} query
 * @param {LatLng} query.origin
 * @param {LatLng} query.destination
 * @param {string} [query.mode]
 * @param {LatLng[]} [query.waypoints]
 * @param {boolean} [query.alternatives]
 * @param {string[]} [query.avoid]
 * @param {string} [query.language]
 * @param {string} [query.units]
 * @param {string} [query.region]
 * @param {Date|number} [query.departure_time]
 * @param {Date|number} [query.arrival_time]
 * @param {string} [query.traffic_model]
 * @param {string[]} [query.transit_mode]
 * @param {string} [query.transit_routing_preference]
 * @param {boolean} [query.optimize]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.directions = {
  url: 'https://maps.googleapis.com/maps/api/directions/json',
  validator: v.compose([
    v.mutuallyExclusiveProperties(['arrival_time', 'departure_time']),
    v.object({
      origin: utils.latLng,
      destination: utils.latLng,
      mode: v.optional(v.oneOf([
        'driving', 'walking', 'bicycling', 'transit'
      ])),
      waypoints: v.optional(utils.arrayOf(utils.latLng)),
      alternatives: v.optional(v.boolean),
      avoid: v.optional(utils.arrayOf(v.oneOf([
        'tolls', 'highways', 'ferries', 'indoor'
      ]))),
      language: v.optional(v.string),
      units: v.optional(v.oneOf(['metric', 'imperial'])),
      region: v.optional(v.string),
      departure_time: v.optional(utils.timeStamp),
      arrival_time: v.optional(utils.timeStamp),
      traffic_model: v.optional(v.oneOf([
        'best_guess', 'pessimistic', 'optimistic'
      ])),
      transit_mode: v.optional(utils.arrayOf(v.oneOf([
        'bus', 'subway', 'train', 'tram', 'rail'
      ]))),
      transit_routing_preference: v.optional(v.oneOf([
        'less_walking', 'fewer_transfers'
      ])),
      optimize: v.optional(v.boolean),
      retryOptions: v.optional(utils.retryOptions),
      timeout: v.optional(v.number)
    }),
    function(query) {
      if (query.waypoints && query.optimize) {
        query.waypoints = 'optimize:true|' + query.waypoints;
      }
      delete query.optimize;

      if (query.waypoints && query.mode === 'transit') {
        throw new v.InvalidValueError('cannot specify waypoints with transit');
      }

      if (query.traffic_model && !query.departure_time) {
        throw new v.InvalidValueError('traffic_model requires departure_time');
      }
      return query;
    }
  ])
};
