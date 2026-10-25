// voicley.com: the live dictation demo at the top of the page. Browser speech
// recognition (Chrome, Edge, Safari); a typing fallback elsewhere. Stores
// nothing. Teaches the app's own command, "new dictation".
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  // The app's command is "new dictation" ("next dictation" too). The old
  // "new note" still works in the app, so it works here, untaught.
  const NEW_NOTE = /\b(?:(?:new|next) dictation|new note)\b[.,!?]?/i;

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const PH = 'Press Dictate, say an idea, then say “new dictation” and say the next one.';

  function build() {
    const root = el('div', 'vdemo');
    root.setAttribute('aria-label', 'Try Voicley: a live dictation demo');
    const top = el('div', 'vtop');
    top.append(el('b', '', 'Try it right here'));
    const status = el('div', 'vstatus', SR ? 'Press Dictate and talk' : 'Type a thought, press Enter');
    top.append(status);
    root.append(top);

    let box;
    if (SR) {
      box = el('div', 'vbox', '<span class="vph">' + PH + '</span>');
      box.setAttribute('aria-live', 'polite');
    } else {
      box = el('textarea', 'vbox');
      box.placeholder = 'Type an idea. Press Enter and it becomes its own dictation.';
      box.rows = 3;
    }
    root.append(box);

    const row = el('div', 'vrow');
    const dict = el('button', 'vdict', 'Dictate');
    const nb = el('button', 'vnew', 'New dictation');
    if (SR) row.append(dict);
    row.append(nb);
    root.append(row);

    const count = el('div', 'vcount', 'No dictations yet');
    const list = el('div', 'vlist');
    root.append(count, list);
    root.append(el('div', 'vfine', SR
      ? 'Demo only: it uses your browser’s speech recognition (in Chrome, Google turns the audio into text). Nothing is saved. The Voicley app is faster and more accurate, and it writes the titles with AI.'
      : 'Demo only: your browser has no speech recognition, so this one is typed. Nothing is saved. In the Voicley app you just talk.'));

    let notes = 0, current = '', interim = '', listening = false, rec = null;

    function render() {
      if (!SR) return;
      if (!current && !interim) {
        box.innerHTML = '<span class="vph">' + (listening ? 'Listening… say an idea.' : PH) + '</span>';
      } else {
        box.innerHTML = esc(cap(current)) + (interim ? ' <span class="vint">' + esc(interim) + '</span>' : '');
      }
    }
    function closeNote() {
      const text = (SR ? current : box.value).trim().replace(/\s+/g, ' ');
      if (!text) return;
      notes++;
      const words = text.split(' ');
      const title = cap(words.slice(0, 5).join(' ').replace(/[.,!?]$/, '')) + (words.length > 5 ? '…' : '');
      const card = el('div', 'vcard');
      card.append(el('div', 'vt', esc(title)), el('div', 'vb', esc(cap(text))));
      list.prepend(card);
      count.textContent = notes === 1 ? '1 dictation, its own place' : notes + ' dictations, each its own place';
      if (SR) { current = ''; render(); } else { box.value = ''; }
    }
    // Every spoken "new note" closes the note so far and starts the next one.
    function add(text) {
      let rest = text;
      let m;
      while ((m = NEW_NOTE.exec(rest))) {
        current = (current + ' ' + rest.slice(0, m.index)).trim();
        closeNote();
        rest = rest.slice(m.index + m[0].length);
      }
      current = (current + ' ' + rest).trim();
    }
    function setLive(on) {
      listening = on;
      dict.textContent = on ? 'Stop' : 'Dictate';
      dict.classList.toggle('live', on);
      box.classList.toggle('live', on);
      status.classList.toggle('live', on);
      status.textContent = on ? '● Listening · say “new dictation” between ideas' : 'Press Dictate and talk';
      render();
    }

    if (SR) {
      dict.onclick = () => {
        if (listening) {
          setLive(false);
          try { if (rec) rec.stop(); } catch (e) {}
          return;
        }
        rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = navigator.language || 'en-US';
        rec.onresult = (ev) => {
          interim = '';
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const t = ev.results[i][0].transcript;
            if (ev.results[i].isFinal) add(t); else interim += t;
          }
          render();
        };
        rec.onerror = (ev) => {
          if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
            setLive(false);
            status.textContent = 'The microphone is blocked. Allow it in the address bar to try the demo.';
          }
        };
        // Chrome ends a session after a pause; keep listening until Stop.
        rec.onend = () => {
          if (listening) {
            try { rec.start(); } catch (e) { setLive(false); }
          } else { interim = ''; render(); }
        };
        try { rec.start(); setLive(true); } catch (e) { status.textContent = 'Could not start the microphone.'; }
      };
      nb.onclick = () => { current = (current + ' ' + interim).trim(); interim = ''; closeNote(); };
    } else {
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); closeNote(); }
      });
      nb.onclick = closeNote;
    }
    // For testing without a microphone: window.VoicleyDemo.say('text').
    root._say = (t) => { add(t); render(); };
    return root;
  }

  // voicley.com: the box fills <div id="vdemo"> in the hero (Roger,
  // 2026-10-25: "Put option H live ... with the dictation box").
  // window.VoicleyDemo.say('text') tests the "new dictation" split without a
  // microphone.
  window.VoicleyDemo = {
    mount() {
      const spot = document.getElementById('vdemo');
      if (!spot) return;
      const demo = build();
      spot.replaceWith(demo);
      this.say = demo._say;
    },
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.VoicleyDemo.mount());
  } else {
    window.VoicleyDemo.mount();
  }
})();
