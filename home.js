/* Homepage: scatters every nickname around the centred logo without overlap. */
(function () {
  "use strict";
  var students = CMS.students;
  var box = document.getElementById("cloud");
  var logo = document.getElementById("logo");
  var glow = document.getElementById("glow");
  var topbar = document.querySelector(".topbar");

  var items = students.map(function (s) {
    var a = document.createElement("a");
    a.className = "nick c" + (s.id % 3);
    a.href = "students.html#s-" + s.id;
    a.textContent = s.nickname;
    a.title = s.name;
    box.appendChild(a);
    return { a: a, w: 0, h: 0 };
  });

  /* Measure each nickname once at 16px; widths scale linearly with font size. */
  function measure() {
    items.forEach(function (it) {
      it.a.style.fontSize = "16px";
      var r = it.a.getBoundingClientRect();
      it.w = r.width / 16;
      it.h = r.height / 16;
    });
  }

  /* One attempt at a given font size / height / density. Returns positions or null. */
  function attempt(fs, W, H, density) {
    var PAD = Math.max(10, Math.min(24, W * 0.02));
    var unitH = items[0].h;
    var h = unitH * fs;
    var rh = h * 1.5;                              /* row pitch: leaves room for vertical scatter */
    var gap = Math.max(8, fs * 0.7);
    var R = Math.floor(H / rh);
    if (R < 1) return null;

    var L = Math.max(96, Math.min(210, Math.min(W, H) * 0.3));
    var m = fs * 1.3 + 8;
    var cx = W / 2, cy = H / 2, hw = L / 2 + m, hh = L / 2 + m;
    var offY = (H - R * rh) / 2;

    /* Build the free segments of every row (rows that cross the logo are split in two). */
    var segs = [];
    var capacity = 0;
    for (var r = 0; r < R; r++) {
      var y0 = offY + r * rh, y1 = y0 + rh;
      var hit = y1 > cy - hh && y0 < cy + hh;
      var parts = hit ? [[PAD, cx - hw], [cx + hw, W - PAD]] : [[PAD, W - PAD]];
      parts.forEach(function (p) {
        if (p[1] - p[0] > 40) { segs.push({ r: r, a: p[0], b: p[1], list: [], used: 0 }); capacity += p[1] - p[0]; }
      });
    }
    var need = 0;
    items.forEach(function (it) { need += it.w * fs + gap; });
    if (need > capacity * density) return null;

    var rand = CMSUtil.seeded(7 + Math.round(W));  /* same layout for the same width */
    var order = items.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }

    function fill(limitRatio) {
      segs.forEach(function (s) {
        var limit = (s.b - s.a) * limitRatio;
        var guard = 0;
        while (order.length && guard++ < 400) {
          var pick = -1;
          for (var k = 0; k < Math.min(order.length, 10); k++) {
            var w = items[order[k]].w * fs;
            if (s.used + w + (s.list.length ? gap : 0) <= limit) { pick = k; break; }
          }
          if (pick < 0) break;
          var idx = order.splice(pick, 1)[0];
          s.used += items[idx].w * fs + (s.list.length ? gap : 0);
          s.list.push(idx);
        }
      });
    }
    fill(Math.min(1, density + 0.04));
    fill(1);
    if (order.length) return null;

    var pos = [];
    segs.forEach(function (s) {
      var n = s.list.length;
      if (!n) return;
      var slack = (s.b - s.a) - s.used;
      var wts = [], sum = 0;
      for (var g = 0; g <= n; g++) { var wt = 0.35 + rand() * 1.3; wts.push(wt); sum += wt; }
      var x = s.a + slack * wts[0] / sum;
      s.list.forEach(function (idx, q) {
        var w = items[idx].w * fs;
        var y = offY + s.r * rh + rand() * (rh - h);
        pos.push({ idx: idx, x: x, y: y });
        x += w + gap + slack * wts[q + 1] / sum;
      });
    });
    return { pos: pos, L: L, rh: rh };
  }

  var lastW = 0, lastH = 0;
  function layout() {
    var W = box.clientWidth || document.documentElement.clientWidth;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var navH = topbar ? topbar.offsetHeight : 64;
    var Hmin = Math.max(380, vh - navH);
    var fsMax = Math.max(14, Math.min(26, W / 62));
    var fsMin = W < 520 ? 12 : 13;
    var res = null, fs = fsMax, H = Hmin;

    for (fs = fsMax; fs >= fsMin - 0.01; fs -= 0.5) {      /* biggest text that fits the screen */
      res = attempt(fs, W, H, 0.64);
      if (res) break;
    }
    if (!res) {                                             /* small screens: let the page scroll */
      fs = fsMin;
      var step = items[0].h * fs * 1.5;
      for (var n = 0; n < 80 && !res; n++) {
        H += step;
        res = attempt(fs, W, H, 0.78);
      }
    }
    if (!res) return;                                       /* should never happen */

    box.style.height = H + "px";
    res.pos.forEach(function (p) {
      var st = items[p.idx].a.style;
      st.fontSize = fs + "px";
      st.left = Math.round(p.x) + "px";
      st.top = Math.round(p.y) + "px";
    });
    logo.style.width = logo.style.height = res.L + "px";
    glow.style.width = glow.style.height = res.L * 1.9 + "px";
    box.classList.add("ready");
    lastW = W; lastH = vh;
  }

  function init() { measure(); layout(); }

  var fontsReady = document.fonts && document.fonts.ready
    ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })])
    : Promise.resolve();
  fontsReady.then(init);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (box.classList.contains("ready")) init(); });

  var timer;
  window.addEventListener("resize", function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var W = box.clientWidth, vh = window.innerHeight;
      /* Ignore the small height changes caused by a phone's address bar. */
      if (Math.abs(W - lastW) > 1 || Math.abs(vh - lastH) > 140) layout();
    }, 180);
  });
  window.addEventListener("orientationchange", function () { setTimeout(layout, 250); });
})();
