// Copyright 2017 Google Inc. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

precision highp float;

varying vec3 vPosition;

#define countX 7.0
#define countY 4.0
#define gridAlpha 0.75

uniform float dotRadius; //ui:0.0,0.01,0.006666666667
uniform vec3 dotColor; //ui:0.0,1.0,1.0
uniform vec3 lineColor; //ui:0.0,1.0,0.50
uniform vec3 backgroundColor; //ui:0.0,1.0,0.25
uniform float alpha; //ui:0.0,1.0,1.0

float Circle( in vec2 p, float r ) {
  return length( p ) - r;
}

float Line( in vec2 p, in vec2 a, in vec2 b ) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float t = clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0);
  vec2 pt = a + t * ba;
  return length( pt - p );
}

float Union( float a, float b ) {
  return min( a, b );
}

void main()
{
  vec2 count = vec2( countX, countY );
  vec2 size = vec2( 1.0 ) / count;
  vec2 halfSize = size * 0.5;
  vec2 uv = mod( vPosition.xz * 1.5, size ) - halfSize;

  float dots = Circle( uv - vec2( halfSize.x, 0.0 ), dotRadius );
  dots = Union( dots, Circle( uv + vec2( halfSize.x, 0.0 ), dotRadius ) );
  dots = Union( dots, Circle( uv + vec2( 0.0, halfSize.y ), dotRadius ) );
  dots = Union( dots, Circle( uv - vec2( 0.0, halfSize.y ), dotRadius ) );

  float lines = Line( uv, vec2( 0.0, halfSize.y ), -vec2( halfSize.x, 0.0 ) );
  lines = Union( lines, Line( uv, vec2( 0.0, -halfSize.y ), -vec2( halfSize.x, 0.0 ) ) );
  lines = Union( lines, Line( uv, vec2( 0.0, -halfSize.y ), vec2( halfSize.x, 0.0 ) ) );
  lines = Union( lines, Line( uv, vec2( 0.0, halfSize.y ), vec2( halfSize.x, 0.0 ) ) );
  lines = Union( lines, Line( uv, vec2( -halfSize.x, halfSize.y ), vec2( halfSize.x, halfSize.y ) ) );
  lines = Union( lines, Line( uv, vec2( -halfSize.x, -halfSize.y ), vec2( halfSize.x, -halfSize.y ) ) );
  lines = Union( lines, Line( uv, vec2( -halfSize.x, 0.0 ), vec2( halfSize.x, 0.0 ) ) );

  lines = clamp( smoothstep( 0.0, 0.0035, lines ), 0.0, 1.0 );
  dots = clamp( smoothstep( 0.0, 0.001, dots ), 0.0, 1.0 );

  float result = Union( dots, lines );
  gl_FragColor = vec4( mix( backgroundColor + mix( dotColor, lineColor, dots ),
    backgroundColor, result ), mix( gridAlpha, alpha, result ) );
}
