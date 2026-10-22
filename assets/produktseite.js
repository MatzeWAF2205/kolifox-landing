// ---- Ansichts-Umschalter (Patienten / Praxen), teilbar per #praxen ----
(function () {
  var tabs = { pat: document.getElementById('tab-pat'), pra: document.getElementById('tab-pra') };
  var views = { pat: document.getElementById('view-pat'), pra: document.getElementById('view-pra') };
  var cta = document.getElementById('head-cta');

  function show(which, push) {
    Object.keys(views).forEach(function (k) {
      var on = k === which;
      views[k].hidden = !on;
      tabs[k].setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (which === 'pra') {
      cta.textContent = 'Praxis-Login';
      cta.href = 'https://cockpit.kolifox.de/login';
    } else {
      cta.textContent = 'Zur App';
      cta.href = 'https://app.kolifox.de';
    }
    if (push) history.replaceState(null, '', which === 'pra' ? '#praxen' : '#patienten');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabs.pat.addEventListener('click', function () { show('pat', true); });
  tabs.pra.addEventListener('click', function () { show('pra', true); });
  if (location.hash === '#praxen') show('pra', false);
})();

// ---- Diashow im Handy-Bildschirm ----
(function () {
  const slot = document.getElementById('screen-slot');
  if (!slot) return;

  // ====== TIMING — hier justieren wir gemeinsam ======
  const STANDZEIT     = 5200; // wie lange eine Ansicht steht (ms)
  const FAHNE_KOMMT   =  500; // erste Fahne erscheint so lange nach dem Bildwechsel (ms)
  const FAHNE_ABSTAND =  350; // Abstand zwischen den Fahnen einer Ansicht (ms)
  // Der Bildwechsel selbst dauert 600 ms — im CSS bei .screen-slot img.
  // ===================================================

  // Je Ansicht: Ueberschrift, Bild und die Erklaer-Fahnen.
  // "y" = Hoehe der Fahne in Prozent der HANDYhoehe. Umrechnung von einer Stelle
  // im Screenshot: y = (34 + 565 * (0,208 + anteil_im_bild * 0,692)) / 621 * 100
  // (34 px Gehaeuserand oben, 565 px Bildschirm, Einblendbereich ab 20,8 %).
  // Zum Feinjustieren genuegt es, die Zahl hier zu aendern.
  const screens = [
    // Auf dem Hauptscreen stehen die Kacheln aus dem One-Pager statt der Fahnen
    // (kachel = Bild unter assets/, Text steckt im Bild, deshalb steht er als alt
    // hier). Sie sind hoeher als Fahnen; "y" ist die Mitte der Kachel und so
    // gewaehlt, dass sie sich nicht ueberlappen — die Reihenfolge entspricht der
    // der Knoepfe im Handy.
    { datei: '01-start.webp', titel: 'KoliFoX-Hauptscreen', alt: 'Startansicht der KoliFoX-App mit Suche, Dringender Anfrage, AU-Anfrage, Überweisungs-Anfrage und Meldungen für den Kreis',
      fahnen: [
        { seite: 'rechts', y: 21, kachel: 'kacheln/suche.webp',
          text: 'Suche. KI-Beschwerde-Check: Wenn deine Beschwerden noch unspezifisch sind, hilft dir die KI bei der Auswahl des richtigen Fachbereichs. Finde deine Apotheke bei über 17.000 Apotheken. Finde deine Praxis unter mehr als 58.000 gelisteten Ärzten.' },
        { seite: 'links',  y: 29, kachel: 'kacheln/akut.webp',
          text: 'Akutfall. Bekomme einfach und schnell einen Termin beim Arzt – unkompliziert bei Beschwerden.' },
        { seite: 'rechts', y: 55.5, kachel: 'kacheln/au.webp',
          text: 'Arbeitsunfähigkeit. Erhalte schnell einen Termin bei Arbeitsunfähigkeit.' },
        { seite: 'links',  y: 61, kachel: 'kacheln/ueberweisung.webp',
          text: 'Überweisung. Bekomme schnell einen Folgetermin im Rahmen einer Überweisung. Anfrage an passende Praxen im relevanten Fachbereich.' },
        { seite: 'rechts', y: 81, kachel: 'kacheln/meldungen.webp',
          text: 'Meldungen aus deiner Region. Erhalte gesundheitsrelevante Meldungen wie UV-Meldungen, Pollen, Hitze, RKI usw.' },
      ] },
    { datei: '02-suchen.webp', titel: 'KoliFoX-Suche', alt: 'Suchen-Menü mit Beschwerden-Check, Arzt- und Apothekensuche',
      fahnen: [
        { seite: 'rechts', y: 41, icon: 'icons/icon-ki.png',
          text: 'KI-Check: Welcher Facharzt passt?' },
        { seite: 'links',  y: 50, icon: 'icons/icon-arzt.png',
          text: 'Arzt in deiner Nähe (GPS)' },
        { seite: 'rechts', y: 57, icon: 'icons/icon-apotheke.png',
          text: 'Apotheke in deiner Nähe (GPS)' },
      ] },
    { datei: '03-dringend.webp', titel: 'Dringende Anfrage', alt: 'Dringende Anfrage mit Regionsauswahl',
      fahnen: [
        { seite: 'links',  y: 38, text: 'Region wählen' },
        { seite: 'rechts', y: 66, text: 'Ausfüllen & Absenden – ohne Anrufen' },
        { seite: 'links',  y: 74, text: 'Wird automatisch gelöscht', leise: true },
      ] },
    { datei: '04-anfrage-laeuft.webp', titel: 'Anfrage läuft', alt: 'Abgeschickte Anfrage an mehrere Praxen',
      fahnen: [
        // Hoehen von Matthias am Bild abgenommen: die rote Zeile "Bitte bleiben
        // Sie erreichbar!" liegt bei 63 %, der blaue Weiterleitungs-Hinweis bei 81 %.
        { seite: 'rechts', y: 63, text: 'Bitte erreichbar bleiben' },
        { seite: 'links',  y: 81, text: 'Deine Anfrage ist bei den Praxen' },
      ] },
    // Verfalls-Anzeige, Protokoll und die Hinweise stehen erst in dieser Ansicht
    { datei: '05-anfrage-detail.webp', titel: 'Weitergeleitet', alt: 'Weitergeleitete Anfrage mit Protokoll',
      fahnen: [
        { seite: 'links',  y: 43, text: 'Kann die erste Praxis nicht, geht es automatisch weiter' },
        // Verfalls-Pille und Protokoll-Knopf stehen in derselben Zeile, deshalb
        // eine gemeinsame Fahne mit zwei Zeilen statt zweier Fahnen uebereinander.
        { seite: 'rechts', y: 52, zeilen: [
            'Lade dein Protokoll herunter',
            'Ohne Antwort verfällt die Anfrage automatisch' ] },
        { seite: 'rechts', y: 66, text: 'Unterlagen vorab vorbereiten' },
      ] },
  ];

  screens.forEach((s, i) => {
    const img = document.createElement('img');
    img.src = '/assets/screens/handy-serie/' + s.datei;
    img.alt = s.alt;
    if (i === 0) img.className = 'aktiv';
    if (i > 0) img.loading = 'lazy';   // erste Ansicht sofort, Rest bei Bedarf
    slot.appendChild(img);
  });

  const bilder = [...slot.querySelectorAll('img')];
  const titel  = document.getElementById('tour-ueberschrift');
  // Links vom Handy steht der Hero-Text, deshalb gibt es derzeit nur die rechte
  // Spalte. Faellt eine Fahne auf "links", landet sie ebenfalls rechts.
  const rechts = document.getElementById('fahnen-rechts');
  const spalte = { links: document.getElementById('fahnen-links') || rechts, rechts };
  const punkte = document.getElementById('tour-punkte');

  let i = 0, laeuft = true, uhr = null;
  const timer = [];
  const merken = (fn, ms) => { timer.push(setTimeout(fn, ms)); };
  const aufraeumen = () => { while (timer.length) clearTimeout(timer.pop()); };

  // Wechsel-Punkte unter dem Handy
  screens.forEach((s, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', s.titel);
    b.addEventListener('click', () => { zeigen(n); neuStarten(); });
    punkte.appendChild(b);
  });

  function fahnenSetzen(s) {
    // Kacheln sind unterschiedlich hoch und wachsen mit der Spaltenbreite: sie werden
    // deshalb untereinander gestapelt statt auf eine feste Hoehe gesetzt (siehe CSS .kacheln).
    ['links', 'rechts'].forEach(seite =>
      spalte[seite].classList.toggle('kacheln', s.fahnen.some(f => f.kachel && f.seite === seite)));
    spalte.links.innerHTML = '';
    if (spalte.rechts !== spalte.links) spalte.rechts.innerHTML = '';
    s.fahnen.forEach((f, n) => {
      const el = document.createElement('div');
      el.className = 'fahne' + (f.leise ? ' leise' : '') + (f.kachel ? ' kachel' : '');
      el.style.top = f.y + '%';
      if (f.kachel) {
        const bild = document.createElement('img');
        bild.src = '/assets/' + f.kachel;
        bild.alt = f.text;
        el.appendChild(bild);
        spalte[f.seite].appendChild(el);
        merken(() => el.classList.add('sichtbar'), FAHNE_KOMMT + n * FAHNE_ABSTAND);
        return;
      }
      if (f.icon) {
        const bild = document.createElement('img');
        bild.src = '/assets/' + f.icon;
        bild.alt = '';
        el.appendChild(bild);
      }
      if (f.zeilen) {
        // mehrzeilige Fahne: erste Zeile fuehrend, die weiteren etwas leiser
        const block = document.createElement('span');
        f.zeilen.forEach((z, n) => {
          const zeile = document.createElement('span');
          zeile.className = n === 0 ? 'fahne-zeile' : 'fahne-zeile leise';
          zeile.textContent = z;
          block.appendChild(zeile);
        });
        el.appendChild(block);
      } else {
        el.appendChild(document.createTextNode(f.text));
      }
      spalte[f.seite].appendChild(el);
      // versetzt einblenden, damit der Blick mitgeht
      merken(() => el.classList.add('sichtbar'), FAHNE_KOMMT + n * FAHNE_ABSTAND);
    });
  }

  function zeigen(n) {
    aufraeumen();
    bilder[i].classList.remove('aktiv');
    i = n;
    bilder[i].classList.add('aktiv');
    titel.textContent = screens[i].titel;
    fahnenSetzen(screens[i]);
    [...punkte.children].forEach((b, k) =>
      b.setAttribute('aria-current', k === i ? 'true' : 'false'));
  }

  function weiter() { if (laeuft && bilder.length > 1) zeigen((i + 1) % bilder.length); }
  function starten() { if (!uhr) uhr = setInterval(weiter, STANDZEIT); }
  function stoppen() { clearInterval(uhr); uhr = null; }
  function neuStarten() { stoppen(); starten(); }

  zeigen(0);
  starten();

  // Anhalten, solange das Handy nicht zu sehen ist
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(e => { laeuft = e[0].isIntersecting; }, { threshold: .2 }).observe(slot);
  }
  // und beim Darauffahren, damit man in Ruhe hinsehen kann
  const phone = slot.closest('.phone');
  if (phone) {
    phone.addEventListener('mouseenter', () => { laeuft = false; });
    phone.addEventListener('mouseleave', () => { laeuft = true; });
  }
  document.addEventListener('visibilitychange', () => document.hidden ? stoppen() : starten());
})();

// ---- Fachbereichs-Siegel im Laufband (zweifach fuer den Endlos-Effekt) ----
(function () {
  var siegel = ['allgemeinmedizin','innere-kardiologie','paediatrie','zahnmedizin','hno',
    'augenheilkunde','dermatologie','orthopaedie','frauenheilkunde','neurologie','urologie',
    'radiologie','psychiatrie','innere-gastroenterologie','anaesthesiologie','mkg-chirurgie'];
  ['band-pat','band-pra'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var html = '';
    for (var runde = 0; runde < 2; runde++) {
      siegel.forEach(function (name) {
        html += '<img src="/assets/fach/' + name + '.png" alt="" loading="lazy">';
      });
    }
    el.innerHTML = html;
  });
})();
