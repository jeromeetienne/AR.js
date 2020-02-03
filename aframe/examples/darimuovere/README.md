# Cartigli AR

A Web AR app to discover 'cartigli' in Bologna historic center.

## About data

All geolocated data can be found at `data/cartigli.json`.
Raw data from @qwerg can be found at `data/cart_item.json`.

Using `cd scripts && node clean-json.js` it cleans raw data and creates data in `data/data.json`.
You may need to run `npm install` before that.

Also, to add `category` (Edifici Storici, Giardini, Canali) to `cartigli.json` data, you have to launch `cd scripts && node tag-json.js` after the commands above.


## Launch

The app can be launched with `rna serve --https`

And navigate to `https://localhost:3000/public`.

## Use on the phone

After launching the web app, you just need to navigate, from the phone, to the server under the same network.

## Deploy

No deploy is needed. Just share the `public` folder.



