/* Awards: names are links to the student's photo card, opened with a double-click / double-tap. */
(function () {
  "use strict";
  if (!window.Auth || !Auth.isIn()) return;

  var site = CMS.site || {};
  var byId = {};
  CMS.students.forEach(function (s) { byId[s.id] = s; });
  var rows = document.getElementById("rows");
  var el = CMSUtil.el;

  document.getElementById("title").textContent =
    (site.year || "2K26") + " (The " + (site.setName || "Invictus") + " Set) Awards and Awardees";

  CMS.awards.forEach(function (a, i) {
    var tr = document.createElement("tr");
    tr.appendChild(el("td", "sn", (i + 1) + "."));
    tr.appendChild(el("td", "aw", a.title));
    var td = el("td", "wn");
    var wrap = el("div", "winners");
    a.winners.forEach(function (w) {
      if (typeof w === "number" && byId[w]) {
        var s = byId[w];
        var n = el("span", "winner", s.name);
        n.dataset.id = s.id;
        n.setAttribute("role", "link");
        n.tabIndex = 0;
        n.title = "Double-click to open " + s.name + "'s photo card";
        wrap.appendChild(n);
      } else if (typeof w === "string" && w.trim() === "&") {
        wrap.appendChild(el("span", "amp", "&"));
      } else if (typeof w === "string") {
        wrap.appendChild(el("span", "winner plain", w));
      }
    });
    td.appendChild(wrap);
    tr.appendChild(td);
    rows.appendChild(tr);
  });

  var navigating = false;
  function go(node) {
    if (navigating) return;
    navigating = true;
    location.href = "students.html#s-" + node.dataset.id;
  }

  /* Two quick clicks/taps on the same name = double-click. Works with a mouse and on touch screens. */
  var last = { node: null, t: 0 };
  rows.addEventListener("click", function (e) {
    var n = e.target.closest(".winner[data-id]");
    if (!n) return;
    var now = Date.now();
    if (last.node === n && now - last.t < 500) { go(n); return; }
    last = { node: n, t: now };
    n.classList.add("armed");
    setTimeout(function () { n.classList.remove("armed"); }, 500);
  });
  rows.addEventListener("dblclick", function (e) {
    var n = e.target.closest(".winner[data-id]");
    if (n) go(n);
  });
  rows.addEventListener("keydown", function (e) {
    var n = e.target.closest(".winner[data-id]");
    if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go(n); }
  });
  /* Coming back with the Back button: allow navigating again. */
  window.addEventListener("pageshow", function () { navigating = false; });
})();
