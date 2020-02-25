AFRAME.registerComponent('gps-entity-place', {
    _cameraGps: null,
    schema: {
        longitude: {
            type: 'number',
            default: 0,
        },
        latitude: {
            type: 'number',
            default: 0,
        }
    },
    init: function () {
        window.addEventListener('gps-camera-origin-coord-set', function () {
            if (!this._cameraGps) {
                var camera = document.querySelector('[gps-camera]');
                if (!camera.components['gps-camera']) {
                    console.error('gps-camera not initialized')
                    return;
                }
                this._cameraGps = camera.components['gps-camera'];
            }

            this._updatePosition();
        }.bind(this));

        window.addEventListener('gps-camera-update-position', function (ev) {
            if (!this.data || !this._cameraGps) {
                return;
            }

            var dstCoords = {
                longitude: this.data.longitude,
                latitude: this.data.latitude,
            };

            // it's actually a 'distance place', but we don't call it with last param, because we want to retrieve distance even if it's < minDistance property
            var distance = this._cameraGps.computeDistanceMeters(ev.detail.position, dstCoords);

            this.el.setAttribute('distance', distance);
            this.el.setAttribute('distanceMsg', formatDistance(distance));
            this.el.dispatchEvent(new CustomEvent('gps-entity-place-update-positon', { detail: { distance: distance } }));
        }.bind(this));

        this._positionXDebug = 0;

        window.dispatchEvent(new CustomEvent('gps-entity-place-added'));
        console.debug('gps-entity-place-added');

        this.debugUIAddedHandler = function () {
            this.setDebugData(this.el);
            window.removeEventListener('debug-ui-added', this.debugUIAddedHandler.bind(this));
        };

        window.addEventListener('debug-ui-added', this.debugUIAddedHandler.bind(this));
    },

    /**
     * Update place position
     * @returns {void}
     */
    _updatePosition: function () {
        var position = { x: 0, y: this.el.getAttribute('position').y || 0, z: 0 }
        var hideEntity = false;

        // update position.x
        var dstCoords = {
            longitude: this.data.longitude,
            latitude: this._cameraGps.originCoords.latitude,
        };

        position.x = this._cameraGps.computeDistanceMeters(this._cameraGps.originCoords, dstCoords, true);

        // place has to be hide
        if (position.x === Number.MAX_SAFE_INTEGER) {
            hideEntity = true;
        }

        this._positionXDebug = position.x;

        position.x *= this.data.longitude > this._cameraGps.originCoords.longitude ? 1 : -1;

        // update position.z
        var dstCoords = {
            longitude: this._cameraGps.originCoords.longitude,
            latitude: this.data.latitude,
        };

        position.z = this._cameraGps.computeDistanceMeters(this._cameraGps.originCoords, dstCoords, true);

        // place has to be hide
        if (position.z === Number.MAX_SAFE_INTEGER) {
            hideEntity = true;
        }

        position.z *= this.data.latitude > this._cameraGps.originCoords.latitude ? -1 : 1;

        if (position.y !== 0) {
            position.y = position.y - this._cameraGps.originCoords.altitude;
        }

        if (hideEntity) {
            this.el.setAttribute('visible', false);
        } else {
            this.el.setAttribute('visible', true);
        }

        // update element's position in 3D world
        this.el.setAttribute('position', position);
    },

    /**
     * Set places distances from user on debug UI
     * @returns {void}
     */
    setDebugData: function (element) {
        var elements = document.querySelectorAll('.debug-distance');
        elements.forEach(function (el) {
            var distance = formatDistance(this._positionXDebug);
            if (element.getAttribute('value') == el.getAttribute('value')) {
                el.innerHTML = el.getAttribute('value') + ': ' + distance + 'far';
            }
        });
    },
});

/**
 * Format distances string
 *
 * @param {String} distance
 */
function formatDistance(distance) {
    distance = distance.toFixed(0);

    if (distance >= 1000) {
        return (distance / 1000) + ' kilometers';
    }

    return distance + ' meters';
};
