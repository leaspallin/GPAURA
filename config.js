/* ============================================================
   CONFIGURATION DE L'APP — le seul fichier à modifier à la main.
   Le CONTENU (programme du jour, infos pratiques, village…) vient
   des pages du site WordPress : on les met à jour dans WordPress,
   l'app suit toute seule.
   ============================================================ */
window.GP_CONFIG = {
  site: "https://www.grandprix-auvergnerhonealpes.com",

  // Pages du site affichées dans l'app (slug = fin de l'adresse de la page).
  // Si une page n'existe pas encore, l'app affiche le texte "secours".
  pages: {
    programme:     { slug: "programme",           titre: "Programme du jour" },
    venue:         { slug: "preparez-votre-venue", titre: "Préparez votre venue" },
    acces:         { slug: "infos-pratiques",     titre: "Accès au tournoi" },
    accessibilite: { slug: "accessibilite",       titre: "Accessibilité",
                     secours: "<p>Les informations d'accessibilité (accès PMR, places réservées, accompagnement, boucles magnétiques…) seront publiées très prochainement.</p><p>Une billetterie dédiée aux personnes à mobilité réduite et en situation de handicap est déjà ouverte :</p><p><a class='btn' href='https://billetterie.grandprix-auvergnerhonealpes.com/fr/liste/grand-prix-auvergne-rhone-alpes-billet/idlist/5713/codtypadh/FTT/numadh/01/codeconf/FTMS01/adhonly' target='_blank' rel='noopener'>Billetterie PMR / PSH</a></p>" },
    village:       { slug: "village",             titre: "Le Village",
                     secours: "<p>Le plan du Village et la liste des stands seront publiés avant l'ouverture du tournoi.</p>" },
    joueurs:       { slug: "joueurs",             titre: "Les joueurs" },
    gazette:       { slug: "gazette",             titre: "La Gazette" },
    resultats:     { slug: "tableaux-de-resultats", titre: "Tableaux & résultats" }
  },

  // Page d'où l'app lit les logos des marques (carrousel partenaires).
  logosDepuis: "home",

  // Espace partenaires : le code est vérifié par WordPress
  // (= mot de passe de la page protégée "Guide Partenaires 2026").
  partenaires: { pageId: 3396, guide: "guide-partenaires.html" },

  liens: {
    billetterie: "https://billetterie.grandprix-auvergnerhonealpes.com/fr/liste/grand-prix-auvergne-rhones-alpes-billet/idlist/5575",
    parking:     "https://billetterie.grandprix-auvergnerhonealpes.com/fr/liste/acces-grand-prix-auvergne-rhone-alpes-billet/idlist/6498",
    pmr:         "https://billetterie.grandprix-auvergnerhonealpes.com/fr/liste/grand-prix-auvergne-rhone-alpes-billet/idlist/5713/codtypadh/FTT/numadh/01/codeconf/FTMS01/adhonly",
    itineraire:  "https://www.google.com/maps/search/?api=1&query=LDLC+Arena+5+avenue+Simone+Veil+69150+D%C3%A9cines-Charpieu"
  },

  // AGENDA DE LA SEMAINE (source : programme prévisionnel du site + dossier partenaires).
  // "animations" = ce qui se passe hors des courts : à compléter.
  agenda: [
    { date: "2026-10-18", jour: "Dimanche 18", tour: "Qualifications", matchs: "Matchs de qualifications · 8 matchs", debut: "11h00",
      animations: [] },
    { date: "2026-10-19", jour: "Lundi 19", tour: "1er tour", matchs: "Fin des qualifications · 1er tour simple & double · 10 matchs", debut: "11h00",
      animations: [] },
    { date: "2026-10-20", jour: "Mardi 20", tour: "1er tour", matchs: "1er tour simple & double · 10 matchs", debut: "12h00 · session soirée 19h00",
      animations: [] },
    { date: "2026-10-21", jour: "Mercredi 21", tour: "8es de finale", matchs: "Fin du 1er tour · ⅛ de finale simple · ¼ de finale double · 8 matchs", debut: "12h00 · session soirée 19h00",
      animations: [] },
    { date: "2026-10-22", jour: "Jeudi 22", tour: "8es & ¼", matchs: "Fin des ⅛ de finale simple · fin des ¼ de finale double · 8 matchs", debut: "12h00 · session soirée 19h00",
      animations: [] },
    { date: "2026-10-23", jour: "Vendredi 23", tour: "¼ de finale", matchs: "¼ de finale simple · 1ère demi-finale double · 5 matchs", debut: "12h00 · session soirée 19h00",
      animations: [] },
    { date: "2026-10-24", jour: "Samedi 24", tour: "Demi-finales", matchs: "2e demi-finale double · demi-finales simple · 3 matchs", debut: "11h30",
      animations: [{ heure: "18h30", titre: "Match d'exhibition des 4 Mousquetaires", lieu: "Court central" }] },
    { date: "2026-10-25", jour: "Dimanche 25", tour: "Finales", matchs: "Finale double · finale simple · 2 matchs", debut: "12h00",
      animations: [] }
  ]
};
