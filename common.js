/* Shared helpers: password session, image fallback, small utilities. */
(function () {
  "use strict";

  var KEY = "cms2k26-session";
  var NOTE = "cms2k26-note";
  var storageOk = (function () {
    try { var k = "__t"; sessionStorage.setItem(k, "1"); sessionStorage.removeItem(k); return true; }
    catch (e) { return false; }
  })();

  function read(key) {
    try { if (storageOk) return sessionStorage.getItem(key); } catch (e) {}
    return window.name === key ? "1" : null;
  }
  function write(key) {
    try { if (storageOk) { sessionStorage.setItem(key, "1"); return; } } catch (e) {}
    window.name = key;
  }
  function remove(key) {
    try { if (storageOk) sessionStorage.removeItem(key); } catch (e) {}
    if (window.name === key) window.name = "";
  }

  /* ---------- SHA-256 (so the password never sits in the source as text) ---------- */
  var K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  function utf8(str) {
    if (window.TextEncoder) return new TextEncoder().encode(str);
    var s = unescape(encodeURIComponent(str)), a = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
  }
  function rr(v, n) { return (v >>> n) | (v << (32 - n)); }
  function sha256(str) {
    var b = utf8(str), l = b.length;
    var total = Math.ceil((l + 9) / 64) * 64;
    var m = new Uint8Array(total); m.set(b); m[l] = 0x80;
    var dv = new DataView(m.buffer), bits = l * 8;
    dv.setUint32(total - 8, Math.floor(bits / 4294967296));
    dv.setUint32(total - 4, bits >>> 0);
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var w = new Uint32Array(64);
    for (var off = 0; off < total; off += 64) {
      var i;
      for (i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (i = 16; i < 64; i++) {
        var s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        var mj = (a & bb) ^ (a & c) ^ (bb & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(function (x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); }).join("");
  }

  /* ---------- session ---------- */
  var Auth = {
    isIn: function () { return read(KEY) === "1"; },
    login: function () { write(KEY); remove(NOTE); },
    logout: function (note) { remove(KEY); if (note) write(NOTE); },
    takeNote: function () { var n = read(NOTE) === "1"; remove(NOTE); return n; },
    check: function (pw) {
      var want = (window.CMS && CMS.site && CMS.site.passwordHash) || "";
      return !!want && sha256(String(pw).trim()) === want;
    },
    /* Protected pages: no session, no entry. */
    require: function () {
      function guard() {
        if (!Auth.isIn()) {
          document.documentElement.style.display = "none";
          location.replace("index.html");
          return false;
        }
        return true;
      }
      if (!guard()) return false;
      /* Page restored from the back/forward cache: check again. */
      window.addEventListener("pageshow", function (e) { if (e.persisted) guard(); });

      /* An internet interruption ends the session (can be switched off in js/config.js). */
      var lock = !(window.CMS && CMS.site && CMS.site.lockOnOffline === false);
      if (lock) {
        var dropped = false;
        window.addEventListener("offline", function () { dropped = true; Auth.logout(true); });
        window.addEventListener("online", function () { if (dropped) location.replace("index.html"); });
      }
      return true;
    },
    /* Index page: a signed-in visitor can not see it. */
    skipIfIn: function () {
      function go() {
        if (Auth.isIn()) { document.documentElement.style.display = "none"; location.replace("home.html"); return true; }
        return false;
      }
      go();
      window.addEventListener("pageshow", function (e) { if (e.persisted) go(); });
    }
  };

  /* ---------- helpers ---------- */
  function initials(name) {
    var p = String(name || "?").replace(/[^A-Za-z\s-]/g, " ").trim().split(/[\s-]+/).filter(Boolean);
    return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  /* If a photo file is missing, show a clean placeholder instead of a broken-image icon. */
  function placeholderSrc(student) {
    var hue = (student.id * 47) % 360;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',62%,58%)"/>' +
      '<stop offset="1" stop-color="hsl(' + ((hue + 40) % 360) + ',55%,32%)"/></linearGradient></defs>' +
      '<rect width="200" height="200" fill="url(#g)"/>' +
      '<text x="100" y="116" font-family="Arial,sans-serif" font-weight="700" font-size="64" text-anchor="middle" fill="#fff">' +
      initials(student.name) + '</text></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function safeImg(img, student) {
    img.addEventListener("error", function () {
      if (img.dataset.fallback) return;
      img.dataset.fallback = "1";
      img.src = placeholderSrc(student);
    });
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function seeded(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  window.Auth = Auth;
  window.CMSUtil = { sha256: sha256, safeImg: safeImg, placeholderSrc: placeholderSrc, el: el, seeded: seeded };
})();
