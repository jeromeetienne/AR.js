const MAX_RANGE = 1000;  // in meters
const REFRESH_TIME = 120;  // in seconds


window.onload = () => {
    fetch("./assets/cartigli.json")
        .then(response => response.json())
        .then((res) => {
            const parsedPlaces = res.map((place) => {
                var tokens = place.geocode.split(', ');
                place.latitude = tokens[0];
                place.longitude = tokens[1];
                return place;
            });

            window.places = parsedPlaces;
            console.debug('Total places found: ', parsedPlaces.length);
        })

    window.addEventListener('gps-camera-update-position', function (ev) {
        const updateTime = Date.now();

        if (!window.places) {
            return;
        }

        if (window.lastUpdateTime && (((updateTime - window.lastUpdateTime) / 1000) < REFRESH_TIME)) {
            window.lastUpdateTime = updateTime;
            // not enough time has passed, don't update
            return;
        }

        if (window.lastUpdateTime && !isPositionDifferentOfRange(ev.detail.position, ev.detail.origin, MAX_RANGE)) {
            // position is not changed by MAX_RANGE from previous check, do not update places
            return;
        }

        window.lastUpdateTime = updateTime;

        // remove every place
        [...document.querySelectorAll('[gps-entity-place]')].forEach((element) => {
            element.remove();
        });

        // add only places within MAX_RANGE
        const placesToAdd = window.places.filter((place) => {
            const hasToBeAdded = !isPositionDifferentOfRange(ev.detail.position, {
                longitude: place.longitude,
                latitude: place.latitude,
            }, MAX_RANGE);

            return hasToBeAdded;
        });

        console.debug('Places to render:', placesToAdd.length);
        return renderPlaces(placesToAdd);

    });
};

function isPositionDifferentOfRange(position1, position2, range) {
    var dlongitude = THREE.Math.degToRad(position1.longitude - position2.longitude);
    var dlatitude = THREE.Math.degToRad(position1.latitude - position2.latitude);

    var a = (Math.sin(dlatitude / 2) * Math.sin(dlatitude / 2)) + Math.cos(THREE.Math.degToRad(position2.latitude)) * Math.cos(THREE.Math.degToRad(position1.latitude)) * (Math.sin(dlongitude / 2) * Math.sin(dlongitude / 2));
    var angle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = angle * 6378160;

    if (distance < 0) {
        distance = distance * -1;
    }

    return distance > range;
}

function renderPlaces(places) {
    let scene = document.querySelector('a-scene');

    var entitiesAdded = 0;
    window.addEventListener('gps-entity-place-added', () => {
        entitiesAdded++;

        if (entitiesAdded === places.length) {
            // all entities are added to the DOM, app is ready
            document.querySelector('.loader').remove();
        }
    });

    places.forEach((place) => {
        let latitude = place.latitude;
        let longitude = place.longitude;

        const entity = renderModel(place, latitude, longitude, scene);
        entity.addEventListener('gps-entity-place-update-positon', () => {
            var text = entity.querySelector('[text]');
            var distanceMsg = entity.getAttribute('distanceMsg');

            distanceMsg = distanceMsg.replace('meters', 'm');
            distanceMsg = distanceMsg.replace('kilometers', 'km');

            text.setAttribute('text', 'value', `${entity.getAttribute('name')}\n${distanceMsg}`);
        });
    });
}

function renderModel(place, latitude, longitude, scene) {
    const entity = document.createElement('a-entity');
    entity.setAttribute('gps-entity-place', `latitude: ${latitude}; longitude: ${longitude};`);
    entity.setAttribute('look-at', '[gps-camera]');
    entity.setAttribute('scale', '20 20 20');

    const markerEl = document.createElement('a-image');
    // add marker icon
    switch (place.category) {
        case 'canali':
            markerEl.setAttribute('src', './assets/marker-blu.svg');
            break;
        case 'giardini':
            markerEl.setAttribute('src', './assets/marker-verde.svg');
            break;
        default:
            markerEl.setAttribute('src', './assets/marker-rosso.svg');
            break;
    }
    entity.appendChild(markerEl);

    // add text for distance in meters
    const textEl = document.createElement('a-entity');
    textEl.setAttribute('text', {
        color: 'white',
        align: 'center',
        width: 4,
    });

    textEl.setAttribute('position', '0 -0.75 0');
    entity.appendChild(textEl);
    entity.setAttribute('name', place.fullname);

    scene.appendChild(entity);

    return entity;
}
