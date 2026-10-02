/* ==========================================================================
   converter.js — UI for the Natural Units Converter.

   The physics lives in engine.js (the `NU` global, generated — see its
   header). This file is only wiring: input -> NU.calculate -> DOM. It is a
   vanilla-JS port of an earlier React implementation, keeping its content —
   system switch, live "reads as" LaTeX, result with dimension, precision-
   aware copy, cited parameter values, particle/constant lookup, reference
   tables, history — in this site's visual language.

   KaTeX is loaded deferred by the page; everything degrades to plain text
   until it arrives.
   ========================================================================== */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  var PLACEHOLDERS = { SI: "e.g.  m_p c^2 in MeV", natural: "e.g.  m_p in MeV", gaussian: "e.g.  m_e c^2 in erg" };
  var state = { system: "natural", sigFigs: 2, asLatex: true, history: [], lookupSel: null };

  /* ---------------------------------------------------------------- KaTeX */

  function tex(el, src, fallback) {
    if (window.katex) {
      try { el.innerHTML = window.katex.renderToString(src, { throwOnError: false, displayMode: false }); return; }
      catch (e) { /* fall through */ }
    }
    el.textContent = fallback || src;
  }
  // re-render everything once KaTeX lands (scripts are deferred, we may run first)
  var katexPoll = setInterval(function () {
    if (window.katex) { clearInterval(katexPoll); update(); }
  }, 60);

  /* ------------------------------------------- number/unit -> LaTeX bits */

  function numberToTex(formatted) {
    if (formatted.indexOf("e") !== -1) {
      var p = formatted.split("e");
      return p[0] + "\\times10^{" + p[1] + "}";
    }
    return formatted.replace("∞", "\\infty").replace("−", "-");
  }
  function unitBody(unit) {
    return unit.replace(/\*/g, "\\,").replace(/\s+/g, "\\,").replace(/\^(-?\d+(?:\.\d+)?(?:\/\d+)?)/g, "^{$1}");
  }
  function unitToTex(unit) { return unit ? "\\mathrm{" + unitBody(unit) + "}" : ""; }

  function trimZeros(s) { return s.indexOf(".") !== -1 ? s.replace(/\.?0+$/, "") : s; }
  function sciParts(x, sig) {
    if (x === 0 || !isFinite(x)) return { mantissa: x === 0 ? "0" : String(x), exp: 0 };
    var p = x.toExponential(Math.max(0, sig - 1)).split("e");
    return { mantissa: trimZeros(p[0]), exp: Number(p[1]) };
  }
  function toPlainResult(value, unit, sig) { return NU.fmtNum(value, sig) + (unit ? " " + unit : ""); }
  function toLatexResult(value, unit, sig) {
    var sp = sciParts(value, sig);
    var num = sp.exp === 0 ? sp.mantissa : sp.mantissa + "\\times10^{" + sp.exp + "}";
    return "$" + num + (unit ? "\\,{\\rm " + unitBody(unit) + "}" : "") + "$";
  }

  /* ------------------------------------------------------------- helpers */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function cite(source) {
    if (!source) return "";
    return '<a class="nuc-cite" href="' + esc(source.url) + '" target="_blank" rel="noopener" ' +
      'title="Source: ' + esc(source.label) + '">' + esc(source.label) + " ↗</a>";
  }
  function copyText(text, btn) {
    if (!text || !navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    var old = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(function () { btn.textContent = old; }, 1200);
  }
  // one delegated handler for every [data-copy] button, including future ones
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (b) copyText(b.getAttribute("data-copy"), b);
  });

  /* ------------------------------------------------------------ calculator */

  function update() {
    var input = $("nuc-input").value;
    var r = NU.calculate(input, state.system);

    // live "reads as" preview
    var readsTex = NU.exprToLatex(input);
    var reads = $("nuc-reads");
    if (readsTex) tex(reads, readsTex);
    else reads.innerHTML = '<span class="nuc-dim">' + (input.trim() ? "cannot parse yet…" : "live preview of your expression") + "</span>";

    var box = $("nuc-result");
    if (r.empty) {
      box.innerHTML = '<p class="nuc-dim">Result appears here…</p>';
    } else if (r.ok) {
      var valueTex = numberToTex(NU.fmtNum(r.value)) + (r.unit ? "\\;" + unitToTex(r.unit) : "");
      var info = '<span class="mono">' + esc(r.display) + "</span>";
      if (r.dimension && !r.isConversion) info += '<span>dimension: <span class="mono">[' + esc(r.dimension) + "]</span></span>";
      if (r.isConversion) info += '<span class="nuc-conv">conversion</span>';
      box.innerHTML =
        '<div class="nuc-value-row"><span class="nuc-value" id="nuc-value"></span>' +
        '<button class="nuc-btn" data-copy="' + esc(r.display || "") + '">Copy</button></div>' +
        '<div class="nuc-info">' + info + "</div>" +
        '<div class="nuc-copyrow">' +
        '<label>sig figs <input type="number" id="nuc-sig" min="1" max="15" value="' + state.sigFigs + '"></label>' +
        '<label><input type="checkbox" id="nuc-latex"' + (state.asLatex ? " checked" : "") + "> LaTeX</label>" +
        '<code id="nuc-precise"></code>' +
        '<button class="nuc-btn solid" id="nuc-copy-precise">Copy</button></div>';
      tex($("nuc-value"), valueTex, r.display);
      var precise = state.asLatex ? toLatexResult(r.value, r.unit || "", state.sigFigs)
                                  : toPlainResult(r.value, r.unit || "", state.sigFigs);
      $("nuc-precise").textContent = precise;
      $("nuc-copy-precise").setAttribute("data-copy", precise);
      $("nuc-sig").addEventListener("change", function () {
        state.sigFigs = Math.max(1, Math.min(15, Number(this.value) || 1)); update();
      });
      $("nuc-latex").addEventListener("change", function () { state.asLatex = this.checked; update(); });
    } else {
      box.innerHTML = '<p class="nuc-err">⚠ ' + esc(r.error || "error") + "</p>";
    }

    renderUsed(input);
  }

  function renderUsed(input) {
    var used = NU.symbolsUsed(input);
    var all = used.constants.concat(used.units);
    var sec = $("nuc-used");
    if (!all.length) { sec.hidden = true; return; }
    sec.hidden = false;
    sec.innerHTML = '<p class="nuc-head">Parameter values used</p>' + all.map(function (s) {
      return '<div class="nuc-row"><span><code class="nuc-sym">' + esc(s.symbol) + "</code> " +
        '<span class="nuc-dim">' + esc(s.name) + "</span> " +
        '<span class="mono small">= ' + esc(s.siValue) + "</span></span>" + cite(s.source) + "</div>";
    }).join("");
  }

  /* -------------------------------------------------------------- history */

  function commit() {
    var expr = $("nuc-input").value.trim();
    if (!expr) return;
    var r = NU.calculate(expr, state.system);
    var top = state.history[0];
    if (top && top.expr === expr && top.system === state.system) return;
    state.history.unshift({ expr: expr, system: state.system, ok: r.ok, display: r.ok ? r.display || "" : r.error || "error" });
    state.history = state.history.slice(0, 100);
    renderHistory();
  }
  function renderHistory() {
    var wrap = $("nuc-history-wrap"), ol = $("nuc-history");
    wrap.hidden = !state.history.length;
    ol.innerHTML = state.history.map(function (h, i) {
      var tag = h.system === "natural" ? "NAT" : h.system === "gaussian" ? "CGS" : "SI";
      return '<li><button class="nuc-hist" data-i="' + i + '"><span class="nuc-tag">' + tag + "</span>" +
        '<span class="mono">' + esc(h.expr) + "</span>" +
        '<span class="mono small ' + (h.ok ? "ok" : "bad") + '">= ' + esc(h.display) + "</span></button></li>";
    }).join("");
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".nuc-hist");
    if (!b) return;
    var h = state.history[Number(b.dataset.i)];
    $("nuc-input").value = h.expr;
    setSystem(h.system);
  });

  /* -------------------------------------------------------------- systems */

  function setSystem(id) {
    state.system = id;
    var hint = "";
    NU.UNIT_SYSTEMS.forEach(function (s) { if (s.id === id) hint = s.hint; });
    $("nuc-systems").querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.system === id ? "true" : "false");
    });
    $("nuc-hint").textContent = hint;
    $("nuc-input").placeholder = PLACEHOLDERS[id] || "";
    update();
  }
  function renderSystems() {
    $("nuc-systems").innerHTML = NU.UNIT_SYSTEMS.map(function (s) {
      return '<button data-system="' + s.id + '" title="' + esc(s.hint) + '">' + esc(s.label) + "</button>";
    }).join("");
    $("nuc-systems").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-system]");
      if (b) setSystem(b.dataset.system);
    });
  }

  /* --------------------------------------------------------------- lookup */

  function propText(p) {
    if (p.numeric !== undefined && p.unit) {
      return state.asLatex ? toLatexResult(p.numeric, p.unit, state.sigFigs) : toPlainResult(p.numeric, p.unit, state.sigFigs);
    }
    return p.display;
  }
  function renderLookup() {
    var q = $("nuc-lookup-input").value;
    var hits = NU.searchEntities(q);
    var out = $("nuc-lookup-out");
    if (!q.trim()) { out.innerHTML = ""; return; }
    if (!hits.length) {
      out.innerHTML = '<p class="nuc-err small">No match. Try a particle (electron, W, top quark) or a constant (planck, c, G).</p>';
      return;
    }
    var sel = null;
    hits.forEach(function (h) { if (h.entity.id === state.lookupSel) sel = h.entity; });
    if (!sel) sel = hits[0].entity;

    var chips = hits.length > 1 ? '<div class="nuc-chips">' + hits.map(function (h) {
      return '<button class="nuc-chip" data-ent="' + esc(h.entity.id) + '"' +
        (h.entity.id === sel.id ? ' aria-pressed="true"' : "") + ">" + esc(h.entity.name) + "</button>";
    }).join("") + "</div>" : "";

    var head = '<div class="nuc-ent-head"><b>' + esc(sel.name) + "</b>" +
      (sel.symbol ? ' <span class="mono nuc-sym">' + esc(sel.symbol) + "</span>" : "") +
      ' <span class="nuc-tag">' + esc(sel.kind) + "</span></div>" +
      (sel.summary ? '<p class="nuc-dim small">' + esc(sel.summary) + "</p>" : "");

    var calc = sel.calcSymbol
      ? '<div class="nuc-row"><span>In the calculator, type <code class="nuc-sym">' + esc(sel.calcSymbol) + "</code>" +
        (sel.calcValue ? ' <span class="mono small">= ' + esc(sel.calcValue) + "</span>" : "") + "</span>" +
        '<span><button class="nuc-btn" data-use="' + esc(sel.calcSymbol) + '">Use</button> ' +
        '<button class="nuc-btn" data-copy="' + esc(sel.calcSymbol) + '">Copy</button></span></div>'
      : "";

    var props = sel.properties.map(function (p) {
      return '<div class="nuc-row"><span class="nuc-dim nuc-plabel">' + esc(p.label) + "</span>" +
        '<span class="mono nuc-pval">' + esc(p.display) + "</span>" +
        "<span>" + (p.source ? cite(p.source) + " " : "") +
        '<button class="nuc-btn" data-copy="' + esc(propText(p)) + '">Copy</button></span></div>';
    }).join("");

    out.innerHTML = chips + '<div class="nuc-ent">' + head + calc + props + "</div>";
  }
  document.addEventListener("click", function (e) {
    var c = e.target.closest(".nuc-chip");
    if (c) { state.lookupSel = c.getAttribute("data-ent"); renderLookup(); return; }
    var u = e.target.closest("[data-use]");
    if (u) {
      var inp = $("nuc-input");
      inp.value = inp.value.trim() ? inp.value.trim() + " " + u.getAttribute("data-use") : u.getAttribute("data-use");
      inp.focus(); update();
    }
  });

  /* ------------------------------------------------------------ reference */

  function renderReference() {
    var q = $("nuc-ref-input").value.trim().toLowerCase();
    var match = function (d) {
      return !q || d.symbol.toLowerCase().indexOf(q) !== -1 || d.name.toLowerCase().indexOf(q) !== -1;
    };
    var row = function (d) {
      return '<div class="nuc-row"><span><code class="nuc-sym">' + esc(d.symbol) + "</code> " +
        '<span class="nuc-dim">' + esc(d.name) + "</span></span>" +
        '<span><span class="mono small">= ' + esc(NU.siLabel(d)) + "</span> " + cite(d.source) + "</span></div>";
    };
    $("nuc-ref-consts").innerHTML = NU.CONSTANTS.filter(match).map(row).join("") || '<p class="nuc-dim small">no match</p>';
    $("nuc-ref-units").innerHTML = NU.UNITS.filter(match).map(row).join("") || '<p class="nuc-dim small">no match</p>';
  }

  /* ----------------------------------------------------------------- init */

  renderSystems();
  $("nuc-ref-count").textContent = NU.CONSTANTS.length + " constants, " + NU.UNITS.length + " units";
  setSystem(state.system);
  renderReference();
  $("nuc-input").addEventListener("input", update);
  $("nuc-input").addEventListener("keydown", function (e) { if (e.key === "Enter") commit(); });
  $("nuc-lookup-input").addEventListener("input", function () { state.lookupSel = null; renderLookup(); });
  $("nuc-ref-input").addEventListener("input", renderReference);
  $("nuc-input").focus();
})();
