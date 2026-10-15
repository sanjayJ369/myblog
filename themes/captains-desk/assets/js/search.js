// Search page: fetches the JSON index Hugo builds for the home page and filters it as you type.
(function () {
  "use strict";
  const q = document.getElementById("q"), out = document.getElementById("results"), cnt = document.getElementById("search-count");
  if (!q) return;
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let posts = [];

  function render() {
    const term = q.value.trim();
    const params = new URLSearchParams(location.search);
    if (term) params.set("q", term); else params.delete("q");
    history.replaceState(null, "", location.pathname + (params.toString() ? "?" + params : ""));
    if (!term) {
      cnt.innerHTML = `Type to search ${posts.length} entries. Try <button type="button" class="try">tcp</button> <button type="button" class="try">b+ tree</button> <button type="button" class="try">go</button>`;
      out.innerHTML = "";
      return;
    }
    const re = new RegExp(rx(term), "i");
    const hits = posts.filter(p => re.test(p.title + " " + p.tags.join(" ") + " " + p.summary));
    // split the raw text on matches, then escape each piece, so highlighting never cuts an HTML entity
    const hl = s => s.split(new RegExp(`(${rx(term)})`, "gi")).map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part))).join("");
    cnt.textContent = `${hits.length} ${hits.length === 1 ? "result" : "results"} for “${term}”`;
    out.innerHTML = hits.map(p => {
      const d = p.date.split("-");
      return `<li><div class="res-meta">${d[2]} ${months[+d[1] - 1]} ${d[0]} · ${p.minutes} min · ${p.tags.map(t => "#" + hl(t)).join(" ")}</div>
        <a class="res-title" href="${p.permalink}">${hl(p.title)}</a><p>${hl(p.summary)}</p></li>`;
    }).join("") || `<li class="none">Nothing matches. Try a broader word, or browse <a href="${out.dataset.tags}">tags</a>.</li>`;
  }

  q.addEventListener("input", render);
  q.addEventListener("keydown", e => { if (window.cdSfx && (e.key.length === 1 || e.key === "Backspace")) window.cdSfx.key(); });
  cnt.addEventListener("click", e => { const b = e.target.closest(".try"); if (b) { q.value = b.textContent; render(); q.focus(); } });
  document.addEventListener("keydown", e => {
    if (e.key === "/" && document.activeElement !== q && !e.metaKey && !e.ctrlKey) { e.preventDefault(); q.focus(); q.select(); }
  });

  q.value = new URLSearchParams(location.search).get("q") || "";
  cnt.textContent = "Loading the index…";
  fetch(out.dataset.index)
    .then(r => r.json())
    .then(data => { posts = data; render(); })
    .catch(() => { cnt.textContent = "The search index could not be loaded. Browse the archives instead."; });
})();
