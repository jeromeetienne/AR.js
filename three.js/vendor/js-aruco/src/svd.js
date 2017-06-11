/*
Copyright (c) 2012 Juan Mellado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
References:
- "Numerical Recipes in C - Second Edition"
  http://www.nr.com/
*/

var SVD = SVD || {};

SVD.svdcmp = function(a, m, n, w, v){
  var flag, i, its, j, jj, k, l, nm,
      anorm = 0.0, c, f, g = 0.0, h, s, scale = 0.0, x, y, z, rv1 = [];
      
  //Householder reduction to bidiagonal form
  for (i = 0; i < n; ++ i){
    l = i + 1;
    rv1[i] = scale * g;
    g = s = scale = 0.0;
    if (i < m){
      for (k = i; k < m; ++ k){
        scale += Math.abs( a[k][i] );
      }
      if (0.0 !== scale){
        for (k = i; k < m; ++ k){
          a[k][i] /= scale;
          s += a[k][i] * a[k][i];
        }
        f = a[i][i];
        g = -SVD.sign( Math.sqrt(s), f );
        h = f * g - s;
        a[i][i] = f - g;
        for (j = l; j < n; ++ j){
          for (s = 0.0, k = i; k < m; ++ k){
            s += a[k][i] * a[k][j];
          }
          f = s / h;
          for (k = i; k < m; ++ k){
            a[k][j] += f * a[k][i];
          }
        }
        for (k = i; k < m; ++ k){
          a[k][i] *= scale;
        }
      }
    }
    w[i] = scale * g;
    g = s = scale = 0.0;
    if ( (i < m) && (i !== n - 1) ){
      for (k = l; k < n; ++ k){
        scale += Math.abs( a[i][k] );
      }
      if (0.0 !== scale){
        for (k = l; k < n; ++ k){
          a[i][k] /= scale;
          s += a[i][k] * a[i][k];
        }
        f = a[i][l];
        g = -SVD.sign( Math.sqrt(s), f );
        h = f * g - s;
        a[i][l] = f - g;
        for (k = l; k < n; ++ k){
          rv1[k] = a[i][k] / h;
        }
        for (j = l; j < m; ++ j){
          for (s = 0.0, k = l; k < n; ++ k){
            s += a[j][k] * a[i][k];
          }
          for (k = l; k < n; ++ k){
            a[j][k] += s * rv1[k];
          }
        }
        for (k = l; k < n; ++ k){
          a[i][k] *= scale;
        }
      }
    }
    anorm = Math.max(anorm, ( Math.abs( w[i] ) + Math.abs( rv1[i] ) ) );
  }

  //Acumulation of right-hand transformation
  for (i = n - 1; i >= 0; -- i){
    if (i < n - 1){
      if (0.0 !== g){
        for (j = l; j < n; ++ j){
          v[j][i] = ( a[i][j] / a[i][l] ) / g;
        }
        for (j = l; j < n; ++ j){
          for (s = 0.0, k = l; k < n; ++ k){
            s += a[i][k] * v[k][j];
          }
          for (k = l; k < n; ++ k){
            v[k][j] += s * v[k][i];
          }
        }
      }
      for (j = l; j < n; ++ j){
        v[i][j] = v[j][i] = 0.0;
      }
    }
    v[i][i] = 1.0;
    g = rv1[i];
    l = i;
  }

  //Acumulation of left-hand transformation
  for (i = Math.min(n, m) - 1; i >= 0; -- i){
    l = i + 1;
    g = w[i];
    for (j = l; j < n; ++ j){
      a[i][j] = 0.0;
    }
    if (0.0 !== g){
      g = 1.0 / g;
      for (j = l; j < n; ++ j){
        for (s = 0.0, k = l; k < m; ++ k){
          s += a[k][i] * a[k][j];
        }
        f = (s / a[i][i]) * g;
        for (k = i; k < m; ++ k){
          a[k][j] += f * a[k][i];
        }
      }
      for (j = i; j < m; ++ j){
        a[j][i] *= g;
      }
    }else{
        for (j = i; j < m; ++ j){
          a[j][i] = 0.0;
        }
    }
    ++ a[i][i];
  }

  //Diagonalization of the bidiagonal form
  for (k = n - 1; k >= 0; -- k){
    for (its = 1; its <= 30; ++ its){
      flag = true;
      for (l = k; l >= 0; -- l){
        nm = l - 1;
        if ( Math.abs( rv1[l] ) + anorm === anorm ){
          flag = false;
          break;
        }
        if ( Math.abs( w[nm] ) + anorm === anorm ){
          break;
        }
      }
      if (flag){
        c = 0.0;
        s = 1.0;
        for (i = l; i <= k; ++ i){
          f = s * rv1[i];
          if ( Math.abs(f) + anorm === anorm ){
            break;
          }
          g = w[i];
          h = SVD.pythag(f, g);
          w[i] = h;
          h = 1.0 / h;
          c = g * h;
          s = -f * h;
          for (j = 1; j <= m; ++ j){
            y = a[j][nm];
            z = a[j][i];
            a[j][nm] = y * c + z * s;
            a[j][i] = z * c - y * s;
          }
        }
      }

      //Convergence
      z = w[k];
      if (l === k){
        if (z < 0.0){
          w[k] = -z;
          for (j = 0; j < n; ++ j){
            v[j][k] = -v[j][k];
          }
        }
        break;
      }

      if (30 === its){
        return false;
      }

      //Shift from bottom 2-by-2 minor
      x = w[l];
      nm = k - 1;
      y = w[nm];
      g = rv1[nm];
      h = rv1[k];
      f = ( (y - z) * (y + z) + (g - h) * (g + h) ) / (2.0 * h * y);
      g = SVD.pythag( f, 1.0 );
      f = ( (x - z) * (x + z) + h * ( (y / (f + SVD.sign(g, f) ) ) - h) ) / x;

      //Next QR transformation
      c = s = 1.0;
      for (j = l; j <= nm; ++ j){
        i = j + 1;
        g = rv1[i];
        y = w[i];
        h = s * g;
        g = c * g;
        z = SVD.pythag(f, h);
        rv1[j] = z;
        c = f / z;
        s = h / z;
        f = x * c + g * s;
        g = g * c - x * s;
        h = y * s;
        y *= c;
        for (jj = 0; jj < n; ++ jj){
          x = v[jj][j];
          z = v[jj][i];
          v[jj][j] = x * c + z * s;
          v[jj][i] = z * c - x * s;
        }
        z = SVD.pythag(f, h);
        w[j] = z;
        if (0.0 !== z){
          z = 1.0 / z;
          c = f * z;
          s = h * z;
        }
        f = c * g + s * y;
        x = c * y - s * g;
        for (jj = 0; jj < m; ++ jj){
          y = a[jj][j];
          z = a[jj][i];
          a[jj][j] = y * c + z * s;
          a[jj][i] = z * c - y * s;
        }
      }
      rv1[l] = 0.0;
      rv1[k] = f;
      w[k] = x;
    }
  }

  return true;
};

SVD.pythag = function(a, b){
  var at = Math.abs(a), bt = Math.abs(b), ct;

  if (at > bt){
    ct = bt / at;
    return at * Math.sqrt(1.0 + ct * ct);
  }
    
  if (0.0 === bt){
    return 0.0;
  }

  ct = at / bt;
  return bt * Math.sqrt(1.0 + ct * ct);
};

SVD.sign = function(a, b){
  return b >= 0.0? Math.abs(a): -Math.abs(a);
};
