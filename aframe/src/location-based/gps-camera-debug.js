AFRAME.registerComponent('gps-camera-debug', {
    init: function () {
        this.current_coords_latitude;
        this.current_coords_longitude;
        this.origin_coords_latitude;
        this.origin_coords_longitude;
        this.camera_p_x;
        this.camera_p_z;
        this.entities = 0;

        // initialize
        this._buildCameraDebugUI(document.body);

        // retrieve specific UI components
        this.current_coords_latitude = document.querySelector('#current_coords_latitude');
        this.current_coords_longitude = document.querySelector('#current_coords_longitude');
        this.origin_coords_latitude = document.querySelector('#origin_coords_latitude');
        this.origin_coords_longitude = document.querySelector('#origin_coords_longitude');
        this.camera_p_x = document.querySelector('#camera_p_x');
        this.camera_p_z = document.querySelector('#camera_p_z');

        this.placesLoadedEventHandler = function() {
            this.entities++;
            const entities = document.querySelectorAll('[gps-entity-place]') && document.querySelectorAll('[gps-entity-place]').length || 0;

            if (entities === this.entities) {
                // all entities added, we can build debug UI
                this._buildDistancesDebugUI();
                window.removeEventListener('gps-entity-place-loaded', this.placesLoadedEventHandler.bind(this));
                window.dispatchEvent(new CustomEvent('debug-ui-added'));
            }
        };

        window.addEventListener('gps-entity-place-loaded', this.placesLoadedEventHandler.bind(this));
    },
    tick: function () {
        const camera = document.querySelector('[gps-camera]');
        const position = camera.getAttribute('position');

        this.camera_p_x.innerText = position.x.toFixed(6);
        this.camera_p_z.innerText = position.z.toFixed(6);

        var gpsPosition = camera.components['gps-camera'];
        if (gpsPosition) {
            if (gpsPosition.currentCoords) {
                this.current_coords_longitude.innerText = gpsPosition.currentCoords.longitude.toFixed(6);
                this.current_coords_latitude.innerText = gpsPosition.currentCoords.latitude.toFixed(6);
            }

            if (gpsPosition.originCoords) {
                this.origin_coords_longitude.innerText = gpsPosition.originCoords.longitude.toFixed(6);
                this.origin_coords_latitude.innerText = gpsPosition.originCoords.latitude.toFixed(6);
            }
        }
    },
    /**
     * Build and attach debug UI elements
     *
     * @param {HTMLElement} parent parent element where to attach debug UI elements
     */
    _buildCameraDebugUI: function(parent) {
        const container = document.createElement('div');
        container.classList.add('debug');

        const currentLatLng = document.createElement('div');
        currentLatLng.innerText = 'current lng/lat coords: ';
        const spanLng = document.createElement('span');
        spanLng.id = 'current_coords_longitude';
        const spanLat = document.createElement('span');
        spanLat.id = 'current_coords_latitude';
        currentLatLng.appendChild(spanLng);
        currentLatLng.appendChild(spanLat);

        container.appendChild(currentLatLng);

        const originLatLng = document.createElement('div');
        originLatLng.innerText = 'origin lng/lat coords: ';
        const originSpanLng = document.createElement('span');
        originSpanLng.id = 'origin_coords_longitude';
        const originSpanLat = document.createElement('span');
        originSpanLat.id = 'origin_coords_latitude';
        originLatLng.appendChild(originSpanLng);
        originLatLng.appendChild(originSpanLat);

        container.appendChild(originLatLng);

        const cameraDiv = document.createElement('div');
        cameraDiv.innerText = 'camera 3d position: ';
        const cameraSpanX = document.createElement('span');
        cameraSpanX.id = 'camera_p_x';
        const cameraSpanZ = document.createElement('span');
        cameraSpanZ.id = 'camera_p_z';

        cameraDiv.appendChild(cameraSpanX);
        cameraDiv.appendChild(cameraSpanZ);
        container.appendChild(cameraDiv);

        parent.appendChild(container);
    },
    /**
     * Build distances UI elements
     * @returns {void}
     */
    _buildDistancesDebugUI: function() {
        const div = document.querySelector('.debug');
        document.querySelectorAll('[gps-entity-place]').forEach((element) => {
            const debugDiv = document.createElement('div');
            debugDiv.classList.add('debug-distance');
            debugDiv.innerHTML = element.getAttribute('value');
            debugDiv.setAttribute('value', element.getAttribute('value'));
            div.appendChild(debugDiv);
        });
    },
});
