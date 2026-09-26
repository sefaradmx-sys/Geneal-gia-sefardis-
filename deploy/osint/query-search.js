/* Enruta lo que la persona escribe a las fuentes del catálogo.
   El árbol no guarda expedientes: si el texto no es el nombre de una
   herramienta, se muestran las fuentes de ese tipo y, cuando la URL
   trae un hueco, se coloca ahí el término. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root.document) {
    install(api);
  }

  function install(api) {
    function boot() {
      if (typeof doSearch !== "function" || typeof allSearchNodes === "undefined") {
        return;
      }
      var input = document.getElementById("search-input");
      if (input) {
        input.placeholder = "Correo, dominio, usuario, teléfono o herramienta";
      }
      var original = doSearch;
      doSearch = function (query) {
        if (!query) {
          original(query);
          return;
        }
        var named = allSearchNodes.filter(function (node) {
          var name = (node.data.name || "").toLowerCase();
          var desc = (node.data.description || "").toLowerCase();
          var q = query.toLowerCase();
          return name.indexOf(q) !== -1 || desc.indexOf(q) !== -1;
        });
        if (named.length) {
          original(query);
          return;
        }
        renderSources(api, query);
      };
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }

  function renderSources(api, query) {
    var results = document.getElementById("search-results");
    if (!results) return;
    var routed = api.toolsForQuery(allSearchNodes, query);
    results.classList.add("visible");
    if (!routed.tools.length) {
      results.innerHTML = '<div class="search-no-results">' + escapeHtml(routed.hint) + "</div>";
      return;
    }
    var items = routed.tools.map(function (node, idx) {
      var path = node.ancestors().reverse().slice(1, -1).map(function (ancestor) {
        return escapeHtml(ancestor.data.name);
      }).join(" › ");
      var name = escapeHtml(parseName(node.data.name).cleanName);
      var url = safeUrl(node._queryUrl || node.data.url);
      return '<div class="search-result-item" role="option" tabindex="0" data-node-idx="' + idx + '">' +
        '<div class="search-result-header">' +
        '<span class="search-result-name">' + name + "</span>" +
        (url !== "#" ? '<a class="search-result-ext" href="' + escapeAttr(url) + '" target="_blank" rel="noopener noreferrer" title="Abrir fuente">↗</a>' : "") +
        "</div>" +
        (path ? '<div class="search-result-path">' + path + "</div>" : "") +
        "</div>";
    }).join("");
    results.innerHTML = '<div class="search-no-results">' + escapeHtml(routed.hint) + "</div>" + items;
    searchMatches = routed.tools;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  var FOLDERS = {
    email: ["Email Address"],
    ip: ["IP & MAC Address"],
    url: ["Domain Name", "Search Engines"],
    phone: ["Telephone Numbers"],
    domain: ["Domain Name"],
    username: ["Username", "Social Networks", "Instant Messaging"],
    person: ["People Search Engines", "Public Records", "Search Engines"]
  };

  var KEYWORDS = [
    { pattern: /correo|e-?mail|mail/, kind: "email" },
    { pattern: /dominio|domain|\bdns\b/, kind: "domain" },
    { pattern: /\bip\b|direcci[oó]n ip/, kind: "ip" },
    { pattern: /tel[eé]fono|phone|celular|m[oó]vil/, kind: "phone" },
    { pattern: /usuario|username|\bnick\b/, kind: "username" },
    { pattern: /persona|nombre|people|gente/, kind: "person" }
  ];

  var HINTS = {
    email: "No hay una herramienta con ese nombre. Estas fuentes sirven para un correo; ábrelas con el término ya puesto cuando la URL lo permite.",
    ip: "No hay una herramienta con ese nombre. Estas fuentes sirven para una IP.",
    url: "No hay una herramienta con ese nombre. Estas fuentes sirven para una URL.",
    phone: "No hay una herramienta con ese nombre. Estas fuentes sirven para un teléfono.",
    domain: "No hay una herramienta con ese nombre. Estas fuentes sirven para un dominio.",
    username: "No hay una herramienta con ese nombre. Estas fuentes sirven para un usuario.",
    person: "No hay una herramienta con ese nombre. Estas fuentes sirven para buscar a una persona. El mapa no guarda expedientes: abre la fuente.",
    empty: "El catálogo todavía no cargó. Recarga la página.",
    none: "No hay fuentes para ese texto. Prueba un correo, dominio, usuario, teléfono o el nombre de una herramienta."
  };

  function classifyQuery(query) {
    var text = (query || "").trim();
    if (!text) return "none";
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return "email";
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(text)) return "ip";
    if (/^https?:\/\//i.test(text)) return "url";
    var digits = text.replace(/\D/g, "");
    if (digits.length >= 7 && digits.length >= text.replace(/\s/g, "").length - 4) return "phone";
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(text)) return "domain";
    var lower = text.toLowerCase();
    for (var i = 0; i < KEYWORDS.length; i += 1) {
      if (KEYWORDS[i].pattern.test(lower)) return KEYWORDS[i].kind;
    }
    if (/^[a-z0-9._-]{2,32}$/i.test(text)) return "username";
    return "person";
  }

  function fillToolUrl(url, query) {
    if (!url || /^javascript:/i.test(url)) return url || "";
    var encoded = encodeURIComponent(query);
    var tokens = ["<username>", "<searchterm>", "<domain.com>", "<user_id>", "<query>"];
    var out = url;
    tokens.forEach(function (token) {
      var encodedToken = encodeURIComponent(token);
      if (out.indexOf(token) !== -1) out = out.split(token).join(encoded);
      if (out.indexOf(encodedToken) !== -1) out = out.split(encodedToken).join(encoded);
    });
    return out;
  }

  function inFolder(node, wanted) {
    var ancestors = node.ancestors();
    for (var i = 1; i < ancestors.length; i += 1) {
      var name = ancestors[i].data && ancestors[i].data.name;
      if (wanted[name]) return true;
    }
    return false;
  }

  function toolsForQuery(nodes, query) {
    var kind = classifyQuery(query);
    if (!nodes || !nodes.length) {
      return { kind: kind, hint: HINTS.empty, tools: [] };
    }
    var wanted = {};
    (FOLDERS[kind] || []).forEach(function (name) { wanted[name] = true; });
    var tools = nodes.filter(function (node) {
      return node.data && node.data.url && inFolder(node, wanted);
    }).map(function (node) {
      node._queryUrl = fillToolUrl(node.data.url, query.trim());
      return node;
    });
    tools.sort(function (a, b) {
      var aFilled = a._queryUrl !== a.data.url ? 0 : 1;
      var bFilled = b._queryUrl !== b.data.url ? 0 : 1;
      return aFilled - bFilled;
    });
    tools = tools.slice(0, 24);
    return {
      kind: kind,
      hint: tools.length ? HINTS[kind] : HINTS.none,
      tools: tools
    };
  }

  return {
    classifyQuery: classifyQuery,
    fillToolUrl: fillToolUrl,
    toolsForQuery: toolsForQuery
  };
});
