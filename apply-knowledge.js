(function () {
  function get(obj, path) {
    if (!obj || !path) return null;
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return null;
      var key = parts[i];
      if (Array.isArray(cur) && /^\d+$/.test(key)) {
        cur = cur[Number(key)];
      } else {
        cur = cur[key];
      }
    }
    return cur;
  }

  function setText(el, text) {
    if (el == null || text == null) return;
    el.textContent = String(text);
  }

  function buildClaimMailto(kb) {
    var email = kb.contact && kb.contact.email;
    var sub = (kb.cta && kb.cta.mailtoSubject) || 'Free Trial Request';
    if (!email) return '#contact';
    return 'mailto:' + email + '?subject=' + encodeURIComponent(sub);
  }

  function applyMailtoLinks(kb) {
    document.querySelectorAll('[data-apply-mailto]').forEach(function (a) {
      a.setAttribute('href', buildClaimMailto(kb));
    });
  }

  function applyHrefKb(kb) {
    document.querySelectorAll('[data-href-kb]').forEach(function (el) {
      var path = el.getAttribute('data-href-kb');
      var val = get(kb, path);
      if (val) el.setAttribute('href', val);
    });
  }

  function applyLists(kb) {
    document.querySelectorAll('[data-kb-ul]').forEach(function (ul) {
      var path = ul.getAttribute('data-kb-ul');
      var arr = get(kb, path);
      if (!Array.isArray(arr)) return;
      ul.innerHTML = '';
      arr.forEach(function (text) {
        var li = document.createElement('li');
        li.textContent = text;
        ul.appendChild(li);
      });
    });
  }

  function applyDataKb(kb) {
    document.querySelectorAll('[data-kb]').forEach(function (el) {
      var path = el.getAttribute('data-kb');
      if (!path) return;
      var val = get(kb, path);
      if (val == null || typeof val === 'object') return;
      el.textContent = val;
      if (el.classList.contains('featured-badge')) {
        el.style.display = String(val).trim() ? '' : 'none';
      }
    });
  }

  function bindContactHrefs(kb) {
    if (!kb.contact) return;
    document.querySelectorAll('[data-bind-mailto]').forEach(function (a) {
      a.setAttribute('href', 'mailto:' + kb.contact.email);
    });
    document.querySelectorAll('[data-bind-tel]').forEach(function (a) {
      if (kb.contact.phoneTel) a.setAttribute('href', kb.contact.phoneTel);
    });
  }

  function applyKnowledge(kb) {
    if (!kb) return;
    if (kb.meta && kb.meta.pageTitle) {
      document.title = kb.meta.pageTitle;
    }
    applyDataKb(kb);
    applyLists(kb);
    applyMailtoLinks(kb);
    applyHrefKb(kb);
    bindContactHrefs(kb);
  }

  window.profastApplyKnowledge = applyKnowledge;

  fetch('./knowledge.json', { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('knowledge.json HTTP ' + r.status);
      return r.json();
    })
    .then(function (kb) {
      window.__PROFAST_KB__ = kb;
      applyKnowledge(kb);
      window.dispatchEvent(new CustomEvent('profat:kb', { detail: kb }));
    })
    .catch(function (err) {
      console.warn('Pro Fast AI: could not load knowledge.json', err);
    });
})();
