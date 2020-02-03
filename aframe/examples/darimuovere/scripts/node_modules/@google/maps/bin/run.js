#!/usr/bin/env node

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

var maps = require('@google/maps');
var args = maps.cli.parseArgs(process.argv.slice(3));
var options = {};

if (args.key != undefined) {
  options.key = args.key;
  delete args.key;
}

var client = maps.createClient(options);
var commands = Object.keys(client).join(', ');

try {
  var commandName = process.argv.length > 2 ? process.argv[2] : '';
  var commandFunc = client[commandName];
  if (commandFunc == undefined) {
    throw {message: `'${commandName}' is not a valid command, usage is:

googlemaps command --arg1 'value1' --arg2 'value2'

where command is one of: ${commands}

For arg details, see: https://googlemaps.github.io/google-maps-services-js/docs/GoogleMapsClient.html
`};
  }
  commandFunc(args, maps.cli.callback)
} catch (error) {
    console.log("Error:", error.message);
}
