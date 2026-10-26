/* All Students: photo cards + profile pop-up. */
(function () {
  "use strict";
  if (!window.Auth || !Auth.isIn()) return;

  var students = CMS.students;
  var byId = {};
  students.forEach(function (s) { byId[s.id] = s; });

  var grid = document.getElementById("grid");
  var overlay = document.getElementById("overlay");
  var panel = document.getElementById("profile");
  var closeBtn = document.getElementById("pfClose");
  var pfName = document.getElementById("pfName");
  var pfImg = document.getElementById("pfImg");
  var pfList = document.getElementById("pfList");
  var count = document.getElementById("count");
  var el = CMSUtil.el;

  count.textContent = students.length + " students. Select a photo to open that student's profile card.";

  /* ---------- photo cards ---------- */
  students.forEach(function (s) {
    var li = el("li", "cell"); li.id = "s-" + s.id;
    var b = el("button", "card"); b.type = "button"; b.dataset.id = s.id;
    b.setAttribute("aria-haspopup", "dialog");
    b.setAttribute("aria-label", "Open profile of " + s.name);
    var ph = el("span", "ph");
    var img = new Image();
    img.alt = ""; img.loading = "lazy"; img.decoding = "async"; img.width = 480; img.height = 480; img.src = s.photo;
    CMSUtil.safeImg(img, s);
    ph.appendChild(img);
    b.appendChild(ph);
    b.appendChild(el("span", "nm", s.name));
    if (s.nickname) b.appendChild(el("span", "ak", "aka " + s.nickname));
    li.appendChild(b);
    grid.appendChild(li);
  });

  /* ---------- profile pop-up ---------- */
  var FIELDS = [
    ["NAME", "name"], ["AKA", "aka"], ["D.O.B", "dob"], ["PHONE NO", "phone"], ["E-MAIL", "email"],
    ["CAREER PROSPECTS", "career"], ["ROLE MODEL", "roleModel"], ["FAVORITE COLOR", "color"],
    ["FAVORITE SCRIPTURE", "scripture"], ["LIFE'S PHILOSOPHY", "philosophy"], ["BEST MOMENT", "bestMoment"],
    ["WORST MOMENT", "worstMoment"], ["CMS IN 3 WORDS", "cmsIn3Words"], ["PARTING WORDS", "partingWords"],
    ["ABOUT ME", "aboutMe"], ["FAVORITE SAYING", "favoriteSaying"]
  ];
  var openId = null, lastFocus = null, pushed = false;

  function fill(s) {
    pfName.textContent = s.name;
    pfImg.removeAttribute("data-fallback");
    pfImg.alt = "Photo of " + s.name;
    pfImg.onerror = function () { if (!pfImg.dataset.fallback) { pfImg.dataset.fallback = "1"; pfImg.src = CMSUtil.placeholderSrc(s); } };
    pfImg.src = s.photo;
    pfList.textContent = "";
    FIELDS.forEach(function (f) {
      var v = s[f[1]];
      if (v == null || String(v).trim() === "") return;
      var p = el("p", "pf-row");
      p.appendChild(el("b", null, f[0] + ":"));
      p.appendChild(document.createTextNode(" " + v));
      pfList.appendChild(p);
    });
  }

  function open(id, fromCard) {
    var s = byId[id]; if (!s) return;
    if (openId == null) {
      lastFocus = fromCard || document.activeElement;
      try { history.pushState({ cmsModal: id }, ""); pushed = true; } catch (e) { pushed = false; }
    }
    openId = id;
    fill(s);
    overlay.hidden = false;
    document.body.classList.add("lock");
    panel.scrollTop = 0;
    closeBtn.focus({ preventScroll: true });
  }

  function hide() {
    if (openId == null) return;
    openId = null;
    overlay.hidden = true;
    document.body.classList.remove("lock");
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }
  function close() {
    if (openId == null) return;
    if (pushed && history.state && history.state.cmsModal) { pushed = false; history.back(); }  /* popstate hides it */
    else hide();
  }

  grid.addEventListener("click", function (e) {
    var b = e.target.closest(".card");
    if (b) open(Number(b.dataset.id), b);
  });
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) close(); });
  overlay.addEventListener("touchend", function (e) { if (e.target === overlay) { e.preventDefault(); close(); } });
  document.addEventListener("keydown", function (e) {
    if (openId == null) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "Tab") {                       /* keep keyboard focus inside the pop-up */
      var f = [closeBtn]; var first = f[0];
      if (document.activeElement !== first) { e.preventDefault(); first.focus(); } else { e.preventDefault(); }
    }
  });
  window.addEventListener("popstate", function () { if (openId != null) { pushed = false; hide(); } });

  /* ---------- arriving from a nickname or an award: scroll to that card ---------- */
  var moved = false;
  ["wheel", "touchmove", "keydown", "mousedown"].forEach(function (t) {
    window.addEventListener(t, function () { moved = true; }, { passive: true, once: true });
  });
  function toHash(force) {
    var m = /^#s-(\d+)$/.exec(location.hash);
    if (!m) return;
    var cell = document.getElementById("s-" + m[1]);
    if (!cell) return;
    if (force || !moved) cell.scrollIntoView({ block: "center" });
    var card = cell.querySelector(".card");
    card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
    setTimeout(function () { card.classList.remove("flash"); }, 2800);
  }
  requestAnimationFrame(function () { toHash(true); });
  window.addEventListener("load", function () { if (!moved) toHash(false); });
  window.addEventListener("hashchange", function () { toHash(true); });
})();
