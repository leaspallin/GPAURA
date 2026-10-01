/* GP AURA — application du tournoi (web-app installable).
   Le contenu vient des pages WordPress du site via l'API REST publique :
   aucune double saisie, on met à jour le site, l'app suit. */
(function () {
  var C = window.GP_CONFIG, API = C.site + "/wp-json/wp/v2/";
  var main = document.getElementById("main"), titleEl = document.getElementById("title"),
      back = document.getElementById("back");

  /* ---------- Icônes ---------- */
  var I = {
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17.5 14.5A5 5 0 0 1 21.5 19"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    shop: '<path d="M3 21h18M5 21V11l7-5 7 5v10"/><path d="M9 21v-5h6v5"/>',
    access: '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v5l-3 6M12 15l3 6"/>',
    bag: '<path d="M6 8h12l-1 13H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3z"/><circle cx="7.5" cy="13" r=".5"/><circle cx="16.5" cy="13" r=".5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24">' + I[n] + "</svg>"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  /* ---------- Lecture des pages du site ---------- */
  var mem = {};
  function fetchPage(slug) {
    if (mem[slug]) return Promise.resolve(mem[slug]);
    var url = API + "pages?slug=" + encodeURIComponent(slug) + "&_fields=modified,title,content,link";
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (arr) {
        var p = arr[0] ? { html: clean(arr[0].content.rendered), modified: arr[0].modified, link: arr[0].link, live: true } : { missing: true, live: true };
        mem[slug] = p; store("page:" + slug, p); return p;
      })
      .catch(function () {                       // hors connexion : dernière version connue
        var p = store("page:" + slug); if (p) { p.live = false; return p; }
        return { missing: true, offline: true };
      });
  }

  /* Convertit le contenu Divi (shortcodes) renvoyé par l'API en HTML propre. */
  function decode(s) { var t = document.createElement("textarea"); t.innerHTML = s; return t.value; }
  function attrs(s) {
    s = decode(s).replace(/[«»″”“]/g, '"');
    var o = {}, re = /([a-z0-9_]+)=\s*"([^"]*)"/gi, m;
    while ((m = re.exec(s))) o[m[1]] = m[2].trim();
    return o;
  }
  var SKIP = { et_pb_code: 1, et_pb_countdown_timer: 1, et_pb_video: 1, et_pb_signup: 1, et_pb_contact_form: 1 };
  function clean(raw) {
    var out = "", re = /\[(\/)?([a-z_]+)([^\[\]]*)\]/g, last = 0, m, skip = null, depth = 0;
    while ((m = re.exec(raw))) {
      var text = raw.slice(last, m.index); last = re.lastIndex;
      if (!skip) out += text;
      var closing = !!m[1], tag = m[2], a = closing ? {} : attrs(m[3]);
      if (skip) {                                   // on saute un bloc masqué ou technique
        if (tag === skip) { if (closing) { if (--depth === 0) skip = null; } else depth++; }
        continue;
      }
      if (!closing && (SKIP[tag] || a.disabled === "on" || a.disabled_on === "on|on|on")) { skip = tag; depth = 1; continue; }
      switch (tag) {
        case "et_pb_section": out += closing ? "</section>" : "<section>"; break;
        case "et_pb_row": case "et_pb_row_inner":
          out += closing ? "</div>" : '<div class="row' + ((a.column_structure || "").split(",").length >= 3 ? " multi" : "") + '">'; break;
        case "et_pb_column": case "et_pb_column_inner": out += closing ? "</div>" : '<div class="col">'; break;
        case "et_pb_text": case "et_pb_blurb": out += closing ? "</div>" : '<div class="txt">' + (a.title ? "<h3>" + esc(a.title) + "</h3>" : ""); break;
        case "et_pb_image": if (!closing && a.src) out += '<img src="' + esc(a.src) + '" alt="' + esc(a.alt || a.title_text || "") + '" loading="lazy">'; break;
        case "et_pb_button": if (!closing && a.button_url) out += '<p><a class="btn" href="' + esc(a.button_url) + '">' + esc(a.button_text || "En savoir plus") + "</a></p>"; break;
        case "dipi_carousel": out += closing ? "</div>" : '<div class="logos">'; break;
        case "dipi_carousel_child":
          if (!closing && a.img_src) out += '<a href="' + esc(a.link_option_url || "#") + '"><img src="' + esc(a.img_src) + '" alt="' + esc(a.label || "") + '" loading="lazy"></a>'; break;
        default: break;                              // autres shortcodes : on garde seulement le texte
      }
    }
    if (!skip) out += raw.slice(last);
    return sanitize(out);
  }
  function sanitize(html) {
    var doc = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html"), root = doc.body.firstChild;
    root.querySelectorAll("script,style,iframe,form,input,button,object,embed,link,meta,noscript").forEach(function (n) { n.remove(); });
    root.querySelectorAll("*").forEach(function (n) {
      [].slice.call(n.attributes).forEach(function (at) {
        if (/^on/i.test(at.name) || at.name === "style" || (/^(href|src)$/.test(at.name) && /^\s*javascript:/i.test(at.value))) n.removeAttribute(at.name);
      });
      if (n.tagName === "A") { n.setAttribute("target", "_blank"); n.setAttribute("rel", "noopener"); }
    });
    // retire les blocs vides laissés par la mise en page Divi
    for (var k = 0; k < 3; k++) root.querySelectorAll(".txt,.col,.row,section,p").forEach(function (n) {
      if (!n.textContent.trim() && !n.querySelector("img,a")) n.remove();
    });
    return root.innerHTML;
  }

  function pageBlock(key, opts) {
    opts = opts || {};
    var p = C.pages[key], id = "wp-" + key + "-" + Math.random().toString(36).slice(2, 7);
    setTimeout(function () {
      fetchPage(p.slug).then(function (r) {
        var el = document.getElementById(id); if (!el) return;
        if (r.missing) { el.innerHTML = p.secours || '<p class="muted">Contenu bientôt disponible.</p>'; return; }
        var d = new Date(r.modified);
        el.innerHTML = (opts.noStamp ? "" : '<div class="upd' + (r.live ? "" : " off") + '"><i></i>' +
          (r.live ? "Mis à jour le " : "Hors connexion — version du ") +
          d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + " à " +
          d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + "</div>") + r.html;
      });
    });
    return '<div class="wp" id="' + id + '"><div class="skel"></div><div class="skel" style="width:80%"></div><div class="skel" style="width:60%"></div></div>';
  }

  /* ---------- Dates ---------- */
  function parisToday() { return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }); }
  var START = new Date("2026-10-18T11:00:00+02:00");

  /* ---------- Vues ---------- */
  var V = {};

  V.accueil = function () {
    var today = parisToday(), day = null, idx = -1;
    C.agenda.forEach(function (d, i) { if (d.date === today) { day = d; idx = i; } });
    var before = today < C.agenda[0].date, after = today > C.agenda[C.agenda.length - 1].date;
    var todayCard;
    if (day) {
      todayCard = '<div class="card today"><span class="tag">Aujourd\'hui · ' + esc(day.tour) + '</span><h3>' + esc(day.jour) + " octobre</h3><p style=\"margin:0 0 10px\">" + esc(day.matchs) +
        '<br><span class="muted">Début des matchs : ' + esc(day.debut) + "</span></p>" + anims(day) +
        '<a class="btn block" href="#programme">Voir l\'ordre des matchs</a></div>';
    } else if (before) {
      var f = C.agenda[0];
      todayCard = '<div class="card today"><span class="tag">Premier jour</span><h3>' + esc(f.jour) + " octobre · " + esc(f.tour) +
        '</h3><p class="muted" style="margin:0 0 10px">Le programme définitif de chaque journée est publié la veille à partir de 19h.</p><a class="btn block" href="#programme">Voir l\'agenda de la semaine</a></div>';
    } else {
      todayCard = '<div class="card today"><span class="tag">Merci !</span><h3>Rendez-vous en 2027</h3><p class="muted" style="margin:0">Merci d\'avoir fait vivre la première édition du Grand Prix Auvergne-Rhône-Alpes.</p></div>';
    }
    return '<div class="hero"><img class="stripes" src="stripes.png" alt=""><img class="logo" src="logo_white.png" alt="Grand Prix Auvergne-Rhône-Alpes — ATP 250">' +
      '<div class="when">18 → 25 octobre 2026 · LDLC Arena, Lyon-Décines</div><div class="cd" id="cd"></div></div>' +
      todayCard +
      '<div class="card install" id="install"><img src="icon-192.png" alt=""><div style="flex:1"><b>Installer l\'app</b><div class="muted" id="installtxt">Accès direct depuis votre écran d\'accueil, même hors connexion.</div></div><button class="btn" id="installbtn" style="display:none">Installer</button></div>' +
      '<div class="grid2">' +
      tile("#programme", "cal", "Programme", "Ordre des matchs du jour") +
      tile("#page/joueurs", "users", "Joueurs", "Qui joue à Lyon") +
      tile(C.liens.billetterie, "ticket", "Billetterie", "Réserver vos places", true) +
      tile("#infos/acces", "pin", "Venir", "Tram, parking, accès") +
      tile("#page/resultats", "trophy", "Tableaux", "Résultats en direct") +
      tile("#page/gazette", "news", "La Gazette", "L'actu du jour") +
      tile("#village", "shop", "Le Village", "Stands & marques") +
      tile("#infos/accessibilite", "access", "Accessibilité", "Accueil PMR / PSH") +
      "</div>";
  };
  function tile(href, i, t, s, ext) {
    return '<a class="tile" href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + '><span class="i">' + ic(i) + "</span><b>" + t + "</b><small>" + s + "</small></a>";
  }
  function anims(d) {
    return (d.animations || []).map(function (a) { return '<div class="anim"><b>' + esc(a.heure) + "</b> · " + esc(a.titre) + (a.lieu ? ' <span class="muted">— ' + esc(a.lieu) + "</span>" : "") + "</div>"; }).join("");
  }

  V.programme = function (sub) {
    sub = sub || "jour";
    var seg = '<div class="seg" role="tablist">' + [["jour", "Du jour"], ["semaine", "La semaine"], ["comprendre", "Comprendre"]].map(function (x) {
      return '<button role="tab" class="' + (x[0] === sub ? "on" : "") + '" data-go="#programme/' + x[0] + '">' + x[1] + "</button>";
    }).join("") + "</div>";
    if (sub === "semaine") {
      var today = parisToday();
      return seg + C.agenda.map(function (d) {
        var p = d.jour.split(" ");
        return '<div class="card day' + (d.date === today ? " now" : "") + '"><div class="d"><small>' + p[0].slice(0, 3) + ".</small><b>" + p[1] + '</b></div><div class="c"><div class="t">' + esc(d.tour) + '</div><div class="muted">' + esc(d.matchs) + "</div><div class=\"muted\">Début : " + esc(d.debut) + "</div>" + anims(d) + "</div></div>";
      }).join("") + '<p class="muted">Programme prévisionnel, susceptible de modifications.</p>';
    }
    if (sub === "comprendre") {
      return seg +
        '<div class="card"><span class="eyebrow">Le tournoi</span><h3>Un ATP 250, c\'est quoi ?</h3><p>Le Grand Prix Auvergne-Rhône-Alpes est un tournoi du circuit professionnel masculin ATP, catégorie 250. Les joueurs y gagnent des points au classement mondial.</p><p style="margin:0">32 joueurs en simple, 16 équipes en double, sur dur indoor à la LDLC Arena.</p></div>' +
        '<div class="card"><span class="eyebrow">La semaine</span><h3>Des qualifications à la finale</h3><p><b>Dimanche et lundi — qualifications.</b> Des joueurs se disputent les dernières places du tableau final.</p><p><b>Lundi → jeudi — premiers tours.</b> 1er tour puis 8es de finale, avec des sessions en journée et en soirée.</p><p style="margin:0"><b>Vendredi → dimanche — le dernier carré.</b> Quarts, demi-finales, puis les finales double et simple le dimanche 25.</p></div>' +
        '<div class="card"><span class="eyebrow">Les règles</span><h3>Format de jeu</h3><p><b>Simple :</b> au meilleur des 3 manches, jeu décisif dans toutes les manches.</p><p style="margin:0"><b>Double :</b> au meilleur des 3 manches, jeu décisif et point décisif dans les 2 premières ; la 3<sup>e</sup> manche est remplacée par un super tie-break en 10 points.</p></div>' +
        '<div class="card"><span class="eyebrow">Bon à savoir</span><h3>Wild cards & ordre des matchs</h3><p>Les <b>wild cards</b> sont des invitations accordées par l\'organisation à des joueurs qui n\'entrent pas directement au classement.</p><p style="margin:0">L\'<b>ordre des matchs</b> de chaque journée est publié la veille à partir de 19h, dans l\'onglet « Du jour ».</p></div>';
    }
    return seg + '<div class="card">' + pageBlock("programme") + "</div>";
  };

  V.village = function () {
    var id = "logos-" + Date.now();
    setTimeout(function () {
      fetch(API + "pages?slug=" + C.logosDepuis + "&_fields=content").then(function (r) { return r.json(); }).then(function (a) {
        var el = document.getElementById(id); if (!el || !a[0]) return;
        var tmp = document.createElement("div"); tmp.innerHTML = clean(a[0].content.rendered);
        var seen = {}, logos = [].slice.call(tmp.querySelectorAll(".logos a")).filter(function (x) {
          var k = x.querySelector("img").getAttribute("alt"); if (seen[k]) return false; return (seen[k] = true);
        });
        el.innerHTML = logos.length ? '<div class="logos">' + logos.map(function (x) { return x.outerHTML; }).join("") + "</div>" : '<p class="muted">Logos bientôt disponibles.</p>';
      }).catch(function () { var el = document.getElementById(id); if (el) el.innerHTML = '<p class="muted">Hors connexion.</p>'; });
    });
    return '<div class="card"><span class="eyebrow">Village grand public</span><h2>Le Village</h2>' + pageBlock("village", { noStamp: true }) + "</div>" +
      '<div class="card"><span class="eyebrow">Ils font le tournoi</span><h2>Nos partenaires</h2><div id="' + id + '"><div class="skel"></div></div></div>';
  };

  V.infos = function (open) {
    var items = [
      ["venue", "bag", "Préparez votre venue", pageBlock("venue", { noStamp: true })],
      ["acces", "pin", "Accès au tournoi", pageBlock("acces", { noStamp: true }) + '<p><a class="btn" href="' + C.liens.itineraire + '" target="_blank" rel="noopener">Itinéraire</a></p>'],
      ["accessibilite", "access", "Accessibilité", pageBlock("accessibilite", { noStamp: true })],
      ["billets", "ticket", "Billetterie & parking", '<p><a class="btn block" href="' + C.liens.billetterie + '" target="_blank" rel="noopener">Billetterie grand public</a></p><p><a class="btn ghost block" href="' + C.liens.parking + '" target="_blank" rel="noopener">Réserver un parking</a></p><p style="margin:0"><a class="btn ghost block" href="' + C.liens.pmr + '" target="_blank" rel="noopener">Billetterie PMR / PSH</a></p>']
    ];
    return items.map(function (x) {
      return '<details class="acc" id="acc-' + x[0] + '"' + (open === x[0] ? " open" : "") + '><summary><span class="i">' + ic(x[1]) + "</span>" + x[2] + '</summary><div class="in">' + x[3] + "</div></details>";
    }).join("") + '<p class="muted" style="text-align:center">Une question ? <a href="' + C.site + '/contact/" target="_blank" rel="noopener">Contactez-nous</a></p>';
  };

  V.partenaires = function () {
    if (store("gp-partner")) return partnerHome();
    return '<div class="card lock"><div class="pad">' + ic("lock") + '</div><h2>Espace partenaires</h2><p class="muted">Réservé aux partenaires et invités VIP. Saisissez le code reçu avec vos billets.</p>' +
      '<form id="pform"><input id="pcode" type="password" autocomplete="off" placeholder="Code d\'accès" aria-label="Code d\'accès"><div class="err" id="perr"></div><button class="btn block" type="submit">Accéder</button></form></div>';
  };
  function partnerHome() {
    return '<div class="card"><span class="eyebrow">Espace partenaires</span><h2>Bienvenue</h2><p>Votre guide pratique : programme, horaires d\'accueil, espaces VIP (La Suite, Le Club, Le Village), billetterie, parking et contacts.</p><button class="btn block" data-guide>Ouvrir le guide partenaires</button></div>' +
      '<p class="muted" style="text-align:center"><a href="#partenaires" data-logout>Se déconnecter</a></p>';
  }
  function openGuide() {
    var g = document.createElement("div"); g.className = "guide";
    g.innerHTML = '<header><b>Guide partenaires</b><button class="back on" aria-label="Fermer" style="display:flex">' + ic("close") + '</button></header><iframe src="' + C.partenaires.guide + '" title="Guide partenaires"></iframe>';
    g.querySelector("button").onclick = function () { g.remove(); };
    document.body.appendChild(g);
  }

  V.page = function (key) {
    var p = C.pages[key]; if (!p) return '<p>Page introuvable.</p>';
    return '<div class="card">' + pageBlock(key) + '</div><p class="muted" style="text-align:center"><a href="' + C.site + "/" + p.slug + '/" target="_blank" rel="noopener">Voir sur le site</a></p>';
  };

  /* ---------- Routeur ---------- */
  var TITLES = { accueil: "", programme: "Programme", village: "Le Village", infos: "Infos pratiques", partenaires: "Partenaires" };
  function route() {
    var h = (location.hash || "#accueil").slice(1).split("/"), v = h[0] || "accueil", arg = h[1];
    if (!V[v]) v = "accueil";
    var tab = v === "page" ? "accueil" : v;
    document.querySelectorAll(".tabs a").forEach(function (a) { a.classList.toggle("on", a.dataset.tab === tab); });
    titleEl.textContent = v === "page" ? (C.pages[arg] || {}).titre || "" : TITLES[v];
    back.classList.toggle("on", v === "page");
    main.innerHTML = '<div class="view">' + V[v](arg) + "</div>";
    window.scrollTo(0, 0);
    if (v === "accueil") { tick(); setupInstall(); }
    if (v === "infos" && arg) { var d = document.getElementById("acc-" + arg); if (d) setTimeout(function () { d.scrollIntoView({ block: "start" }); }); }
  }
  window.addEventListener("hashchange", route);
  back.onclick = function () { history.length > 1 ? history.back() : (location.hash = "#accueil"); };

  main.addEventListener("click", function (e) {
    var t = e.target.closest("[data-go],[data-guide],[data-logout]"); if (!t) return;
    if (t.dataset.go) { location.hash = t.dataset.go; }
    if (t.hasAttribute("data-guide")) openGuide();
    if (t.hasAttribute("data-logout")) { e.preventDefault(); store("gp-partner", false); route(); }
  });
  main.addEventListener("submit", function (e) {
    if (e.target.id !== "pform") return;
    e.preventDefault();
    var code = document.getElementById("pcode").value.trim(), err = document.getElementById("perr");
    if (!code) { err.textContent = "Saisissez votre code."; return; }
    err.textContent = "Vérification…";
    // Le code = mot de passe de la page protégée WordPress : c'est le site qui le valide.
    fetch(API + "pages/" + C.partenaires.pageId + "?_fields=id&password=" + encodeURIComponent(code))
      .then(function (r) {
        if (r.ok) { store("gp-partner", true); route(); openGuide(); }
        else err.textContent = r.status === 403 ? "Code incorrect." : "Vérification impossible, réessayez.";
      }).catch(function () { err.textContent = "Connexion nécessaire pour vérifier le code."; });
  });

  /* ---------- Compte à rebours ---------- */
  var timer;
  function tick() {
    clearInterval(timer);
    function f() {
      var el = document.getElementById("cd"); if (!el) return clearInterval(timer);
      var t = START - new Date();
      if (t <= 0) { el.innerHTML = '<div style="flex:1;text-align:left;background:none;padding:0"><b style="font-size:18px">Le tournoi est lancé !</b></div>'; return; }
      var d = Math.floor(t / 864e5), h = Math.floor(t % 864e5 / 36e5), m = Math.floor(t % 36e5 / 6e4);
      el.innerHTML = "<div><b>" + d + "</b><small>jours</small></div><div><b>" + h + "</b><small>heures</small></div><div><b>" + m + "</b><small>min</small></div>";
    }
    f(); timer = setInterval(f, 30000);
  }

  /* ---------- Installation ---------- */
  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; setupInstall(); });
  function setupInstall() {
    var box = document.getElementById("install"); if (!box) return;
    var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    if (standalone) return;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (deferred) {
      box.classList.add("on"); var b = document.getElementById("installbtn"); b.style.display = "";
      b.onclick = function () { deferred.prompt(); deferred.userChoice.then(function () { deferred = null; box.classList.remove("on"); }); };
    } else if (ios) {
      box.classList.add("on");
      document.getElementById("installtxt").innerHTML = "Touchez <b>Partager</b> puis <b>« Sur l'écran d'accueil »</b>.";
    }
  }

  /* ---------- Hors connexion ---------- */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  route();
})();
