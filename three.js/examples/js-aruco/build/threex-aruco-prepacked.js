var THREEx, SVD, POS, CV, AR;
(function () {
  var _$0 = this;

  function _1(id, corners) {
    this.id = id;
    this.corners = corners;
  }

  function _2() {
    this.grey = new _$0.CV.Image();
    this.thres = new _$0.CV.Image();
    this.homography = new _$0.CV.Image();
    this.binary = [];
    this.contours = [];
    this.polys = [];
    this.candidates = [];
  }

  var _3 = _2.prototype;

  function _4(image) {
    _$0.CV.grayscale(image, this.grey);

    _$0.CV.adaptiveThreshold(this.grey, this.thres, 2, 7);

    this.contours = _$0.CV.findContours(this.thres, this.binary);
    this.candidates = this.findCandidates(this.contours, image.width * 0.20, 0.05, 10);
    this.candidates = this.clockwiseCorners(this.candidates);
    this.candidates = this.notTooNear(this.candidates, 10);
    return this.findMarkers(this.grey, this.candidates, 49);
  }

  function _5(contours, minSize, epsilon, minLength) {
    var candidates = [],
        len = contours.length,
        contour,
        poly,
        i;
    this.polys = [];

    for (i = 0; i < len; ++i) {
      contour = contours[i];

      if (contour.length >= minSize) {
        poly = _$0.CV.approxPolyDP(contour, contour.length * epsilon);
        this.polys.push(poly);

        if (4 === poly.length && _$0.CV.isContourConvex(poly)) {
          if (_$0.CV.minEdgeLength(poly) >= minLength) {
            candidates.push(poly);
          }
        }
      }
    }

    return candidates;
  }

  function _6(candidates) {
    var len = candidates.length,
        dx1,
        dx2,
        dy1,
        dy2,
        swap,
        i;

    for (i = 0; i < len; ++i) {
      dx1 = candidates[i][1].x - candidates[i][0].x;
      dy1 = candidates[i][1].y - candidates[i][0].y;
      dx2 = candidates[i][2].x - candidates[i][0].x;
      dy2 = candidates[i][2].y - candidates[i][0].y;

      if (dx1 * dy2 - dy1 * dx2 < 0) {
        swap = candidates[i][1];
        candidates[i][1] = candidates[i][3];
        candidates[i][3] = swap;
      }
    }

    return candidates;
  }

  function _7(candidates, minDist) {
    var notTooNear = [],
        len = candidates.length,
        dist,
        dx,
        dy,
        i,
        j,
        k;

    for (i = 0; i < len; ++i) {
      for (j = i + 1; j < len; ++j) {
        dist = 0;

        for (k = 0; k < 4; ++k) {
          dx = candidates[i][k].x - candidates[j][k].x;
          dy = candidates[i][k].y - candidates[j][k].y;
          dist += dx * dx + dy * dy;
        }

        if (dist / 4 < minDist * minDist) {
          if (_$0.CV.perimeter(candidates[i]) < _$0.CV.perimeter(candidates[j])) {
            candidates[i].tooNear = true;
          } else {
            candidates[j].tooNear = true;
          }
        }
      }
    }

    for (i = 0; i < len; ++i) {
      if (!candidates[i].tooNear) {
        notTooNear.push(candidates[i]);
      }
    }

    return notTooNear;
  }

  function _8(imageSrc, candidates, warpSize) {
    var markers = [],
        len = candidates.length,
        candidate,
        marker,
        i;

    for (i = 0; i < len; ++i) {
      candidate = candidates[i];

      _$0.CV.warp(imageSrc, this.homography, candidate, warpSize);

      _$0.CV.threshold(this.homography, this.homography, _$0.CV.otsu(this.homography));

      marker = this.getMarker(this.homography, candidate);

      if (marker) {
        markers.push(marker);
      }
    }

    return markers;
  }

  function _9(imageSrc, candidate) {
    var width = imageSrc.width / 7 >>> 0,
        minZero = width * width >> 1,
        bits = [],
        rotations = [],
        distances = [],
        square,
        pair,
        inc,
        i,
        j;

    for (i = 0; i < 7; ++i) {
      inc = 0 === i || 6 === i ? 1 : 6;

      for (j = 0; j < 7; j += inc) {
        square = {
          x: j * width,
          y: i * width,
          width: width,
          height: width
        };

        if (_$0.CV.countNonZero(imageSrc, square) > minZero) {
          return null;
        }
      }
    }

    for (i = 0; i < 5; ++i) {
      bits[i] = [];

      for (j = 0; j < 5; ++j) {
        square = {
          x: (j + 1) * width,
          y: (i + 1) * width,
          width: width,
          height: width
        };
        bits[i][j] = _$0.CV.countNonZero(imageSrc, square) > minZero ? 1 : 0;
      }
    }

    rotations[0] = bits;
    distances[0] = this.hammingDistance(rotations[0]);
    pair = {
      first: distances[0],
      second: 0
    };

    for (i = 1; i < 4; ++i) {
      rotations[i] = this.rotate(rotations[i - 1]);
      distances[i] = this.hammingDistance(rotations[i]);

      if (distances[i] < pair.first) {
        pair.first = distances[i];
        pair.second = i;
      }
    }

    if (0 !== pair.first) {
      return null;
    }

    return new _$0.AR.Marker(this.mat2id(rotations[pair.second]), this.rotate2(candidate, 4 - pair.second));
  }

  function _a(bits) {
    var ids = [[1, 0, 0, 0, 0], [1, 0, 1, 1, 1], [0, 1, 0, 0, 1], [0, 1, 1, 1, 0]],
        dist = 0,
        sum,
        minSum,
        i,
        j,
        k;

    for (i = 0; i < 5; ++i) {
      minSum = _$0.Infinity;

      for (j = 0; j < 4; ++j) {
        sum = 0;

        for (k = 0; k < 5; ++k) {
          sum += bits[i][k] === ids[j][k] ? 0 : 1;
        }

        if (sum < minSum) {
          minSum = sum;
        }
      }

      dist += minSum;
    }

    return dist;
  }

  function _b(bits) {
    var id = 0,
        i;

    for (i = 0; i < 5; ++i) {
      id <<= 1;
      id |= bits[i][1];
      id <<= 1;
      id |= bits[i][3];
    }

    return id;
  }

  function _c(src) {
    var dst = [],
        len = src.length,
        i,
        j;

    for (i = 0; i < len; ++i) {
      dst[i] = [];

      for (j = 0; j < src[i].length; ++j) {
        dst[i][j] = src[src[i].length - j - 1][i];
      }
    }

    return dst;
  }

  function _d(src, rotation) {
    var dst = [],
        len = src.length,
        i;

    for (i = 0; i < len; ++i) {
      dst[i] = src[(rotation + i) % len];
    }

    return dst;
  }

  function _f(width, height, data) {
    this.width = width || 0;
    this.height = height || 0;
    this.data = data || [];
  }

  function _g(imageSrc, imageDst) {
    var src = imageSrc.data,
        dst = imageDst.data,
        len = src.length,
        i = 0,
        j = 0;

    for (; i < len; i += 4) {
      dst[j++] = src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114 + 0.5 & 0xff;
    }

    imageDst.width = imageSrc.width;
    imageDst.height = imageSrc.height;
    return imageDst;
  }

  function _h(imageSrc, imageDst, threshold) {
    var src = imageSrc.data,
        dst = imageDst.data,
        len = src.length,
        tab = [],
        i;

    for (i = 0; i < 256; ++i) {
      tab[i] = i <= threshold ? 0 : 255;
    }

    for (i = 0; i < len; ++i) {
      dst[i] = tab[src[i]];
    }

    imageDst.width = imageSrc.width;
    imageDst.height = imageSrc.height;
    return imageDst;
  }

  function _i(imageSrc, imageDst, kernelSize, threshold) {
    var src = imageSrc.data,
        dst = imageDst.data,
        len = src.length,
        tab = [],
        i;

    _$0.CV.stackBoxBlur(imageSrc, imageDst, kernelSize);

    for (i = 0; i < 768; ++i) {
      tab[i] = i - 255 <= -threshold ? 255 : 0;
    }

    for (i = 0; i < len; ++i) {
      dst[i] = tab[src[i] - dst[i] + 255];
    }

    imageDst.width = imageSrc.width;
    imageDst.height = imageSrc.height;
    return imageDst;
  }

  function _j(imageSrc) {
    var src = imageSrc.data,
        len = src.length,
        hist = [],
        threshold = 0,
        sum = 0,
        sumB = 0,
        wB = 0,
        wF = 0,
        max = 0,
        mu,
        between,
        i;

    for (i = 0; i < 256; ++i) {
      hist[i] = 0;
    }

    for (i = 0; i < len; ++i) {
      hist[src[i]]++;
    }

    for (i = 0; i < 256; ++i) {
      sum += hist[i] * i;
    }

    for (i = 0; i < 256; ++i) {
      wB += hist[i];

      if (0 !== wB) {
        wF = len - wB;

        if (0 === wF) {
          break;
        }

        sumB += hist[i] * i;
        mu = sumB / wB - (sum - sumB) / wF;
        between = wB * wF * mu * mu;

        if (between > max) {
          max = between;
          threshold = i;
        }
      }
    }

    return threshold;
  }

  function _m() {
    this.color = 0;
    this.next = null;
  }

  function _n(imageSrc, imageDst, kernelSize) {
    var src = imageSrc.data,
        dst = imageDst.data,
        height = imageSrc.height,
        width = imageSrc.width,
        heightMinus1 = height - 1,
        widthMinus1 = width - 1,
        size = kernelSize + kernelSize + 1,
        radius = kernelSize + 1,
        mult = _$0.CV.stackBoxBlurMult[kernelSize],
        shift = _$0.CV.stackBoxBlurShift[kernelSize],
        stack,
        stackStart,
        color,
        sum,
        pos,
        start,
        p,
        x,
        y,
        i;
    stack = stackStart = new _$0.CV.BlurStack();

    for (i = 1; i < size; ++i) {
      stack = stack.next = new _$0.CV.BlurStack();
    }

    stack.next = stackStart;
    pos = 0;

    for (y = 0; y < height; ++y) {
      start = pos;
      color = src[pos];
      sum = radius * color;
      stack = stackStart;

      for (i = 0; i < radius; ++i) {
        stack.color = color;
        stack = stack.next;
      }

      for (i = 1; i < radius; ++i) {
        stack.color = src[pos + i];
        sum += stack.color;
        stack = stack.next;
      }

      stack = stackStart;

      for (x = 0; x < width; ++x) {
        dst[pos++] = sum * mult >>> shift;
        p = x + radius;
        p = start + (p < widthMinus1 ? p : widthMinus1);
        sum -= stack.color - src[p];
        stack.color = src[p];
        stack = stack.next;
      }
    }

    for (x = 0; x < width; ++x) {
      pos = x;
      start = pos + width;
      color = dst[pos];
      sum = radius * color;
      stack = stackStart;

      for (i = 0; i < radius; ++i) {
        stack.color = color;
        stack = stack.next;
      }

      for (i = 1; i < radius; ++i) {
        stack.color = dst[start];
        sum += stack.color;
        stack = stack.next;
        start += width;
      }

      stack = stackStart;

      for (y = 0; y < height; ++y) {
        dst[pos] = sum * mult >>> shift;
        p = y + radius;
        p = x + (p < heightMinus1 ? p : heightMinus1) * width;
        sum -= stack.color - dst[p];
        stack.color = dst[p];
        stack = stack.next;
        pos += width;
      }
    }

    return imageDst;
  }

  function _o(imageSrc, imageDst, imageMean, kernelSize) {
    var kernel = _$0.CV.gaussianKernel(kernelSize);

    imageDst.width = imageSrc.width;
    imageDst.height = imageSrc.height;
    imageMean.width = imageSrc.width;
    imageMean.height = imageSrc.height;

    _$0.CV.gaussianBlurFilter(imageSrc, imageMean, kernel, true);

    _$0.CV.gaussianBlurFilter(imageMean, imageDst, kernel, false);

    return imageDst;
  }

  function _p(imageSrc, imageDst, kernel, horizontal) {
    var src = imageSrc.data,
        dst = imageDst.data,
        height = imageSrc.height,
        width = imageSrc.width,
        pos = 0,
        limit = kernel.length >> 1,
        cur,
        value,
        i,
        j,
        k;

    for (i = 0; i < height; ++i) {
      for (j = 0; j < width; ++j) {
        value = 0.0;

        for (k = -limit; k <= limit; ++k) {
          if (horizontal) {
            cur = pos + k;

            if (j + k < 0) {
              cur = pos;
            } else if (j + k >= width) {
              cur = pos;
            }
          } else {
            cur = pos + k * width;

            if (i + k < 0) {
              cur = pos;
            } else if (i + k >= height) {
              cur = pos;
            }
          }

          value += kernel[limit + k] * src[cur];
        }

        dst[pos++] = horizontal ? value : value + 0.5 & 0xff;
      }
    }

    return imageDst;
  }

  function _q(kernelSize) {
    var tab = [[1], [0.25, 0.5, 0.25], [0.0625, 0.25, 0.375, 0.25, 0.0625], [0.03125, 0.109375, 0.21875, 0.28125, 0.21875, 0.109375, 0.03125]],
        kernel = [],
        center,
        sigma,
        scale2X,
        sum,
        x,
        i;

    if (kernelSize <= 7 && kernelSize % 2 === 1) {
      kernel = tab[kernelSize >> 1];
    } else {
      center = (kernelSize - 1.0) * 0.5;
      sigma = 0.8 + 0.3 * (center - 1.0);
      scale2X = -0.5 / (sigma * sigma);
      sum = 0.0;

      for (i = 0; i < kernelSize; ++i) {
        x = i - center;
        sum += kernel[i] = _$0.Math.exp(scale2X * x * x);
      }

      sum = 1 / sum;

      for (i = 0; i < kernelSize; ++i) {
        kernel[i] *= sum;
      }
    }

    return kernel;
  }

  function _r(imageSrc, binary) {
    var width = imageSrc.width,
        height = imageSrc.height,
        contours = [],
        src,
        deltas,
        pos,
        pix,
        nbd,
        outer,
        hole,
        i,
        j;
    src = _$0.CV.binaryBorder(imageSrc, binary);
    deltas = _$0.CV.neighborhoodDeltas(width + 2);
    pos = width + 3;
    nbd = 1;

    for (i = 0; i < height; ++i, pos += 2) {
      for (j = 0; j < width; ++j, ++pos) {
        pix = src[pos];

        if (0 !== pix) {
          outer = hole = false;

          if (1 === pix && 0 === src[pos - 1]) {
            outer = true;
          } else if (pix >= 1 && 0 === src[pos + 1]) {
            hole = true;
          }

          if (outer || hole) {
            ++nbd;
            contours.push(_$0.CV.borderFollowing(src, pos, nbd, {
              x: j,
              y: i
            }, hole, deltas));
          }
        }
      }
    }

    return contours;
  }

  function _s(src, pos, nbd, point, hole, deltas) {
    var contour = [],
        pos1,
        pos3,
        pos4,
        s,
        s_end,
        s_prev;
    contour.hole = hole;
    s = s_end = hole ? 0 : 4;

    do {
      s = s - 1 & 7;
      pos1 = pos + deltas[s];

      if (src[pos1] !== 0) {
        break;
      }
    } while (s !== s_end);

    if (s === s_end) {
      src[pos] = -nbd;
      contour.push({
        x: point.x,
        y: point.y
      });
    } else {
      pos3 = pos;
      s_prev = s ^ 4;

      while (true) {
        s_end = s;

        do {
          pos4 = pos3 + deltas[++s];
        } while (src[pos4] === 0);

        s &= 7;

        if (s - 1 >>> 0 < s_end >>> 0) {
          src[pos3] = -nbd;
        } else if (src[pos3] === 1) {
          src[pos3] = nbd;
        }

        contour.push({
          x: point.x,
          y: point.y
        });
        s_prev = s;
        point.x += _$0.CV.neighborhood[s][0];
        point.y += _$0.CV.neighborhood[s][1];

        if (pos4 === pos && pos3 === pos1) {
          break;
        }

        pos3 = pos4;
        s = s + 4 & 7;
      }
    }

    return contour;
  }

  function _C(width) {
    var deltas = [],
        len = _$0.CV.neighborhood.length,
        i = 0;

    for (; i < len; ++i) {
      deltas[i] = _$0.CV.neighborhood[i][0] + _$0.CV.neighborhood[i][1] * width;
    }

    return deltas.concat(deltas);
  }

  function _D(contour, epsilon) {
    var slice = {
      start_index: 0,
      end_index: 0
    },
        right_slice = {
      start_index: 0,
      end_index: 0
    },
        poly = [],
        stack = [],
        len = contour.length,
        pt,
        start_pt,
        end_pt,
        dist,
        max_dist,
        le_eps,
        dx,
        dy,
        i,
        j,
        k;
    epsilon *= epsilon;
    k = 0;

    for (i = 0; i < 3; ++i) {
      max_dist = 0;
      k = (k + right_slice.start_index) % len;
      start_pt = contour[k];

      if (++k === len) {
        k = 0;
      }

      for (j = 1; j < len; ++j) {
        pt = contour[k];

        if (++k === len) {
          k = 0;
        }

        dx = pt.x - start_pt.x;
        dy = pt.y - start_pt.y;
        dist = dx * dx + dy * dy;

        if (dist > max_dist) {
          max_dist = dist;
          right_slice.start_index = j;
        }
      }
    }

    if (max_dist <= epsilon) {
      poly.push({
        x: start_pt.x,
        y: start_pt.y
      });
    } else {
      slice.start_index = k;
      slice.end_index = right_slice.start_index += slice.start_index;
      right_slice.start_index -= right_slice.start_index >= len ? len : 0;
      right_slice.end_index = slice.start_index;

      if (right_slice.end_index < right_slice.start_index) {
        right_slice.end_index += len;
      }

      stack.push({
        start_index: right_slice.start_index,
        end_index: right_slice.end_index
      });
      stack.push({
        start_index: slice.start_index,
        end_index: slice.end_index
      });
    }

    while (stack.length !== 0) {
      slice = stack.pop();
      end_pt = contour[slice.end_index % len];
      start_pt = contour[k = slice.start_index % len];

      if (++k === len) {
        k = 0;
      }

      if (slice.end_index <= slice.start_index + 1) {
        le_eps = true;
      } else {
        max_dist = 0;
        dx = end_pt.x - start_pt.x;
        dy = end_pt.y - start_pt.y;

        for (i = slice.start_index + 1; i < slice.end_index; ++i) {
          pt = contour[k];

          if (++k === len) {
            k = 0;
          }

          dist = _$0.Math.abs((pt.y - start_pt.y) * dx - (pt.x - start_pt.x) * dy);

          if (dist > max_dist) {
            max_dist = dist;
            right_slice.start_index = i;
          }
        }

        le_eps = max_dist * max_dist <= epsilon * (dx * dx + dy * dy);
      }

      if (le_eps) {
        poly.push({
          x: start_pt.x,
          y: start_pt.y
        });
      } else {
        right_slice.end_index = slice.end_index;
        slice.end_index = right_slice.start_index;
        stack.push({
          start_index: right_slice.start_index,
          end_index: right_slice.end_index
        });
        stack.push({
          start_index: slice.start_index,
          end_index: slice.end_index
        });
      }
    }

    return poly;
  }

  function _E(imageSrc, imageDst, contour, warpSize) {
    var src = imageSrc.data,
        dst = imageDst.data,
        width = imageSrc.width,
        height = imageSrc.height,
        pos = 0,
        sx1,
        sx2,
        dx1,
        dx2,
        sy1,
        sy2,
        dy1,
        dy2,
        p1,
        p2,
        p3,
        p4,
        m,
        r,
        s,
        t,
        u,
        v,
        w,
        x,
        y,
        i,
        j;
    m = _$0.CV.getPerspectiveTransform(contour, warpSize - 1);
    r = m[8];
    s = m[2];
    t = m[5];

    for (i = 0; i < warpSize; ++i) {
      r += m[7];
      s += m[1];
      t += m[4];
      u = r;
      v = s;
      w = t;

      for (j = 0; j < warpSize; ++j) {
        u += m[6];
        v += m[0];
        w += m[3];
        x = v / u;
        y = w / u;
        sx1 = x >>> 0;
        sx2 = sx1 === width - 1 ? sx1 : sx1 + 1;
        dx1 = x - sx1;
        dx2 = 1.0 - dx1;
        sy1 = y >>> 0;
        sy2 = sy1 === height - 1 ? sy1 : sy1 + 1;
        dy1 = y - sy1;
        dy2 = 1.0 - dy1;
        p1 = p2 = sy1 * width;
        p3 = p4 = sy2 * width;
        dst[pos++] = dy2 * (dx2 * src[p1 + sx1] + dx1 * src[p2 + sx2]) + dy1 * (dx2 * src[p3 + sx1] + dx1 * src[p4 + sx2]) & 0xff;
      }
    }

    imageDst.width = warpSize;
    imageDst.height = warpSize;
    return imageDst;
  }

  function _F(src, size) {
    var rq = _$0.CV.square2quad(src);

    rq[0] /= size;
    rq[1] /= size;
    rq[3] /= size;
    rq[4] /= size;
    rq[6] /= size;
    rq[7] /= size;
    return rq;
  }

  function _G(src) {
    var sq = [],
        px,
        py,
        dx1,
        dx2,
        dy1,
        dy2,
        den;
    px = src[0].x - src[1].x + src[2].x - src[3].x;
    py = src[0].y - src[1].y + src[2].y - src[3].y;

    if (0 === px && 0 === py) {
      sq[0] = src[1].x - src[0].x;
      sq[1] = src[2].x - src[1].x;
      sq[2] = src[0].x;
      sq[3] = src[1].y - src[0].y;
      sq[4] = src[2].y - src[1].y;
      sq[5] = src[0].y;
      sq[6] = 0;
      sq[7] = 0;
      sq[8] = 1;
    } else {
      dx1 = src[1].x - src[2].x;
      dx2 = src[3].x - src[2].x;
      dy1 = src[1].y - src[2].y;
      dy2 = src[3].y - src[2].y;
      den = dx1 * dy2 - dx2 * dy1;
      sq[6] = (px * dy2 - dx2 * py) / den;
      sq[7] = (dx1 * py - px * dy1) / den;
      sq[8] = 1;
      sq[0] = src[1].x - src[0].x + sq[6] * src[1].x;
      sq[1] = src[3].x - src[0].x + sq[7] * src[3].x;
      sq[2] = src[0].x;
      sq[3] = src[1].y - src[0].y + sq[6] * src[1].y;
      sq[4] = src[3].y - src[0].y + sq[7] * src[3].y;
      sq[5] = src[0].y;
    }

    return sq;
  }

  function _H(contour) {
    var orientation = 0,
        convex = true,
        len = contour.length,
        i = 0,
        j = 0,
        cur_pt,
        prev_pt,
        dxdy0,
        dydx0,
        dx0,
        dy0,
        dx,
        dy;
    prev_pt = contour[len - 1];
    cur_pt = contour[0];
    dx0 = cur_pt.x - prev_pt.x;
    dy0 = cur_pt.y - prev_pt.y;

    for (; i < len; ++i) {
      if (++j === len) {
        j = 0;
      }

      prev_pt = cur_pt;
      cur_pt = contour[j];
      dx = cur_pt.x - prev_pt.x;
      dy = cur_pt.y - prev_pt.y;
      dxdy0 = dx * dy0;
      dydx0 = dy * dx0;
      orientation |= dydx0 > dxdy0 ? 1 : dydx0 < dxdy0 ? 2 : 3;

      if (3 === orientation) {
        convex = false;
        break;
      }

      dx0 = dx;
      dy0 = dy;
    }

    return convex;
  }

  function _I(poly) {
    var len = poly.length,
        i = 0,
        j = len - 1,
        p = 0.0,
        dx,
        dy;

    for (; i < len; j = i++) {
      dx = poly[i].x - poly[j].x;
      dy = poly[i].y - poly[j].y;
      p += _$0.Math.sqrt(dx * dx + dy * dy);
    }

    return p;
  }

  function _J(poly) {
    var len = poly.length,
        i = 0,
        j = len - 1,
        min = _$0.Infinity,
        d,
        dx,
        dy;

    for (; i < len; j = i++) {
      dx = poly[i].x - poly[j].x;
      dy = poly[i].y - poly[j].y;
      d = dx * dx + dy * dy;

      if (d < min) {
        min = d;
      }
    }

    return _$0.Math.sqrt(min);
  }

  function _K(imageSrc, square) {
    var src = imageSrc.data,
        height = square.height,
        width = square.width,
        pos = square.x + square.y * imageSrc.width,
        span = imageSrc.width - width,
        nz = 0,
        i,
        j;

    for (i = 0; i < height; ++i) {
      for (j = 0; j < width; ++j) {
        if (0 !== src[pos++]) {
          ++nz;
        }
      }

      pos += span;
    }

    return nz;
  }

  function _L(imageSrc, dst) {
    var src = imageSrc.data,
        height = imageSrc.height,
        width = imageSrc.width,
        posSrc = 0,
        posDst = 0,
        i,
        j;

    for (j = -2; j < width; ++j) {
      dst[posDst++] = 0;
    }

    for (i = 0; i < height; ++i) {
      dst[posDst++] = 0;

      for (j = 0; j < width; ++j) {
        dst[posDst++] = 0 === src[posSrc++] ? 0 : 1;
      }

      dst[posDst++] = 0;
    }

    for (j = -2; j < width; ++j) {
      dst[posDst++] = 0;
    }

    return dst;
  }

  function _N(modelSize, focalLength) {
    this.objectPoints = this.buildModel(modelSize);
    this.focalLength = focalLength;
    this.objectVectors = [];
    this.objectNormal = [];
    this.objectMatrix = [[], [], []];
    this.init();
  }

  var _O = _N.prototype;

  function _P(a, n, b) {
    var w = [],
        v = [[], [], []],
        s = [[], [], []],
        wmax = 0.0,
        cn = 0,
        i,
        j,
        k;

    _$0.SVD.svdcmp(a, n, 3, w, v);

    for (i = 0; i < 3; ++i) {
      if (w[i] > wmax) {
        wmax = w[i];
      }
    }

    wmax *= 0.01;

    for (i = 0; i < 3; ++i) {
      if (w[i] < wmax) {
        w[i] = 0.0;
      }
    }

    for (j = 0; j < 3; ++j) {
      if (0.0 === w[j]) {
        ++cn;

        for (k = j; k < 2; ++k) {
          for (i = 0; i < n; ++i) {
            a[i][k] = a[i][k + 1];
          }

          for (i = 0; i < 3; ++i) {
            v[i][k] = v[i][k + 1];
          }
        }
      }
    }

    for (j = 0; j < 2; ++j) {
      if (0.0 === w[j]) {
        w[j] = w[j + 1];
      }
    }

    for (i = 0; i < 3; ++i) {
      for (j = 0; j < 3 - cn; ++j) {
        s[i][j] = v[i][j] / w[j];
      }
    }

    for (i = 0; i < 3; ++i) {
      for (j = 0; j < n; ++j) {
        b[i][j] = 0.0;

        for (k = 0; k < 3 - cn; ++k) {
          b[i][j] += s[i][k] * a[j][k];
        }
      }
    }
  }

  function _Q(error1, rotation1, translation1, error2, rotation2, translation2) {
    this.bestError = error1;
    this.bestRotation = rotation1;
    this.bestTranslation = translation1;
    this.alternativeError = error2;
    this.alternativeRotation = rotation2;
    this.alternativeTranslation = translation2;
  }

  function _R(modelSize) {
    var half = modelSize / 2.0;
    return [[-half, half, 0.0], [half, half, 0.0], [half, -half, 0.0], [-half, -half, 0.0]];
  }

  function _S() {
    var np = this.objectPoints.length,
        vectors = [],
        n = [],
        len = 0.0,
        row = 2,
        i;

    for (i = 0; i < np; ++i) {
      this.objectVectors[i] = [this.objectPoints[i][0] - this.objectPoints[0][0], this.objectPoints[i][1] - this.objectPoints[0][1], this.objectPoints[i][2] - this.objectPoints[0][2]];
      vectors[i] = [this.objectVectors[i][0], this.objectVectors[i][1], this.objectVectors[i][2]];
    }

    while (0.0 === len) {
      n[0] = this.objectVectors[1][1] * this.objectVectors[row][2] - this.objectVectors[1][2] * this.objectVectors[row][1];
      n[1] = this.objectVectors[1][2] * this.objectVectors[row][0] - this.objectVectors[1][0] * this.objectVectors[row][2];
      n[2] = this.objectVectors[1][0] * this.objectVectors[row][1] - this.objectVectors[1][1] * this.objectVectors[row][0];
      len = _$0.Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
      ++row;
    }

    for (i = 0; i < 3; ++i) {
      this.objectNormal[i] = n[i] / len;
    }

    _$0.POS.pseudoInverse(vectors, np, this.objectMatrix);
  }

  function _T(imagePoints) {
    var posRotation1 = [[], [], []],
        posRotation2 = [[], [], []],
        posTranslation = [],
        rotation1 = [[], [], []],
        rotation2 = [[], [], []],
        translation1 = [],
        translation2 = [],
        error1,
        error2,
        valid1,
        valid2,
        i,
        j;
    this.pos(imagePoints, posRotation1, posRotation2, posTranslation);
    valid1 = this.isValid(posRotation1, posTranslation);

    if (valid1) {
      error1 = this.iterate(imagePoints, posRotation1, posTranslation, rotation1, translation1);
    } else {
      error1 = {
        euclidean: -1.0,
        pixels: -1,
        maximum: -1.0
      };
    }

    valid2 = this.isValid(posRotation2, posTranslation);

    if (valid2) {
      error2 = this.iterate(imagePoints, posRotation2, posTranslation, rotation2, translation2);
    } else {
      error2 = {
        euclidean: -1.0,
        pixels: -1,
        maximum: -1.0
      };
    }

    for (i = 0; i < 3; ++i) {
      for (j = 0; j < 3; ++j) {
        if (valid1) {
          translation1[i] -= rotation1[i][j] * this.objectPoints[0][j];
        }

        if (valid2) {
          translation2[i] -= rotation2[i][j] * this.objectPoints[0][j];
        }
      }
    }

    return error1.euclidean < error2.euclidean ? new _$0.POS.Pose(error1.pixels, rotation1, translation1, error2.pixels, rotation2, translation2) : new _$0.POS.Pose(error2.pixels, rotation2, translation2, error1.pixels, rotation1, translation1);
  }

  function _U(imagePoints, rotation1, rotation2, translation) {
    var np = this.objectPoints.length,
        imageVectors = [],
        i0 = [],
        j0 = [],
        ivec = [],
        jvec = [],
        row1 = [],
        row2 = [],
        row3 = [],
        i0i0,
        j0j0,
        i0j0,
        delta,
        q,
        lambda,
        mu,
        scale,
        i,
        j;

    for (i = 0; i < np; ++i) {
      imageVectors[i] = [imagePoints[i].x - imagePoints[0].x, imagePoints[i].y - imagePoints[0].y];
    } //i0 and j0


    for (i = 0; i < 3; ++i) {
      i0[i] = 0.0;
      j0[i] = 0.0;

      for (j = 0; j < np; ++j) {
        i0[i] += this.objectMatrix[i][j] * imageVectors[j][0];
        j0[i] += this.objectMatrix[i][j] * imageVectors[j][1];
      }
    }

    i0i0 = i0[0] * i0[0] + i0[1] * i0[1] + i0[2] * i0[2];
    j0j0 = j0[0] * j0[0] + j0[1] * j0[1] + j0[2] * j0[2];
    i0j0 = i0[0] * j0[0] + i0[1] * j0[1] + i0[2] * j0[2]; //Lambda and mu

    delta = (j0j0 - i0i0) * (j0j0 - i0i0) + 4.0 * (i0j0 * i0j0);

    if (j0j0 - i0i0 >= 0.0) {
      q = (j0j0 - i0i0 + _$0.Math.sqrt(delta)) / 2.0;
    } else {
      q = (j0j0 - i0i0 - _$0.Math.sqrt(delta)) / 2.0;
    }

    if (q >= 0.0) {
      lambda = _$0.Math.sqrt(q);

      if (0.0 === lambda) {
        mu = 0.0;
      } else {
        mu = -i0j0 / lambda;
      }
    } else {
      lambda = _$0.Math.sqrt(-(i0j0 * i0j0) / q);

      if (0.0 === lambda) {
        mu = _$0.Math.sqrt(i0i0 - j0j0);
      } else {
        mu = -i0j0 / lambda;
      }
    } //First rotation


    for (i = 0; i < 3; ++i) {
      ivec[i] = i0[i] + lambda * this.objectNormal[i];
      jvec[i] = j0[i] + mu * this.objectNormal[i];
    }

    scale = _$0.Math.sqrt(ivec[0] * ivec[0] + ivec[1] * ivec[1] + ivec[2] * ivec[2]);

    for (i = 0; i < 3; ++i) {
      row1[i] = ivec[i] / scale;
      row2[i] = jvec[i] / scale;
    }

    row3[0] = row1[1] * row2[2] - row1[2] * row2[1];
    row3[1] = row1[2] * row2[0] - row1[0] * row2[2];
    row3[2] = row1[0] * row2[1] - row1[1] * row2[0];

    for (i = 0; i < 3; ++i) {
      rotation1[0][i] = row1[i];
      rotation1[1][i] = row2[i];
      rotation1[2][i] = row3[i];
    } //Second rotation


    for (i = 0; i < 3; ++i) {
      ivec[i] = i0[i] - lambda * this.objectNormal[i];
      jvec[i] = j0[i] - mu * this.objectNormal[i];
    }

    for (i = 0; i < 3; ++i) {
      row1[i] = ivec[i] / scale;
      row2[i] = jvec[i] / scale;
    }

    row3[0] = row1[1] * row2[2] - row1[2] * row2[1];
    row3[1] = row1[2] * row2[0] - row1[0] * row2[2];
    row3[2] = row1[0] * row2[1] - row1[1] * row2[0];

    for (i = 0; i < 3; ++i) {
      rotation2[0][i] = row1[i];
      rotation2[1][i] = row2[i];
      rotation2[2][i] = row3[i];
    } //Translation


    translation[0] = imagePoints[0].x / scale;
    translation[1] = imagePoints[0].y / scale;
    translation[2] = this.focalLength / scale;
  }

  function _V(rotation, translation) {
    var np = this.objectPoints.length,
        zmin = _$0.Infinity,
        i = 0,
        zi;

    for (; i < np; ++i) {
      zi = translation[2] + (rotation[2][0] * this.objectVectors[i][0] + rotation[2][1] * this.objectVectors[i][1] + rotation[2][2] * this.objectVectors[i][2]);

      if (zi < zmin) {
        zmin = zi;
      }
    }

    return zmin >= 0.0;
  }

  function _W(imagePoints, posRotation, posTranslation, rotation, translation) {
    var np = this.objectPoints.length,
        oldSopImagePoints = [],
        sopImagePoints = [],
        rotation1 = [[], [], []],
        rotation2 = [[], [], []],
        translation1 = [],
        translation2 = [],
        converged = false,
        iteration = 0,
        oldImageDifference,
        imageDifference,
        factor,
        error,
        error1,
        error2,
        delta,
        i,
        j;

    for (i = 0; i < np; ++i) {
      oldSopImagePoints[i] = {
        x: imagePoints[i].x,
        y: imagePoints[i].y
      };
    }

    for (i = 0; i < 3; ++i) {
      for (j = 0; j < 3; ++j) {
        rotation[i][j] = posRotation[i][j];
      }

      translation[i] = posTranslation[i];
    }

    for (i = 0; i < np; ++i) {
      factor = 0.0;

      for (j = 0; j < 3; ++j) {
        factor += this.objectVectors[i][j] * rotation[2][j] / translation[2];
      }

      sopImagePoints[i] = {
        x: (1.0 + factor) * imagePoints[i].x,
        y: (1.0 + factor) * imagePoints[i].y
      };
    }

    imageDifference = 0.0;

    for (i = 0; i < np; ++i) {
      imageDifference += _$0.Math.abs(sopImagePoints[i].x - oldSopImagePoints[i].x);
      imageDifference += _$0.Math.abs(sopImagePoints[i].y - oldSopImagePoints[i].y);
    }

    for (i = 0; i < 3; ++i) {
      translation1[i] = translation[i] - (rotation[i][0] * this.objectPoints[0][0] + rotation[i][1] * this.objectPoints[0][1] + rotation[i][2] * this.objectPoints[0][2]);
    }

    error = error1 = this.error(imagePoints, rotation, translation1); //Convergence

    converged = 0.0 === error1.pixels || imageDifference < 0.01;

    while (iteration++ < 100 && !converged) {
      for (i = 0; i < np; ++i) {
        oldSopImagePoints[i].x = sopImagePoints[i].x;
        oldSopImagePoints[i].y = sopImagePoints[i].y;
      }

      this.pos(sopImagePoints, rotation1, rotation2, translation);

      for (i = 0; i < 3; ++i) {
        translation1[i] = translation[i] - (rotation1[i][0] * this.objectPoints[0][0] + rotation1[i][1] * this.objectPoints[0][1] + rotation1[i][2] * this.objectPoints[0][2]);
        translation2[i] = translation[i] - (rotation2[i][0] * this.objectPoints[0][0] + rotation2[i][1] * this.objectPoints[0][1] + rotation2[i][2] * this.objectPoints[0][2]);
      }

      error1 = this.error(imagePoints, rotation1, translation1);
      error2 = this.error(imagePoints, rotation2, translation2);

      if (error1.euclidean >= 0.0 && error2.euclidean >= 0.0) {
        if (error2.euclidean < error1.euclidean) {
          error = error2;

          for (i = 0; i < 3; ++i) {
            for (j = 0; j < 3; ++j) {
              rotation[i][j] = rotation2[i][j];
            }
          }
        } else {
          error = error1;

          for (i = 0; i < 3; ++i) {
            for (j = 0; j < 3; ++j) {
              rotation[i][j] = rotation1[i][j];
            }
          }
        }
      }

      if (error1.euclidean < 0.0 && error2.euclidean >= 0.0) {
        error = error2;

        for (i = 0; i < 3; ++i) {
          for (j = 0; j < 3; ++j) {
            rotation[i][j] = rotation2[i][j];
          }
        }
      }

      if (error2.euclidean < 0.0 && error1.euclidean >= 0.0) {
        error = error1;

        for (i = 0; i < 3; ++i) {
          for (j = 0; j < 3; ++j) {
            rotation[i][j] = rotation1[i][j];
          }
        }
      }

      for (i = 0; i < np; ++i) {
        factor = 0.0;

        for (j = 0; j < 3; ++j) {
          factor += this.objectVectors[i][j] * rotation[2][j] / translation[2];
        }

        sopImagePoints[i].x = (1.0 + factor) * imagePoints[i].x;
        sopImagePoints[i].y = (1.0 + factor) * imagePoints[i].y;
      }

      oldImageDifference = imageDifference;
      imageDifference = 0.0;

      for (i = 0; i < np; ++i) {
        imageDifference += _$0.Math.abs(sopImagePoints[i].x - oldSopImagePoints[i].x);
        imageDifference += _$0.Math.abs(sopImagePoints[i].y - oldSopImagePoints[i].y);
      }

      delta = _$0.Math.abs(imageDifference - oldImageDifference);
      converged = 0.0 === error.pixels || delta < 0.01;
    }

    return error;
  }

  function _X(imagePoints, rotation, translation) {
    var np = this.objectPoints.length,
        move = [],
        projection = [],
        errorvec = [],
        euclidean = 0.0,
        pixels = 0.0,
        maximum = 0.0,
        i,
        j,
        k;

    if (!this.isValid(rotation, translation)) {
      return {
        euclidean: -1.0,
        pixels: -1,
        maximum: -1.0
      };
    }

    for (i = 0; i < np; ++i) {
      move[i] = [];

      for (j = 0; j < 3; ++j) {
        move[i][j] = translation[j];
      }
    }

    for (i = 0; i < np; ++i) {
      for (j = 0; j < 3; ++j) {
        for (k = 0; k < 3; ++k) {
          move[i][j] += rotation[j][k] * this.objectPoints[i][k];
        }
      }
    }

    for (i = 0; i < np; ++i) {
      projection[i] = [];

      for (j = 0; j < 2; ++j) {
        projection[i][j] = this.focalLength * move[i][j] / move[i][2];
      }
    }

    for (i = 0; i < np; ++i) {
      errorvec[i] = [projection[i][0] - imagePoints[i].x, projection[i][1] - imagePoints[i].y];
    }

    for (i = 0; i < np; ++i) {
      euclidean += _$0.Math.sqrt(errorvec[i][0] * errorvec[i][0] + errorvec[i][1] * errorvec[i][1]);
      pixels += _$0.Math.abs(_$0.Math.round(projection[i][0]) - _$0.Math.round(imagePoints[i].x)) + _$0.Math.abs(_$0.Math.round(projection[i][1]) - _$0.Math.round(imagePoints[i].y));

      if (_$0.Math.abs(errorvec[i][0]) > maximum) {
        maximum = _$0.Math.abs(errorvec[i][0]);
      }

      if (_$0.Math.abs(errorvec[i][1]) > maximum) {
        maximum = _$0.Math.abs(errorvec[i][1]);
      }
    }

    return {
      euclidean: euclidean / np,
      pixels: pixels,
      maximum: maximum
    };
  }

  function _Z(a, m, n, w, v) {
    var flag,
        i,
        its,
        j,
        jj,
        k,
        l,
        nm,
        anorm = 0.0,
        c,
        f,
        g = 0.0,
        h,
        s,
        scale = 0.0,
        x,
        y,
        z,
        rv1 = []; //Householder reduction to bidiagonal form

    for (i = 0; i < n; ++i) {
      l = i + 1;
      rv1[i] = scale * g;
      g = s = scale = 0.0;

      if (i < m) {
        for (k = i; k < m; ++k) {
          scale += _$0.Math.abs(a[k][i]);
        }

        if (0.0 !== scale) {
          for (k = i; k < m; ++k) {
            a[k][i] /= scale;
            s += a[k][i] * a[k][i];
          }

          f = a[i][i];
          g = -_$0.SVD.sign(_$0.Math.sqrt(s), f);
          h = f * g - s;
          a[i][i] = f - g;

          for (j = l; j < n; ++j) {
            for (s = 0.0, k = i; k < m; ++k) {
              s += a[k][i] * a[k][j];
            }

            f = s / h;

            for (k = i; k < m; ++k) {
              a[k][j] += f * a[k][i];
            }
          }

          for (k = i; k < m; ++k) {
            a[k][i] *= scale;
          }
        }
      }

      w[i] = scale * g;
      g = s = scale = 0.0;

      if (i < m && i !== n - 1) {
        for (k = l; k < n; ++k) {
          scale += _$0.Math.abs(a[i][k]);
        }

        if (0.0 !== scale) {
          for (k = l; k < n; ++k) {
            a[i][k] /= scale;
            s += a[i][k] * a[i][k];
          }

          f = a[i][l];
          g = -_$0.SVD.sign(_$0.Math.sqrt(s), f);
          h = f * g - s;
          a[i][l] = f - g;

          for (k = l; k < n; ++k) {
            rv1[k] = a[i][k] / h;
          }

          for (j = l; j < m; ++j) {
            for (s = 0.0, k = l; k < n; ++k) {
              s += a[j][k] * a[i][k];
            }

            for (k = l; k < n; ++k) {
              a[j][k] += s * rv1[k];
            }
          }

          for (k = l; k < n; ++k) {
            a[i][k] *= scale;
          }
        }
      }

      anorm = _$0.Math.max(anorm, _$0.Math.abs(w[i]) + _$0.Math.abs(rv1[i]));
    } //Acumulation of right-hand transformation


    for (i = n - 1; i >= 0; --i) {
      if (i < n - 1) {
        if (0.0 !== g) {
          for (j = l; j < n; ++j) {
            v[j][i] = a[i][j] / a[i][l] / g;
          }

          for (j = l; j < n; ++j) {
            for (s = 0.0, k = l; k < n; ++k) {
              s += a[i][k] * v[k][j];
            }

            for (k = l; k < n; ++k) {
              v[k][j] += s * v[k][i];
            }
          }
        }

        for (j = l; j < n; ++j) {
          v[i][j] = v[j][i] = 0.0;
        }
      }

      v[i][i] = 1.0;
      g = rv1[i];
      l = i;
    } //Acumulation of left-hand transformation


    for (i = _$0.Math.min(n, m) - 1; i >= 0; --i) {
      l = i + 1;
      g = w[i];

      for (j = l; j < n; ++j) {
        a[i][j] = 0.0;
      }

      if (0.0 !== g) {
        g = 1.0 / g;

        for (j = l; j < n; ++j) {
          for (s = 0.0, k = l; k < m; ++k) {
            s += a[k][i] * a[k][j];
          }

          f = s / a[i][i] * g;

          for (k = i; k < m; ++k) {
            a[k][j] += f * a[k][i];
          }
        }

        for (j = i; j < m; ++j) {
          a[j][i] *= g;
        }
      } else {
        for (j = i; j < m; ++j) {
          a[j][i] = 0.0;
        }
      }

      ++a[i][i];
    } //Diagonalization of the bidiagonal form


    for (k = n - 1; k >= 0; --k) {
      for (its = 1; its <= 30; ++its) {
        flag = true;

        for (l = k; l >= 0; --l) {
          nm = l - 1;

          if (_$0.Math.abs(rv1[l]) + anorm === anorm) {
            flag = false;
            break;
          }

          if (_$0.Math.abs(w[nm]) + anorm === anorm) {
            break;
          }
        }

        if (flag) {
          c = 0.0;
          s = 1.0;

          for (i = l; i <= k; ++i) {
            f = s * rv1[i];

            if (_$0.Math.abs(f) + anorm === anorm) {
              break;
            }

            g = w[i];
            h = _$0.SVD.pythag(f, g);
            w[i] = h;
            h = 1.0 / h;
            c = g * h;
            s = -f * h;

            for (j = 1; j <= m; ++j) {
              y = a[j][nm];
              z = a[j][i];
              a[j][nm] = y * c + z * s;
              a[j][i] = z * c - y * s;
            }
          }
        } //Convergence


        z = w[k];

        if (l === k) {
          if (z < 0.0) {
            w[k] = -z;

            for (j = 0; j < n; ++j) {
              v[j][k] = -v[j][k];
            }
          }

          break;
        }

        if (30 === its) {
          return false;
        } //Shift from bottom 2-by-2 minor


        x = w[l];
        nm = k - 1;
        y = w[nm];
        g = rv1[nm];
        h = rv1[k];
        f = ((y - z) * (y + z) + (g - h) * (g + h)) / (2.0 * h * y);
        g = _$0.SVD.pythag(f, 1.0);
        f = ((x - z) * (x + z) + h * (y / (f + _$0.SVD.sign(g, f)) - h)) / x; //Next QR transformation

        c = s = 1.0;

        for (j = l; j <= nm; ++j) {
          i = j + 1;
          g = rv1[i];
          y = w[i];
          h = s * g;
          g = c * g;
          z = _$0.SVD.pythag(f, h);
          rv1[j] = z;
          c = f / z;
          s = h / z;
          f = x * c + g * s;
          g = g * c - x * s;
          h = y * s;
          y *= c;

          for (jj = 0; jj < n; ++jj) {
            x = v[jj][j];
            z = v[jj][i];
            v[jj][j] = x * c + z * s;
            v[jj][i] = z * c - x * s;
          }

          z = _$0.SVD.pythag(f, h);
          w[j] = z;

          if (0.0 !== z) {
            z = 1.0 / z;
            c = f * z;
            s = h * z;
          }

          f = c * g + s * y;
          x = c * y - s * g;

          for (jj = 0; jj < m; ++jj) {
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
  }

  function _10(a, b) {
    var at = _$0.Math.abs(a),
        bt = _$0.Math.abs(b),
        ct;

    if (at > bt) {
      ct = bt / at;
      return at * _$0.Math.sqrt(1.0 + ct * ct);
    }

    if (0.0 === bt) {
      return 0.0;
    }

    ct = at / bt;
    return bt * _$0.Math.sqrt(1.0 + ct * ct);
  }

  function _11(a, b) {
    return b >= 0.0 ? _$0.Math.abs(a) : -_$0.Math.abs(a);
  }

  function _13(markerSize) {
    this.canvas = _$0.document.createElement('canvas');
    this.canvas.width = 80 * 8;
    this.canvas.height = 60 * 4; // experiment with imageSmoothingEnabled

    var imageSmoothingEnabled = false;
    var context = this.canvas.getContext('2d');
    context.mozImageSmoothingEnabled = imageSmoothingEnabled;
    context.webkitImageSmoothingEnabled = imageSmoothingEnabled;
    context.msImageSmoothingEnabled = imageSmoothingEnabled;
    context.imageSmoothingEnabled = imageSmoothingEnabled;
    this.detector = new _$0.AR.Detector();
    this.posit = new _$0.POS.Posit(markerSize, this.canvas.width);
  }

  var _15 = _13.prototype;

  function _14(object3D, detectedMarker) {
    var rotation = detectedMarker.pose.bestRotation;
    var translation = detectedMarker.pose.bestTranslation;
    object3D.position.x = translation[0];
    object3D.position.y = translation[1];
    object3D.position.z = -translation[2];
    object3D.rotation.x = -_$0.Math.asin(-rotation[1][2]);
    object3D.rotation.y = -_$0.Math.atan2(rotation[0][2], rotation[2][2]);
    object3D.rotation.z = _$0.Math.atan2(rotation[1][0], rotation[1][1]);
    object3D.scale.x = markerSize;
    object3D.scale.y = markerSize;
    object3D.scale.z = markerSize;
  }

  function _16(arucoContext) {
    this.arucoContext = arucoContext;
    this.canvasElement = _$0.document.createElement('canvas');
    this.canvasElement.width = this.arucoContext.canvas.width;
    this.canvasElement.height = this.arucoContext.canvas.height;
  }

  var _17 = _16.prototype;

  function _18() {}

  function _19(markerId, svgSize) {
    var domElement = _$0.document.createElement('div');

    domElement.innerHTML = new ArucoMarker(markerId).toSVG(svgSize);
    return domElement;
  }

  function _1a(markerId, svgSize) {
    // get the svgElement
    var svgElement = _$0.THREEx.ArucoMarkerGenerator.createSVG(markerId, svgSize).firstChild; // build imageURL


    var xml = new XMLSerializer().serializeToString(svgElement);
    var imageURL = 'data:image/svg+xml;base64,' + btoa(xml); // create imageElement

    var imageElement = _$0.document.createElement('img');

    imageElement.src = imageURL; // return imageElement

    return imageElement;
  }

  function _1b(videoElement) {
    var _this = this;

    var canvas = this.canvas; // get imageData from videoElement

    var context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height); // detect markers in imageData

    var detectedMarkers = this.detector.detect(imageData); // compute the pose for each detectedMarkers

    detectedMarkers.forEach(function (detectedMarker) {
      // debugger
      var markerCorners = detectedMarker.corners; // convert the corners

      var poseCorners = new _$0.Array(markerCorners.length);

      for (var i = 0; i < markerCorners.length; ++i) {
        var markerCorner = markerCorners[i];
        poseCorners[i] = {
          x: markerCorner.x - canvas.width / 2,
          y: -markerCorner.y + canvas.height / 2
        };
      } // estimate pose from corners


      detectedMarker.pose = _this.posit.pose(poseCorners);
    });
    return detectedMarkers;
  }

  function _1c() {
    var canvas = this.canvasElement;
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function _1d() {
    var contours = this.arucoContext.detector.contours;
    var canvas = this.canvasElement;
    this.drawContours(contours, 0, 0, canvas.width, canvas.height, function (hole) {
      return hole ? "magenta" : "blue";
    });
  }

  function _1e() {
    var contours = this.arucoContext.detector.polys;
    var canvas = this.canvasElement;
    this.drawContours(contours, 0, 0, canvas.width, canvas.height, function () {
      return 'green';
    });
  }

  function _1f() {
    var contours = this.arucoContext.detector.candidates;
    var canvas = this.canvasElement;
    this.drawContours(contours, 0, 0, canvas.width, canvas.height, function () {
      return 'red';
    });
  }

  function _1g(contours, x, y, width, height, fn) {
    var i = contours.length,
        j,
        contour,
        point;
    var canvas = this.canvasElement;
    var context = canvas.getContext('2d');
    context.save();

    while (i--) {
      contour = contours[i];
      context.strokeStyle = fn(contour.hole);
      context.beginPath();

      for (j = 0; j < contour.length; ++j) {
        point = contour[j];
        context.moveTo(x + point.x, y + point.y);
        point = contour[(j + 1) % contour.length];
        context.lineTo(x + point.x, y + point.y);
      }

      context.stroke();
      context.closePath();
    }

    context.restore();
  }

  function _1h() {
    var cvImage = arucoContext.detector.grey;
    this.drawCVImage(cvImage);
  }

  function _1i() {
    var cvImage = arucoContext.detector.thres;
    this.drawCVImage(cvImage);
  }

  function _1j(cvImage) {
    var detector = this.arucoContext.detector;
    var canvas = this.canvasElement;
    var context = canvas.getContext('2d');
    var imageData = context.createImageData(canvas.width, canvas.height);
    copyImage(cvImage, imageData);
    context.putImageData(imageData, 0, 0);
    return;

    function copyImage(src, dst) {
      var i = src.data.length,
          j = i * 4 + 3;

      while (i--) {
        dst.data[j -= 4] = 255;
        dst.data[j - 1] = dst.data[j - 2] = dst.data[j - 3] = src.data[i];
      }

      return dst;
    }

    ;
  }

  function _1k(videoElement) {
    var canvas = this.canvasElement;
    var context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  }

  function _1l(markers) {
    var canvas = this.canvasElement;
    var context = canvas.getContext('2d');
    var corners, corner, x, y, i, j;
    context.save();
    context.strokeStyle = "blue";
    context.lineWidth = 1;

    for (i = 0; i !== markers.length; ++i) {
      corners = markers[i].corners;
      x = _$0.Infinity;
      y = _$0.Infinity;

      for (j = 0; j !== corners.length; ++j) {
        corner = corners[j];
        x = _$0.Math.min(x, corner.x);
        y = _$0.Math.min(y, corner.y);
      }

      context.strokeText(markers[i].id, x, y);
    }

    context.restore();
  }

  function _1m(markers) {
    var canvas = this.canvasElement;
    var corners, corner, i, j;
    var context = canvas.getContext('2d');
    context.save();
    context.lineWidth = 3;

    for (i = 0; i < markers.length; ++i) {
      corners = markers[i].corners;
      context.strokeStyle = 'red';
      context.beginPath();

      for (j = 0; j < corners.length; ++j) {
        corner = corners[j];
        context.moveTo(corner.x, corner.y);
        corner = corners[(j + 1) % corners.length];
        context.lineTo(corner.x, corner.y);
      }

      context.stroke();
      context.closePath();
      context.strokeStyle = 'green';
      context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
    }

    context.restore();
  }

  THREEx = undefined;
  SVD = undefined;
  POS = undefined;
  CV = undefined;
  AR = undefined;
  _3.rotate2 = _d;
  _3.rotate = _c;
  _3.mat2id = _b;
  _3.hammingDistance = _a;
  _3.getMarker = _9;
  _3.findMarkers = _8;
  _3.notTooNear = _7;
  _3.clockwiseCorners = _6;
  _3.findCandidates = _5;
  _3.detect = _4;
  AR = {
    Marker: _1,
    Detector: _2
  };
  CV = {
    Image: _f,
    grayscale: _g,
    threshold: _h,
    adaptiveThreshold: _i,
    otsu: _j,
    stackBoxBlurMult: [1, 171, 205, 293, 57, 373, 79, 137, 241, 27, 391, 357, 41, 19, 283, 265],
    stackBoxBlurShift: [0, 9, 10, 11, 9, 12, 10, 11, 12, 9, 13, 13, 10, 9, 13, 13],
    BlurStack: _m,
    stackBoxBlur: _n,
    gaussianBlur: _o,
    gaussianBlurFilter: _p,
    gaussianKernel: _q,
    findContours: _r,
    borderFollowing: _s,
    neighborhood: [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]],
    neighborhoodDeltas: _C,
    approxPolyDP: _D,
    warp: _E,
    getPerspectiveTransform: _F,
    square2quad: _G,
    isContourConvex: _H,
    perimeter: _I,
    minEdgeLength: _J,
    countNonZero: _K,
    binaryBorder: _L
  };
  _O.error = _X;
  _O.iterate = _W;
  _O.isValid = _V;
  _O.pos = _U;
  _O.pose = _T;
  _O.init = _S;
  _O.buildModel = _R;
  POS = {
    Posit: _N,
    pseudoInverse: _P,
    Pose: _Q
  };
  SVD = {
    svdcmp: _Z,
    pythag: _10,
    sign: _11
  };
  _13.updateObject3D = _14;
  _18.createSVG = _19;
  _18.createIMG = _1a;
  _17.drawMarkerCorners = _1m;
  _17.drawMarkerIDs = _1l;
  _17.drawVideo = _1k;
  _17.drawCVImage = _1j;
  _17.drawDetectorThreshold = _1i;
  _17.drawDetectorGrey = _1h;
  _17.drawContours = _1g;
  _17.drawContoursCandidates = _1f;
  _17.drawContoursPolys = _1e;
  _17.drawContoursContours = _1d;
  _17.clear = _1c;
  _15.detect = _1b;
  THREEx = {
    ArucoContext: _13,
    ArucoDebug: _16,
    ArucoMarkerGenerator: _18
  };
}).call(this);