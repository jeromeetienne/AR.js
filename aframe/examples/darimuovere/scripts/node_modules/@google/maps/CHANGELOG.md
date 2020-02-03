# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased](https://github.com/googlemaps/google-maps-services-js/compare/1.1.0...HEAD)

## [1.1.0](https://github.com/googlemaps/google-maps-services-js/compare/1.1.0...1.0.2) - 2020-01-21

### Changed
- added support for experience id header in [`#304`](https://github.com/googlemaps/google-maps-services-js/pull/304)
- simplified e2e tests in [`#305`](https://github.com/googlemaps/google-maps-services-js/pull/305)

## [1.0.2](https://github.com/googlemaps/google-maps-services-js/compare/1.0.1...1.0.2) - 2019-10-21

### Changed
- updated dependencies in [`#294`](https://github.com/googlemaps/google-maps-services-js/pull/294)

## [1.0.1](https://github.com/googlemaps/google-maps-services-js/compare/1.0.0...1.01) - 2019-09-20

### Changed

- deprecation warning for place fields: `alt_id`, `id`, `reference`, and `scope`. Read more about this at https://developers.google.com/maps/deprecations.

## [1.0.0](https://github.com/googlemaps/google-maps-services-js/compare/0.5.5...1.0.0) - 2019-09-11

### Merged

- add support for subfields in mask [`#269`](https://github.com/googlemaps/google-maps-services-js/pull/269)
- remove deprecated places radar [`#271`](https://github.com/googlemaps/google-maps-services-js/pull/271)
- run e2e tests separately [`#272`](https://github.com/googlemaps/google-maps-services-js/pull/272)
- add contributor and stackoverflow badges [`#273`](https://github.com/googlemaps/google-maps-services-js/pull/273)
- add github issue templates [`#268`](https://github.com/googlemaps/google-maps-services-js/pull/268)
- updates package-lock.json [`#266`](https://github.com/googlemaps/google-maps-services-js/pull/266)
- adds code coverage reporting [`#265`](https://github.com/googlemaps/google-maps-services-js/pull/265)
- updates deps to fix npm audit reported vulnerability [`#263`](https://github.com/googlemaps/google-maps-services-js/pull/263)
- fixed `reviews` field name [`#255`](https://github.com/googlemaps/google-maps-services-js/pull/255)
- Adds plus_code to findPlace field and fixes some tests [`#256`](https://github.com/googlemaps/google-maps-services-js/pull/256)
- Check content-type without significance of case-sensitivity [`#249`](https://github.com/googlemaps/google-maps-services-js/pull/249)
- distance matrix departure time unit change from miliseconds to seconds [`#124`](https://github.com/googlemaps/google-maps-services-js/pull/124)
- fixes #196 [`#247`](https://github.com/googlemaps/google-maps-services-js/pull/247)
- Add the "origin" parameter to the placesAutoComplete function [`#245`](https://github.com/googlemaps/google-maps-services-js/pull/245)
- docs: Add npm badge [`#242`](https://github.com/googlemaps/google-maps-services-js/pull/242)
- fixes pagination INVALID_REQUEST handling [`#230`](https://github.com/googlemaps/google-maps-services-js/pull/230)
- added https proxy agent for pursuing the requests behind corporate proxy [`#226`](https://github.com/googlemaps/google-maps-services-js/pull/226)
- Session token should be optional in AutoComplete [`#221`](https://github.com/googlemaps/google-maps-services-js/pull/221)
- Test against modern node versions [`#201`](https://github.com/googlemaps/google-maps-services-js/pull/201)
- Consistently use const in README [`#202`](https://github.com/googlemaps/google-maps-services-js/pull/202)
- Pull request to allow multiple components of each type [`#192`](https://github.com/googlemaps/google-maps-services-js/pull/192)
- placesPhoto should throw error if neither maxwidth or maxheigh is declared [`#190`](https://github.com/googlemaps/google-maps-services-js/pull/190)

### Fixed

- fixes #196 (#247) [`#196`](https://github.com/googlemaps/google-maps-services-js/issues/196)

### Commits

- Upgrades Jasmine dep [`e06b1e2`](https://github.com/googlemaps/google-maps-services-js/commit/e06b1e260d03dafdef59d6bf35ad71b9a55b14f9)
- rewrote unit tests, moved to unit/convert-spec [`73e7d20`](https://github.com/googlemaps/google-maps-services-js/commit/73e7d20568da3abb9d4ea82913ea43a38652ea81)
- Comments out tests for speed limit since the feature isn't widely available [`a6bfa97`](https://github.com/googlemaps/google-maps-services-js/commit/a6bfa970b1be0d081db42403673c0ec4cf40929c)

## [0.5.5](https://github.com/googlemaps/google-maps-services-js/compare/0.5.4...0.5.5) - 2018-07-17

### Fixed

- Fix locationbias validation. Closes #182 [`#182`](https://github.com/googlemaps/google-maps-services-js/issues/182)

### Commits

- Version 0.5.5 [`c935d36`](https://github.com/googlemaps/google-maps-services-js/commit/c935d367e8c40900a868b1f846b62cb0856d9bf2)

## [0.5.4](https://github.com/googlemaps/google-maps-services-js/compare/0.5.3...0.5.4) - 2018-07-09

### Commits

- Don't use regex for locationbias validation [`27fff4e`](https://github.com/googlemaps/google-maps-services-js/commit/27fff4e5444334d91e8e568402fb00c6a2b06127)
- Version 0.5.4 [`0e158a6`](https://github.com/googlemaps/google-maps-services-js/commit/0e158a682a1f2e0f40af68d36d05fe7bf3543318)

## [0.5.3](https://github.com/googlemaps/google-maps-services-js/compare/0.5.2...0.5.3) - 2018-07-02

### Commits

- Version 0.5.3 [`8428a8a`](https://github.com/googlemaps/google-maps-services-js/commit/8428a8a09fbf5ff6094ae1fb03ec9c8aa6405b6e)

## [0.5.2](https://github.com/googlemaps/google-maps-services-js/compare/0.5.1...0.5.2) - 2018-07-02

### Commits

- Version 0.5.2 [`cdee8c3`](https://github.com/googlemaps/google-maps-services-js/commit/cdee8c304e6c57fad16f62c1abf7229287d9f9d0)

## [0.5.1](https://github.com/googlemaps/google-maps-services-js/compare/0.5.0...0.5.1) - 2018-07-02

### Commits

- Version 0.5.1 [`507682e`](https://github.com/googlemaps/google-maps-services-js/commit/507682eb626e523bd5afe0ef500abbe9bd95556b)
- Add sessiontoken param to place details [`1308376`](https://github.com/googlemaps/google-maps-services-js/commit/1308376836348cccd950126d191c4f2db0a11aee)

## [0.5.0](https://github.com/googlemaps/google-maps-services-js/compare/0.4.6...0.5.0) - 2018-06-25

### Merged

- Add findplacebytext method and fields params [`#170`](https://github.com/googlemaps/google-maps-services-js/pull/170)
- Catch JSON.parse errors. [`#140`](https://github.com/googlemaps/google-maps-services-js/pull/140)
- Update docs [`#157`](https://github.com/googlemaps/google-maps-services-js/pull/157)

### Fixed

- Fix broken docs links. Closes #174. [`#174`](https://github.com/googlemaps/google-maps-services-js/issues/174)
- Add polyline encode/decode utils. Closes #162. [`#162`](https://github.com/googlemaps/google-maps-services-js/issues/162)

### Commits

- Better format for jsdoc [`6800f7f`](https://github.com/googlemaps/google-maps-services-js/commit/6800f7f628787f65b1035fd81d64258702591717)
- location param for places nearby is not required if pagetoken provided [`d5efe51`](https://github.com/googlemaps/google-maps-services-js/commit/d5efe5170fc849f0bfa4035e31f903c7a6a6f4c7)
- Add locationbias field to findplacefromtext [`bab91d7`](https://github.com/googlemaps/google-maps-services-js/commit/bab91d76748b207f3614bed991d071af1d28fced)

## [0.4.6](https://github.com/googlemaps/google-maps-services-js/compare/0.4.5...0.4.6) - 2018-03-18

### Merged

- Add region parameter to Text Search API [`#131`](https://github.com/googlemaps/google-maps-services-js/pull/131)
- Update directions-spec.js [`#133`](https://github.com/googlemaps/google-maps-services-js/pull/133)
- Fixing errors in Github-flavored markdown [`#127`](https://github.com/googlemaps/google-maps-services-js/pull/127)

### Commits

- Better CLI error handling. [`de079e7`](https://github.com/googlemaps/google-maps-services-js/commit/de079e72498ef268ba4b521c62d11bfa83e983f8)
- Catch JSON.parse errors. [`550d1e8`](https://github.com/googlemaps/google-maps-services-js/commit/550d1e816a6fefa827c45706c1a6ab3cb58a3168)
- Increase default QPS from 10 to 50 [`22e98d4`](https://github.com/googlemaps/google-maps-services-js/commit/22e98d4946321b6ff968848edbd9dda4c4e70166)

## [0.4.5](https://github.com/googlemaps/google-maps-services-js/compare/0.4.4...0.4.5) - 2017-10-12

### Commits

- Version 0.4.5 [`221c40d`](https://github.com/googlemaps/google-maps-services-js/commit/221c40d39753200e9739192bd7c341ff8358c145)
- Fix validation [`ddb077e`](https://github.com/googlemaps/google-maps-services-js/commit/ddb077e5a1dd994c27f9caa22373adacf12f51f7)

## [0.4.4](https://github.com/googlemaps/google-maps-services-js/compare/0.4.3...0.4.4) - 2017-10-11

### Merged

- Fix JSDoc for geocode bounds parameter [`#113`](https://github.com/googlemaps/google-maps-services-js/pull/113)

### Fixed

- Fix default arg handling. Closes #123. [`#123`](https://github.com/googlemaps/google-maps-services-js/issues/123)

### Commits

- Clarify speedLimits vs snappedSpeedLimits [`2561db7`](https://github.com/googlemaps/google-maps-services-js/commit/2561db7300be831b1b8bd0db3e0e749f0192c9bc)
- Version 0.4.4 [`17ac1e5`](https://github.com/googlemaps/google-maps-services-js/commit/17ac1e5314dc60f1b398848c3f4586f86852854c)

## [0.4.3](https://github.com/googlemaps/google-maps-services-js/compare/0.4.2...0.4.3) - 2017-07-25

### Merged

- Added example of promise constructor [`#103`](https://github.com/googlemaps/google-maps-services-js/pull/103)

### Fixed

- Fix response handling for successful non-json responses, namely places photo. Closes #104. [`#104`](https://github.com/googlemaps/google-maps-services-js/issues/104)
- Validate objects in pipedKeyValues. Closes #105. [`#105`](https://github.com/googlemaps/google-maps-services-js/issues/105)

### Commits

- Added example of promise constructor. [`8697305`](https://github.com/googlemaps/google-maps-services-js/commit/869730534d420a8c789318e880b90a7a23464a19)
- Version 0.4.3 [`f5fd532`](https://github.com/googlemaps/google-maps-services-js/commit/f5fd53225ae4c6b537b48bc685ac16983164e406)
- Update places.js [`8e3d28f`](https://github.com/googlemaps/google-maps-services-js/commit/8e3d28fcae72da2b1ad360989634100878404ded)

## [0.4.2](https://github.com/googlemaps/google-maps-services-js/compare/0.4.1...0.4.2) - 2017-07-03

### Commits

- Mark places radar search as deprecated. [`0ce041c`](https://github.com/googlemaps/google-maps-services-js/commit/0ce041cd3814c8d00948681d7a69393ca7b16bb3)
- Version 0.4.2 [`fafd754`](https://github.com/googlemaps/google-maps-services-js/commit/fafd7541a2c5c425e7c79458e6f9826d6e63977a)

## [0.4.1](https://github.com/googlemaps/google-maps-services-js/compare/0.4.0...0.4.1) - 2017-06-14

### Fixed

- Broader API support in isSuccessful/canRetry handlers. Closes #100. [`#100`](https://github.com/googlemaps/google-maps-services-js/issues/100)

### Commits

- Version 0.4.1 [`a3a0abd`](https://github.com/googlemaps/google-maps-services-js/commit/a3a0abd418431ff98807cf0791684a9520216381)
- Better error reporting in CLI tool [`7cad3b9`](https://github.com/googlemaps/google-maps-services-js/commit/7cad3b9f21a3cc5ad82753e7bb89c2194079e1f6)
- Fix per-API options handling [`bcd0322`](https://github.com/googlemaps/google-maps-services-js/commit/bcd03224692521f1ef2a56735ffa7350d3c7dc6b)

## [0.4.0](https://github.com/googlemaps/google-maps-services-js/compare/0.3.1...0.4.0) - 2017-06-09

### Merged

- Exclude false values from params [`#98`](https://github.com/googlemaps/google-maps-services-js/pull/98)
- Cleanup NPM package [`#93`](https://github.com/googlemaps/google-maps-services-js/pull/93)
- Geolocation [`#81`](https://github.com/googlemaps/google-maps-services-js/pull/81)
- Add input data to output data. [`#91`](https://github.com/googlemaps/google-maps-services-js/pull/91)
- Update docs on proper usage of `asPromise()` [`#90`](https://github.com/googlemaps/google-maps-services-js/pull/90)
- Use local https agent, instead of dirtying global agent [`#95`](https://github.com/googlemaps/google-maps-services-js/pull/95)
- Fixed handling multibyte encoding responses [`#87`](https://github.com/googlemaps/google-maps-services-js/pull/87)
- speed up response by 4x fold [`#83`](https://github.com/googlemaps/google-maps-services-js/pull/83)
- Remove memory leak in Task. [`#75`](https://github.com/googlemaps/google-maps-services-js/pull/75)
- Fix InvalidValueError to include the message in the stack trace. [`#67`](https://github.com/googlemaps/google-maps-services-js/pull/67)

### Fixed

- Fix places autocomplete param, type -&gt; types. Closes #92. [`#92`](https://github.com/googlemaps/google-maps-services-js/issues/92)
- Add strictbounds param to places API. Closes #74. [`#74`](https://github.com/googlemaps/google-maps-services-js/issues/74)
- Remove memory leak in Task. Fixes #71 [`#71`](https://github.com/googlemaps/google-maps-services-js/issues/71)
- Support per-client language param. Closes #64. [`#64`](https://github.com/googlemaps/google-maps-services-js/issues/64)

### Commits

- Geolocation amendments [`5ef38ec`](https://github.com/googlemaps/google-maps-services-js/commit/5ef38ec6f864432fd555aa09ac0caa6eab6e812f)
- Add gelocation API [`d550a72`](https://github.com/googlemaps/google-maps-services-js/commit/d550a72090346bc8496a6f9afc41d7280e5a21e4)
- Support JSON over HTTP POST in prep for geolocation API [`da36fe1`](https://github.com/googlemaps/google-maps-services-js/commit/da36fe140138a4a40a9d826d1d048d690cfa835c)

## [0.3.1](https://github.com/googlemaps/google-maps-services-js/compare/0.3.0...0.3.1) - 2016-12-01

### Merged

- Provide a way to add extra params to any request. [`#57`](https://github.com/googlemaps/google-maps-services-js/pull/57)
- Prevent the licenses turning up in the generated jsdoc. [`#56`](https://github.com/googlemaps/google-maps-services-js/pull/56)

### Commits

- Accept ZERO_RESULTS as a successful response. [`2c9be2d`](https://github.com/googlemaps/google-maps-services-js/commit/2c9be2d37b21102a7d28e489569dd1e911b44620)
- Cleaner custom params [`402f5d6`](https://github.com/googlemaps/google-maps-services-js/commit/402f5d6fe111472bdd5ca344c0997eb2a29b2943)
- Surface errors when the status is not OK (even though the network layer says OK) [`5f8223b`](https://github.com/googlemaps/google-maps-services-js/commit/5f8223bf7bbe569633fe3783873b636c56cb03d8)

## [0.3.0](https://github.com/googlemaps/google-maps-services-js/compare/0.2.1...0.3.0) - 2016-10-19

### Merged

- Add query autocomplete and fix places auto complete. Closes #44. [`#48`](https://github.com/googlemaps/google-maps-services-js/pull/48)
- Updated query.type doc for autocomplete in places.js [`#47`](https://github.com/googlemaps/google-maps-services-js/pull/47)
- Fix placesNearby rankby parameter [`#45`](https://github.com/googlemaps/google-maps-services-js/pull/45)
- Properly cancel timers [`#41`](https://github.com/googlemaps/google-maps-services-js/pull/41)

### Fixed

- Add query autocomplete and fix places auto complete. Closes #44. (#48) [`#44`](https://github.com/googlemaps/google-maps-services-js/issues/44)
- Cancel timeouts when a task is cancelled. [`#40`](https://github.com/googlemaps/google-maps-services-js/issues/40)

### Commits

- Adds Task.race() [`d031bf7`](https://github.com/googlemaps/google-maps-services-js/commit/d031bf72ab5cfd05b261b252378d041d92267980)
- Do proper cancelling of the delays in the throttled queue. [`5224e78`](https://github.com/googlemaps/google-maps-services-js/commit/5224e786947d0d9522af10750e2d075080fc3568)
- Use Task.race() to race the timeout and the request. [`56a47dc`](https://github.com/googlemaps/google-maps-services-js/commit/56a47dcc0486868d0ba1d70c39473b198068bf35)

## 0.2.1 - 2016-09-16

### Merged

- Fix timestamp conversion to accept Unix time [`#39`](https://github.com/googlemaps/google-maps-services-js/pull/39)
- Missing apis [`#37`](https://github.com/googlemaps/google-maps-services-js/pull/37)
- Fix "socket hang up" error [`#34`](https://github.com/googlemaps/google-maps-services-js/pull/34)
- Add channel parameter to URL [`#25`](https://github.com/googlemaps/google-maps-services-js/pull/25)
- Update README.md - add places API [`#29`](https://github.com/googlemaps/google-maps-services-js/pull/29)
- Updates the API key instructions [`#28`](https://github.com/googlemaps/google-maps-services-js/pull/28)
- Retry responses with status === 'OVER_QUERY_LIMIT' [`#27`](https://github.com/googlemaps/google-maps-services-js/pull/27)
- Add User-Agent header. [`#24`](https://github.com/googlemaps/google-maps-services-js/pull/24)
- Distinguish between cancellation and error, add .finally() method [`#21`](https://github.com/googlemaps/google-maps-services-js/pull/21)
- Add a real timeout option. [`#20`](https://github.com/googlemaps/google-maps-services-js/pull/20)
- Enable cancelling in-flight requests [`#19`](https://github.com/googlemaps/google-maps-services-js/pull/19)
- More links in docs home page; better TOC. [`#18`](https://github.com/googlemaps/google-maps-services-js/pull/18)
- Validation errors should throw an exception synchronously... [`#17`](https://github.com/googlemaps/google-maps-services-js/pull/17)
- Use jsdoc [`#15`](https://github.com/googlemaps/google-maps-services-js/pull/15)
- Fix unit tests: rename utils -&gt; convert [`#13`](https://github.com/googlemaps/google-maps-services-js/pull/13)
- Add more declarative validator logic; remove all logic from the API functions. [`#9`](https://github.com/googlemaps/google-maps-services-js/pull/9)
- Add validation logic. [`#8`](https://github.com/googlemaps/google-maps-services-js/pull/8)
- Add throttling (rate-limiting) of requests. [`#5`](https://github.com/googlemaps/google-maps-services-js/pull/5)
- Remove devDependency on node-fetch [`#6`](https://github.com/googlemaps/google-maps-services-js/pull/6)
- Add an implementation of exponential backoff [`#4`](https://github.com/googlemaps/google-maps-services-js/pull/4)

### Commits

- WIP: convert task to use resolve, reject, finally [`d5c2bdf`](https://github.com/googlemaps/google-maps-services-js/commit/d5c2bdfcd94eadd1f4527709610b5b63b04bdab6)
- Add copyright and licence to all source files. [`2ea0bca`](https://github.com/googlemaps/google-maps-services-js/commit/2ea0bca8e86d7325104ae2e7d70fe3362cb1824b)
- Converts each of the API modules from boilerplate methods into config structures. [`576e6a6`](https://github.com/googlemaps/google-maps-services-js/commit/576e6a6eab134fe56fa98f763452a93bf310dd9c)
