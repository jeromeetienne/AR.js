# Algo Steps

## Step 1 - Geolocalisation - starting coords - where i am now
- do geolocalisation ? how ? 
- moz dev https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition#Browser_compatibility

```javascript
navigator.geolocation.getCurrentPosition(function(position) {
  console.log(position.coords.latitude, position.coords.longitude);
})
```

Latitude : 53.3426249
Longitude: -6.238684000000001

## Step 2 - GeoCoding of destination coordinates - where i want to go
- here a query from a place description get the coordinates

```
curl "https://api.mapbox.com/geocoding/v5/mapbox.places/temple+bar.json?proximity=-6.238684000000001,53.34262491&access_token=pk.eyJ1IjoiamV0aWVubmUiLCJhIjoiY2o1eWNtbjA1MDBpbzMzbzd1M2tteDltcCJ9.G59EhJAyp3RRwMBzEqvvPw" | python -m json.tool | less
```

Latitude : 53.345457
Longitude: -6.264001

## Step 3 - Path from starting coords to destination coordinates
- rest API for direction - https://www.mapbox.com/help/getting-started-directions-api/

```bash
curl 'https://api.mapbox.com/directions/v5/mapbox/walking/-6.238684000000001,53.3426249;-6.264001,53.345457?steps=true&geometries=geojson&access_token=pk.eyJ1IjoiamV0aWVubmUiLCJhIjoiY2o1eWNtbjA1MDBpbzMzbzd1M2tteDltcCJ9.G59EhJAyp3RRwMBzEqvvPw' | python -m json.tool | less
```

## Step 4 - Draw that in AR ?
- build the mesh - easy
- where to put the mesh ? 
- Find position
  - use AR picking on the ground for the actual position in AR to be the starting point of the Path
- use device orientation for the orientation















---

# Notes
- data from https://twitter.com/jerome_etienne/status/893536926703251458
- rest API for direction - https://www.mapbox.com/help/getting-started-directions-api/
- basic request

```bash
curl 'https://api.mapbox.com/directions/v5/mapbox/cycling/-84.518641,39.134270;-84.512023,39.102779?geometries=geojson&access_token=pk.eyJ1IjoiamV0aWVubmUiLCJhIjoiY2o1eWNtbjA1MDBpbzMzbzd1M2tteDltcCJ9.G59EhJAyp3RRwMBzEqvvPw' | python -m json.tool
```

- API token https://www.mapbox.com/studio/account/tokens/
  - my access-token - pk.eyJ1IjoiamV0aWVubmUiLCJhIjoiY2o1eWNtbjA1MDBpbzMzbzd1M2tteDltcCJ9.G59EhJAyp3RRwMBzEqvvPw

---
