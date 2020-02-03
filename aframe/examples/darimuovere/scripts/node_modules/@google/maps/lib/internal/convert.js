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

var v = require('./validate');

var asArray = function(arg) {
  return Array.isArray(arg) ? arg : [arg];
};

exports.pipedKeyValues = function(arg) {
  if (!arg || typeof arg !== 'object') {
    throw new v.InvalidValueError('not an Object');
  }
  return Object.keys(arg).sort().map(function(key) {
    if (typeof arg[key] === 'object') {
      return arg[key].map(function(type) {
        return key + ':' + type;
      }).join('|');
    }
    return key + ':' + arg[key];
  }).join('|');
};

exports.locations = function(arg) {
  if (Array.isArray(arg) && arg.length == 2 && typeof arg[0] == 'number' && typeof arg[1] == 'number') {
    arg = [arg];
  }
  return asArray(arg).map(exports.latLng).join('|');
};

exports.arrayOf = function(validateItem, sep) {
  var validateArray = v.array(validateItem);
  return function(value) {
    value = validateArray(asArray(value));
    return value.join(sep || '|');
  };
};

exports.latLng = function(arg) {
  if (!arg) {
    throw new v.InvalidValueError();
  } else if (arg.lat != undefined && arg.lng != undefined) {
    arg = [arg.lat, arg.lng];
  } else if (arg.latitude != undefined && arg.longitude != undefined) {
    arg = [arg.latitude, arg.longitude];
  }
  return asArray(arg).join(',');
};

var validateBounds = v.object({
  south: v.number,
  west: v.number,
  north: v.number,
  east: v.number
});

exports.bounds = function(arg) {
  arg = validateBounds(arg);
  return arg.south + ',' + arg.west + '|' + arg.north + ',' + arg.east;
};

exports.timeStamp = function(arg) {
  if (arg == undefined) {
    arg = new Date();
  }
  if (arg.getTime) {
    arg = arg.getTime();
    // NOTE: Unix time is seconds past epoch.
    return Math.round(arg / 1000);
  }

  // Otherwise assume arg is Unix time
  return arg;
};

exports.retryOptions = v.object({
  timeout: v.optional(v.number),
  interval: v.optional(v.number),
  increment: v.optional(v.number),
  jitter: v.optional(v.number)
});
