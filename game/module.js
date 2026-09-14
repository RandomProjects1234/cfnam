/* ============================================================
   FNAF Runtime — module loader (studio only)

   Each runtime file registers itself through FNAF_MODULE so the
   studio can read its own source back out with Function.toString()
   and write it into an exported game. That is what lets the whole
   studio run with no web server: nothing is ever fetch()ed.

   Exported games never include this file — the exporter unwraps
   each module into a plain IIFE.
   ============================================================ */
(function () {
  var w = window;
  w.FNAF = w.FNAF || {};
  w.FNAF.__src = w.FNAF.__src || {};
  w.FNAF_MODULE = function (name, fn) {
    w.FNAF.__src[name] = '(' + fn.toString() + ')(window);\n';
    fn(w);
  };
})();
