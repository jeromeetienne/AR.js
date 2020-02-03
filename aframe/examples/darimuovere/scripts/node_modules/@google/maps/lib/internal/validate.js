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

var Validate = exports;

function InvalidValueError(message) {
  this.message = message;
  this.name = 'InvalidValueError';
  Error.captureStackTrace(this, InvalidValueError);
}
InvalidValueError.prototype = Object.create(Error.prototype);
InvalidValueError.prototype.constructor = InvalidValueError;

InvalidValueError.prepend = function (message, error) {
  if (error instanceof InvalidValueError) {
    return new InvalidValueError(message + ': ' + error.message);
  }
  return error;
};

Validate.InvalidValueError = InvalidValueError;

Validate.acceptAll = function (value) {
  return value;
};

Validate.optional = function (validator) {
  return function (value) {
    return (value == undefined) ? value : validator(value);
  };
};

Validate.that = function (predicate, message) {
  return function (value) {
    if (predicate(value)) return value;
    throw new InvalidValueError(message);
  };
};

Validate.number = Validate.that(function (value) {
  return typeof value === 'number';
}, 'not a number');

Validate.string = Validate.that(function (value) {
  return typeof value === 'string';
}, 'not a string');

Validate.object = function (propertyValidators) {
  return function (object) {
    var result = {};

    if (!object || typeof object !== 'object') {
      throw new InvalidValueError('not an Object');
    }

    // Validate all properties.
    for (key in propertyValidators) {
      var validator = propertyValidators[key];
      try {
        var valid = validator(object[key]);
      } catch (error) {
        if (key in object) {
          throw InvalidValueError.prepend('in property "' + key + '"', error);
        } else {
          throw new InvalidValueError('missing property "' + key + '"');
        }
      }
      if (valid !== undefined) {
        result[key] = valid;
      }
    }

    // Check for unexpected properties.
    for (var key in object) {
      if (!propertyValidators[key]) {
        throw new InvalidValueError('unexpected property "' + key + '"');
      }
    }

    return result;
  };
};

Validate.array = function (validator) {
  return function (array) {
    var result = [];

    if (Object.prototype.toString.call(array) !== '[object Array]') {
      throw new InvalidValueError('not an Array');
    }

    for (var i = 0; i < array.length; ++i) {
      try {
        result[i] = validator(array[i]);
      } catch (error) {
        throw InvalidValueError.prepend('at index ' + i, error);
      }
    }

    return result;
  };
};

Validate.oneOf = function (names) {
  var myObject = {};
  var quotedNames = [];
  names.forEach(function (name) {
    myObject[name] = true;
    quotedNames.push('"' + name + '"');
  });

  return function (value) {
    if (myObject[value]) return value;
    throw new InvalidValueError('not one of ' + quotedNames.join(', '));
  };
};

Validate.atLeastOneOfProperties = function (names) {
  return function (value) {
    if (!value) return value;

    var quotedNames = [];
    for (var i = 0; i < names.length; i++) {
      if (names[i] in value) {
        return value;
      }
      quotedNames.push('"' + names[i] + '"');
    }

    throw new InvalidValueError(
      'one of ' + quotedNames.join(', ') + ' is required');
  };
};

Validate.mutuallyExclusiveProperties = function (names, oneRequired) {
  return function (value) {
    if (!value) return value;

    var present = [];
    var quotedNames = [];
    names.forEach(function (name) {
      if (name in value) {
        present.push('"' + name + '"');
      }
      quotedNames.push('"' + name + '"');
    });

    if (present.length > 1) {
      throw new InvalidValueError(
        'cannot specify properties '
        + present.slice(0, -1).join(', ')
        + ' and '
        + present.slice(-1)
        + ' together');
    } else if (present.length == 0 && oneRequired) {
      throw new InvalidValueError(
        'one of ' + quotedNames.join(', ') + ' is required');
    }

    return value;
  };
};

Validate.mutuallyExclusivePropertiesRequired = function (names) {
  return Validate.mutuallyExclusiveProperties(names, true);
};

Validate.compose = function (validators) {
  return function (value) {
    validators.forEach(function (validate) {
      value = validate(value);
    });
    return value;
  };
};

Validate.boolean = Validate.compose([
  Validate.that(function (value) {
    return typeof value === 'boolean';
  }, 'not a boolean'),
  function (value) {
    // In each API, boolean fields default to false, and the presence of
    // a querystring value indicates true, so we omit the value if
    // explicitly set to false.
    return value ? value : undefined;
  }
]);

Validate.deprecate = function (names) {
  var myObject = {};

  names.forEach(function (name) {
    myObject[name] = true;
  });

  return function (value) {
    if (myObject[value]) {
      process.emitWarning("Value, " + value + ", is deprecated. See https://developers.google.com/maps/deprecations.")
    }
    return value
  }
};