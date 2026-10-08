/* manadens_flash.js
   "Månadens flash": en kort nyhet om månadens elanvändning på index.html.

   SKAPAD 2026-10-09 (version 1.0). Ingen ES2023-funktionalitet används (vanlig ES5/ES2015: var, function, addEventListener).

   Vad som händer:
     1. En liten ruta (toast) visas uppe i högra hörnet med rubrik och nyckelsiffra, cirka 0,7 sekunder efter att sidan öppnats.
        Den försvinner av sig själv efter VISNINGSTID (8 sekunder). Håller besökaren musen över rutan (eller har tangentbordsfokus i den)
        står den kvar, och när besökaren släpper den får den EFTER_PAUS (4 sekunder) till. Den har också ett kryss.
     2. Rutan visas bara en gång per besökare och flash (webbläsaren minns det i localStorage). Lägg ?flash=1 efter adressen
        (index.html?flash=1) för att visa den igen, t.ex. vid test.
     3. En knapp "Månadens flash" i menyraden öppnar ett fönster med hela texten och ett arkiv över tidigare månader.
        Knappen har en "Ny"-markering tills besökaren har öppnat den senaste flashen.
     4. Texterna ligger i manadens_flash_data.js (window.MANADENS_FLASH, nyaste först).

   Tillgänglighet: rutan har role="status" (läses upp utan att ta fokus), kan stängas med kryss, pausas av musen eller fokus,
   och animeras inte om besökaren valt "minska rörelse" (se CSS). Fönstret har role="dialog", kan stängas med Escape och fokus
   flyttas dit när det öppnas och tillbaka när det stängs.
*/
(function () {
  'use strict';

  var DATA = window.MANADENS_FLASH || [];
  if (!DATA.length) { return; }                       // inga flashar: gör ingenting
  var NYASTE = DATA[0];                               // nyaste först

  var NYCKEL_SETT = 'bjerredFlashSett';               // senaste flash-id som visats som ruta
  var NYCKEL_OPPNAD = 'bjerredFlashOppnad';           // senaste flash-id vars fönster öppnats
  var VISNINGSTID = 8000;                             // ms som rutan visas
  var EFTER_PAUS = 4000;                              // ms kvar efter att musen eller fokus lämnat rutan
  var DROJSMAL = 700;                                 // ms innan rutan visas

  // ---- Hjälpfunktioner ----
  // localStorage kan vara blockerat (t.ex. privat läge). Då fungerar sidan ändå, men flashen visas vid varje besök.
  function lasLagring(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function skrivLagring(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignoreras */ } }
  // Skapar ett element. Texten sätts med textContent, så inget i datafilen tolkas som HTML.
  function ny(tag, klass, text) {
    var e = document.createElement(tag);
    if (klass) { e.className = klass; }
    if (text !== undefined) { e.textContent = text; }
    return e;
  }

  var modal = null, stangModal = null, knapp = null, badge = null, toast = null, timer = null;
  var modalOppen = false, fokusFore = null;

  // ---- Ett kort med en månads flash (används i fönstret, både för senaste och för arkivet) ----
  function byggKort(e) {
    var kort = ny('div', 'flash-kort');
    kort.appendChild(ny('div', 'flash-manad', e.manad));
    kort.appendChild(ny('h3', 'flash-rubrik', e.rubrik));
    kort.appendChild(ny('p', 'flash-nyckel', e.nyckelrad));
    (e.text || []).forEach(function (stycke) { kort.appendChild(ny('p', null, stycke)); });
    if (e.lar) {
      var lar = ny('div', 'flash-lar');
      lar.appendChild(ny('strong', null, 'Bra att veta: '));
      lar.appendChild(document.createTextNode(e.lar));
      kort.appendChild(lar);
    }
    if (e.lank) {
      var p = ny('p');
      var a = ny('a', null, e.lank.text + ' →');
      a.href = e.lank.href;
      p.appendChild(a);
      kort.appendChild(p);
    }
    if (e.kalla) { kort.appendChild(ny('p', 'flash-kalla', 'Källa: ' + e.kalla)); }
    return kort;
  }

  // ---- Fönstret ----
  function byggModal() {
    modal = ny('div', 'modal');                       // ".modal" finns i index.html och ger bakgrund + Escape/klick utanför
    modal.id = 'flashModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'flashModalRubrik');
    var innehall = ny('div', 'modal-content flash-modal');
    stangModal = ny('button', 'close', '×');
    stangModal.type = 'button';
    stangModal.setAttribute('aria-label', 'Stäng');
    stangModal.addEventListener('click', dolj_modal);
    innehall.appendChild(stangModal);
    var h2 = ny('h2', null, '💡 Månadens flash');
    h2.id = 'flashModalRubrik';
    innehall.appendChild(h2);
    innehall.appendChild(byggKort(NYASTE));
    if (DATA.length > 1) {
      var tidigare = ny('div', 'flash-tidigare');
      tidigare.appendChild(ny('h3', null, 'Tidigare månader'));
      DATA.slice(1).forEach(function (e) {
        var d = ny('details');
        d.appendChild(ny('summary', null, e.manad + ': ' + e.rubrik));
        d.appendChild(byggKort(e));
        tidigare.appendChild(d);
      });
      innehall.appendChild(tidigare);
    }
    modal.appendChild(innehall);
    // Klick på bakgrunden stänger (index.html gör det också; här säkerställer vi att fokus återställs)
    modal.addEventListener('click', function (ev) { if (ev.target === modal) { dolj_modal(); } });
    document.body.appendChild(modal);
  }

  function visa_modal() {
    dolj_toast();
    fokusFore = document.activeElement;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';           // samma som openModal() i index.html
    modalOppen = true;
    skrivLagring(NYCKEL_OPPNAD, NYASTE.id);
    if (badge && badge.parentNode) { badge.parentNode.removeChild(badge); }
    stangModal.focus();
  }

  function dolj_modal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    modalOppen = false;
    if (fokusFore && fokusFore.focus) { fokusFore.focus(); }
  }

  // ---- Knappen i menyraden ----
  function byggKnapp() {
    var lankar = document.querySelector('.nav-links');
    if (!lankar) { return; }
    knapp = ny('a', null, '💡 Månadens flash');         // ".nav-bar a" i index.html ger samma utseende som övriga länkar
    knapp.href = '#manadens-flash';
    knapp.setAttribute('role', 'button');
    if (lasLagring(NYCKEL_OPPNAD) !== NYASTE.id) {
      badge = ny('span', 'flash-ny', 'Ny');
      knapp.appendChild(document.createTextNode(' '));
      knapp.appendChild(badge);
    }
    knapp.addEventListener('click', function (ev) { ev.preventDefault(); visa_modal(); });
    lankar.insertBefore(knapp, lankar.firstChild);
  }

  // ---- Den lilla rutan ----
  function starta_timer(ms) { stoppa_timer(); timer = setTimeout(dolj_toast, ms); }
  function stoppa_timer() { if (timer) { clearTimeout(timer); timer = null; } }

  function dolj_toast() {
    stoppa_timer();
    if (!toast) { return; }
    var t = toast;
    toast = null;
    t.classList.remove('flash-synlig');
    setTimeout(function () { if (t.parentNode) { t.parentNode.removeChild(t); } }, 450);   // efter att toningen är klar
  }

  function visa_toast() {
    toast = ny('div', 'flash-toast');
    toast.setAttribute('role', 'status');              // uppläsning utan att ta fokus
    toast.appendChild(ny('span', 'flash-etikett', '💡 Månadens flash · ' + NYASTE.manad));
    toast.appendChild(ny('strong', 'flash-rubrik', NYASTE.rubrik));
    toast.appendChild(ny('p', 'flash-nyckel', NYASTE.nyckelrad));
    var lasmer = ny('button', 'flash-lasmer', 'Läs mer');
    lasmer.type = 'button';
    lasmer.addEventListener('click', visa_modal);
    var stang = ny('button', 'flash-stang', '×');
    stang.type = 'button';
    stang.setAttribute('aria-label', 'Stäng meddelandet');
    stang.addEventListener('click', dolj_toast);
    toast.appendChild(lasmer);
    toast.appendChild(stang);
    // Pausa medan besökaren har musen över rutan eller fokus i den
    toast.addEventListener('mouseenter', stoppa_timer);
    toast.addEventListener('mouseleave', function () { starta_timer(EFTER_PAUS); });
    toast.addEventListener('focusin', stoppa_timer);
    toast.addEventListener('focusout', function () { starta_timer(EFTER_PAUS); });
    document.body.appendChild(toast);
    // Ett varv i väntan så att toningen hinner starta
    setTimeout(function () { if (toast) { toast.classList.add('flash-synlig'); } }, 30);
    skrivLagring(NYCKEL_SETT, NYASTE.id);
    starta_timer(VISNINGSTID);
  }

  // ---- Start ----
  function starta() {
    byggModal();
    byggKnapp();
    var tvinga = window.location.search.indexOf('flash=1') !== -1;       // ?flash=1 visar rutan igen
    if (tvinga || lasLagring(NYCKEL_SETT) !== NYASTE.id) {
      setTimeout(visa_toast, DROJSMAL);
    }
    // Escape: index.html stänger redan alla ".modal", men fokus ska också tillbaka dit besökaren var
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && modalOppen) { dolj_modal(); }
    });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', starta); } else { starta(); }
})();
