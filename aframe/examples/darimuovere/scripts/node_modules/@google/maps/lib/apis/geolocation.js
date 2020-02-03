/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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
 * Makes a geolocation request.
 *
 * For a detailed guide, see https://developers.google.com/maps/documentation/geolocation/intro
 *
 * @memberof! GoogleMapsClient
 * @name GoogleMapsClient.geolocate
 * @function
 * @param {Object} query
 * @param {number} [query.homeMobileCountryCode]
 * @param {number} [query.homeMobileNetworkCode]
 * @param {string} [query.radioType]
 * @param {string} [query.carrier]
 * @param {boolean} [query.considerIp]
 * @param {Object[]} [query.cellTowers]
 * @param {Object[]} [query.wifiAccessPoints]
 * @param {ResponseCallback} callback Callback function for handling the result
 * @return {RequestHandle}
 */
exports.geolocate = {
  url: 'https://www.googleapis.com/geolocation/v1/geolocate',
  options: {
    method: 'POST',
    headers: {'content-type': 'application/json;'},
    canRetry: function(response) {
      return response.status === 403;
    },
    isSuccessful: function(response) {
      return response.status === 200 || response.status === 404;
    }
  },
  validator: v.object({
    homeMobileCountryCode: v.optional(v.number),
    homeMobileNetworkCode: v.optional(v.number),
    radioType: v.optional(v.string),
    carrier: v.optional(v.string),
    considerIp: v.optional(v.boolean),
    cellTowers: v.optional(v.array(v.object({
      cellId: v.number,
      locationAreaCode: v.number,
      mobileCountryCode: v.number,
      mobileNetworkCode: v.number,
      age: v.optional(v.number),
      signalStrength: v.optional(v.number),
      timingAdvance: v.optional(v.number)
    }))),
    wifiAccessPoints: v.optional(v.array(v.object({
      macAddress: v.string,
      signalStrength: v.optional(v.number),
      age: v.optional(v.number),
      channel: v.optional(v.number),
      signalToNoiseRatio: v.optional(v.number)
    }))),
    retryOptions: v.optional(utils.retryOptions),
    timeout: v.optional(v.number)
  })
};
