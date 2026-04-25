(function () {
  var CHAT_ID = 'pfai-chatbot';
  if (document.getElementById(CHAT_ID)) return;

  var state = {
    open: false,
    greeted: false,
    mode: 'normal',
    lead: {
      name: '',
      business: '',
      email: '',
      phone: '',
      volume: ''
    },
    transcript: [],
    apiHistory: []
  };

  function pfaiChatApiUrl() {
    try {
      return new URL('api/chat', document.baseURI || window.location.href).href;
    } catch (e) {
      return '/api/chat';
    }
  }

  var contactEmail = 'profastai@gmail.com';
  var SITE = null;

  function findFeature(tier, needle) {
    var list = (tier && tier.features) || [];
    var n = (needle || '').toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i]).toLowerCase().indexOf(n) >= 0) return list[i];
    }
    return '';
  }

  function buildSite(kb) {
    if (!kb) return null;
    var h = kb.hero || {};
    var stats = h.stats || [];
    var heroLines = stats.map(function (s) {
      return '• ' + s.num + ' — ' + s.label;
    });
    var heroStats = 'From the hero stats on this page:\n' + heroLines.join('\n');

    var offer =
      'From this page: Pro Fast AI is an AI assistant for Orange County service businesses. Headline promise: "' +
      h.h1Line1 +
      ' ' +
      h.h1Em +
      '." ' +
      h.subtitle;

    var p = kb.problem || {};
    var painSummaries = (p.cards || []).map(function (c) {
      return c.title.toLowerCase().replace(/\.$/, '');
    });
    var problem =
      'From "The Problem" section: clients reach out but nobody answers fast enough. The page lists four pains: ' +
      painSummaries.join('; ') +
      ', in line with the cards on this page.';

    var hiw = kb.howItWorks || {};
    var steps = hiw.steps || [];
    var howLines = steps.map(function (s, i) {
      return i + 1 + ') ' + s.title + ': ' + s.body;
    });
    var howItWorks = 'From "How It Works" — live on your site in ' + hiw.h2Em + ':\n' + howLines.join('\n');

    var step3 = steps[2] && steps[2].body;
    var platforms = step3
      ? 'From step 3 on this page: ' + step3
      : 'From step 3 on this page: installation is one line of code. It works on Wix, Squarespace, WordPress, or any platform.';

    var demo = kb.demo || {};
    var disclaimerFull =
      demo.disclaimerParts && demo.disclaimerParts.length
        ? demo.disclaimerParts.join('')
        : 'The live demo below is a really basic bot — currently shown as a restaurant-style example. Your production bot is trained for your own business and industry.';
    var demoStr =
      'From the Live Demo section: you can try the chat in that section on this page. The on-page disclaimer reads: ' +
      disclaimerFull +
      ' Use "See It Live" in the hero or scroll to #demo.';

    var tiers = (kb.pricing && kb.pricing.tiers) || [];
    var pricingBlocks = tiers.map(function (t) {
      var setupPlain = String(t.setup || '').replace(/^\+\s*/, '');
      var tierLabel = t.badge ? t.name + ' (' + t.badge + ')' : t.name;
      return (
        tierLabel +
        ' — ' +
        t.priceAmount +
        t.priceSuffix +
        ' + ' +
        setupPlain +
        '. Includes: ' +
        (t.features || []).join('; ') +
        '.'
      );
    });
    var pricingAll = 'From the Pricing section — same numbers as on this page:\n\n' + pricingBlocks.join('\n\n');

    var trial =
      'From the page: 30 days free, no credit card. If you do not love it, you owe nothing. CTA: we set up a custom AI assistant for your business free for 30 days.';

    var support =
      'Taken from the plan bullets on this page: Starter includes email support. Standard adds priority email support. Pro adds priority phone and email support.';

    var c = kb.contact || {};
    var contact =
      'From the footer and CTA on this page:\n• Email: ' +
      (c.email || '') +
      '\n• Phone: ' +
      (c.phoneDisplay || '') +
      '\n• ' +
      (c.region || '') +
      '\n• Portfolio link is in the site footer.';

    var test = kb.testimonials || {};
    var roles = (test.items || []).map(function (it) {
      var r = it.role || '';
      var parts = r.split('—');
      return parts.length > 1 ? parts[parts.length - 1].trim() : r;
    });
    var testimonials =
      'The testimonials block is titled "' +
      test.h2Line1 +
      ' ' +
      test.h2Em +
      '" and shows three hospitality examples (' +
      roles.join(', ') +
      '). ' +
      (test.footnote || '');

    var help =
      'I only answer from what is on this Pro Fast AI page. Try asking about: what we do, hero stats, the problem we solve, how it works, the live demo (basic bot / restaurant-style example), pricing (Starter / Standard / Pro), the 30-day trial, support by plan, or contact details. Say "start free trial" when you want us to collect your info for a follow-up.';

    var st = tiers[1];
    var calendlyBooking = st
      ? 'From the Standard plan on this page: ' +
        [findFeature(st, 'appointment'), findFeature(st, 'lead'), findFeature(st, 'calendly'), findFeature(st, 'report'), findFeature(st, 'support')]
          .filter(Boolean)
          .join('; ') +
        '.'
      : 'From the Standard plan on this page: appointment & booking integration, Calendly / booking calendar sync, and lead capture (name, email, phone). Weekly conversation report and priority email support are also listed for Standard.';

    var starter = tiers[0];
    var proT = tiers[2];
    var qrLine = findFeature(starter, 'qr');
    var qrPro = findFeature(proT, 'qr');
    var qrCodes =
      'From this page: ' +
      (qrLine || 'Starter includes a QR code for print materials.') +
      ' ' +
      (qrPro || 'Pro includes QR codes for lobby, tables & marketing.');

    return {
      offer: offer,
      heroStats: heroStats,
      problem: problem,
      howItWorks: howItWorks,
      platforms: platforms,
      demo: demoStr,
      pricingAll: pricingAll,
      trial: trial,
      support: support,
      contact: contact,
      testimonials: testimonials,
      help: help,
      calendlyBooking: calendlyBooking,
      qrCodes: qrCodes
    };
  }

  var FALLBACK_SITE = {
    offer:
      'From this page: Pro Fast AI is an AI assistant for Orange County service businesses. Headline promise: "Never Miss a Client Again." It answers inquiries 24/7, qualifies leads, books appointments, and captures revenue automatically — fast replies, fewer missed opportunities.',
    heroStats:
      'From the hero stats on this page:\n• 24/7 — Always answering\n• $0 — To get started\n• 2hr — Setup time\n• 80%+ — Questions handled',
    problem:
      'From "The Problem" section: clients reach out but nobody answers fast enough. The page lists four pains: missed calls after hours; the same questions every day (hours, pricing, insurance, services, parking); bookings that never happen without a simple path; and lost leads every night when messages go unanswered.',
    howItWorks:
      'From "How It Works" — live on your site in 48 hours:\n1) You share business info: services, hours, location, FAQs, booking policy, and what the bot should qualify. A 15-minute call or a quick email.\n2) We build your custom bot — trained on your business, in your tone.\n3) One line of code on your site — works on Wix, Squarespace, WordPress, or any platform; no technical knowledge needed.\n4) It works while you sleep — clients can chat and book at 2am; you wake up to leads and bookings in inbox or calendar.',
    platforms:
      'From step 3 on this page: installation is one line of code. It works on Wix, Squarespace, WordPress, or any platform. You do not need technical knowledge on your end.',
    demo:
      'From the Live Demo section: you can try the chat in that section on this page. The on-page disclaimer reads: The live demo below is a really basic bot — currently shown as a restaurant-style example. Your production bot is trained for your own business and industry. Use "See It Live" in the hero or scroll to #demo.',
    pricingAll:
      'From the Pricing section — same numbers as on this page:\n\nStarter — $49/mo + $149 one-time setup. Includes: FAQ bot on your services & info; hours, location & contact; embed on your site; QR for print materials; email support.\n\nStandard (Most Popular) — $99/mo + $249 setup. Everything in Starter, plus appointment & booking integration; lead capture (name, email, phone); Calendly / booking calendar sync; weekly conversation report; priority email support.\n\nPro — $199/mo + $399 setup. Everything in Standard, plus monthly chatbot optimization; custom branding & tone; QR codes for lobby, tables & marketing; monthly performance report; priority phone & email support.',
    trial:
      'From the page: 30 days free, no credit card. If you do not love it, you owe nothing. CTA: we set up a custom AI assistant for your business free for 30 days.',
    support:
      'Taken from the plan bullets on this page: Starter includes email support. Standard adds priority email support. Pro adds priority phone and email support.',
    contact:
      'From the footer and CTA on this page:\n• Email: profastai@gmail.com\n• Phone: +1 (424) 206-8097\n• Serving Orange County, CA\n• Portfolio link is in the site footer.',
    testimonials:
      'The testimonials block is titled "Real results for real businesses" and shows three hospitality examples (Irvine, Newport Beach, Mission Viejo). The page also notes to replace with real testimonials when you have them.',
    help:
      'I only answer from what is on this Pro Fast AI page. Try asking about: what we do, hero stats, the problem we solve, how it works, the live demo (basic bot / restaurant-style example), pricing (Starter / Standard / Pro), the 30-day trial, support by plan, or contact details. Say "start free trial" when you want us to collect your info for a follow-up.',
    calendlyBooking:
      'From the Standard plan on this page: appointment & booking integration, Calendly / booking calendar sync, and lead capture (name, email, phone). Weekly conversation report and priority email support are also listed for Standard.',
    qrCodes:
      'From this page: Starter includes a QR code for print materials. Pro includes QR codes for lobby, tables & marketing.'
  };

  function buildPfaiSystemPrompt(site) {
    var s = site || FALLBACK_SITE;
    var full = [
      'You are the Pro Fast AI assistant on the Pro Fast AI marketing website.',
      'Answer using ONLY the knowledge block below. Do not invent prices, features, or contact details.',
      'If something is not in the knowledge, say you do not have that on this page and suggest what you can help with (offer, pricing, trial, contact).',
      'Be concise (about 2–6 sentences unless the visitor asks for more). Professional, warm tone.',
      '',
      'PAGE KNOWLEDGE:',
      '---',
      'OFFER / WHAT WE DO:\n' + s.offer,
      '\nHERO STATS:\n' + s.heroStats,
      '\nPROBLEM:\n' + s.problem,
      '\nHOW IT WORKS:\n' + s.howItWorks,
      '\nPLATFORMS / INSTALL:\n' + s.platforms,
      '\nLIVE DEMO:\n' + s.demo,
      '\nPRICING:\n' + s.pricingAll,
      '\nTRIAL:\n' + s.trial,
      '\nSUPPORT:\n' + s.support,
      '\nCONTACT:\n' + s.contact,
      '\nTESTIMONIALS:\n' + s.testimonials,
      '\nBOOKING / CALENDAR (Standard):\n' + s.calendlyBooking,
      '\nQR CODES:\n' + s.qrCodes
    ].join('\n');
    var maxLen = 10000;
    if (full.length > maxLen) {
      return full.slice(0, maxLen) + '\n\n[Page context truncated for the AI request size limit.]';
    }
    return full;
  }

  function setPfaiFormLoading(loading) {
    var input = document.getElementById('pfai-input');
    var send = document.getElementById('pfai-send');
    if (input) input.disabled = !!loading;
    if (send) send.disabled = !!loading;
  }

  function sendPfaiApi(messagesEl, userText) {
    var trimmed = (userText || '').trim();
    var lower = trimmed.toLowerCase();
    state.apiHistory.push({ role: 'user', content: trimmed });

    var payloadMessages =
      state.apiHistory.length > 24 ? state.apiHistory.slice(-24) : state.apiHistory;

    setPfaiFormLoading(true);

    fetch(pfaiChatApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: payloadMessages,
        systemPrompt: buildPfaiSystemPrompt(SITE)
      })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error((data && data.error) || 'request failed');
          return data;
        });
      })
      .then(function (data) {
        var reply = data && data.reply;
        if (!reply || !String(reply).trim()) throw new Error('empty reply');
        addMessage(messagesEl, 'bot', String(reply).trim());
        state.apiHistory.push({ role: 'assistant', content: String(reply).trim() });
      })
      .catch(function () {
        var ans = replyFromKnowledge(lower);
        var out = ans || SITE.help;
        var fallbackMsg =
          'Live AI is unavailable (check your connection, Vercel OPENAI_API_KEY, and redeploy). Page-based answer:\n\n' +
          out;
        addMessage(messagesEl, 'bot', fallbackMsg);
        state.apiHistory.push({ role: 'assistant', content: fallbackMsg });
      })
      .then(function () {
        setPfaiFormLoading(false);
      });
  }

  function wantsLeadCapture(lower) {
    if (lower.includes('demo') || lower.includes('see it live') || lower.includes('#demo')) return false;
    return (
      lower.includes('start free trial') ||
      lower.includes('start my free trial') ||
      lower.includes('claim your free trial') ||
      lower.includes('claim my free trial') ||
      lower.includes('free trial request') ||
      (lower.includes('free trial') && (lower.includes('want') || lower.includes('sign') || lower.includes('start'))) ||
      lower.includes('sign up') ||
      lower.includes('sign me up') ||
      lower.includes('collect my info') ||
      lower.includes('book a 10') ||
      lower.includes('10-min call') ||
      lower.includes('10 min call')
    );
  }

  function replyFromKnowledge(lower) {
    if (
      lower.includes('hello') ||
      lower.includes('hi ') ||
      lower === 'hi' ||
      lower.includes('hey')
    ) {
      return SITE.offer + '\n\n' + SITE.help;
    }

    if (
      lower.includes('demo') ||
      lower.includes('see it live') ||
      lower.includes('try it yourself') ||
      lower.includes('live demo')
    ) {
      return SITE.demo;
    }

    if (
      lower.includes('problem') ||
      lower.includes('pain') ||
      lower.includes('missed call') ||
      lower.includes('after hours') ||
      lower.includes('why do i need')
    ) {
      return SITE.problem;
    }

    if (
      lower.includes('how it work') ||
      lower.includes('process') ||
      lower.includes('steps') ||
      lower.includes('48 hour') ||
      lower.includes('48 hours') ||
      lower.includes('setup time') ||
      lower.includes('2 hour') ||
      lower.includes('2hr')
    ) {
      return SITE.howItWorks;
    }

    if (lower.includes('wix') || lower.includes('squarespace') || lower.includes('wordpress') || lower.includes('one line')) {
      return SITE.platforms;
    }

    if (
      lower.includes('starter') ||
      (lower.includes('standard') && !lower.includes('compare')) ||
      lower.includes('most popular') ||
      lower.includes('pro plan') ||
      (/\bpro\b/.test(lower) && (lower.includes('plan') || lower.includes('tier') || lower.includes('pricing')))
    ) {
      return SITE.pricingAll;
    }

    if (lower.includes('price') || lower.includes('pricing') || lower.includes('cost') || lower.includes('how much') || lower.includes('$49') || lower.includes('$99') || lower.includes('$199')) {
      return SITE.pricingAll;
    }

    if (lower.includes('calendly') || lower.includes('calendar sync') || lower.includes('booking integration') || lower.includes('appointment') || lower.includes('reservation') || lower.includes('booking')) {
      return SITE.calendlyBooking;
    }

    if (lower.includes('qr') || lower.includes('print')) {
      return SITE.qrCodes;
    }

    if (lower.includes('profastai')) {
      return SITE.contact;
    }

    if (lower.includes('thank')) {
      return 'You are welcome. If anything on this page is unclear, ask again or use the shortcuts. Say "start free trial" when you are ready to leave your details.';
    }

    if (lower.includes('trial') || lower.includes('credit card') || lower.includes('30 day')) {
      return SITE.trial;
    }

    if (lower.includes('support') || lower.includes('priority email') || lower.includes('priority phone')) {
      return SITE.support;
    }

    if (
      lower.includes('contact') ||
      lower.includes('email') ||
      lower.includes('phone') ||
      lower.includes('call') ||
      lower.includes('portfolio') ||
      lower.includes('orange county')
    ) {
      return SITE.contact;
    }

    if (lower.includes('testimonial') || lower.includes('review') || lower.includes('clients say') || lower.includes('results')) {
      return SITE.testimonials;
    }

    if (
      lower.includes('24/7') ||
      lower.includes('80%') ||
      lower.includes('$0') ||
      lower.includes('stat')
    ) {
      return SITE.heroStats;
    }

    if (
      lower.includes('what is profast') ||
      lower.includes('what is pro fast') ||
      lower.includes('what do you do') ||
      lower.includes('who are you') ||
      lower.includes('ai assistant') ||
      lower.includes('ai receptionist')
    ) {
      return SITE.offer;
    }

    return null;
  }

  function addTranscript(role, text) {
    state.transcript.push('[' + new Date().toLocaleString() + '] ' + role + ': ' + text);
  }

  function addMessage(messagesEl, role, text) {
    var row = document.createElement('div');
    row.className = 'pfai-row ' + role;

    var bubble = document.createElement('div');
    bubble.className = 'pfai-bubble ' + role;
    bubble.textContent = text;

    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    addTranscript(role === 'bot' ? 'Assistant' : 'Visitor', text);
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function digitsOnly(value) {
    return (value || '').replace(/\D/g, '');
  }

  function startLeadFlow(messagesEl) {
    state.mode = 'lead_name';
    state.lead = { name: '', business: '', email: '', phone: '', volume: '' };
    state.apiHistory = [];
    addMessage(messagesEl, 'bot', "Great. We'll help you get started. What is your full name?");
  }

  function finishLeadFlow(messagesEl) {
    state.mode = 'normal';
    var summary = [
      'Lead captured:',
      '- Name: ' + state.lead.name,
      '- Business: ' + state.lead.business,
      '- Email: ' + state.lead.email,
      '- Phone: ' + state.lead.phone,
      '- Monthly inquiry volume: ' + state.lead.volume
    ].join('\n');

    addMessage(messagesEl, 'bot', summary + '\n\nPerfect. A Pro Fast AI specialist will contact you shortly.');

    var subject = encodeURIComponent('New Pro Fast AI Lead - ' + state.lead.business);
    var body = encodeURIComponent(
      [
        'New lead captured from website chatbot:',
        '',
        'Name: ' + state.lead.name,
        'Business: ' + state.lead.business,
        'Email: ' + state.lead.email,
        'Phone: ' + state.lead.phone,
        'Monthly inquiry volume: ' + state.lead.volume,
        '',
        'Transcript:',
        state.transcript.join('\n')
      ].join('\n')
    );

    var handoff = document.createElement('a');
    handoff.href = 'mailto:' + contactEmail + '?subject=' + subject + '&body=' + body;
    handoff.click();
  }

  function handleLeadStep(messagesEl, text) {
    var value = text.trim();

    if (state.mode === 'lead_name') {
      state.lead.name = value;
      state.mode = 'lead_business';
      addMessage(messagesEl, 'bot', 'Thanks, ' + value + '. What is your business name?');
      return;
    }
    if (state.mode === 'lead_business') {
      state.lead.business = value;
      state.mode = 'lead_email';
      addMessage(messagesEl, 'bot', 'Great. What is the best email for follow-up?');
      return;
    }
    if (state.mode === 'lead_email') {
      if (!validEmail(value)) {
        addMessage(messagesEl, 'bot', 'That email looks invalid. Please enter a valid email address.');
        return;
      }
      state.lead.email = value;
      state.mode = 'lead_phone';
      addMessage(messagesEl, 'bot', 'Perfect. What phone number should we use?');
      return;
    }
    if (state.mode === 'lead_phone') {
      if (digitsOnly(value).length < 10) {
        addMessage(messagesEl, 'bot', 'Please enter a valid phone number with at least 10 digits.');
        return;
      }
      state.lead.phone = value;
      state.mode = 'lead_volume';
      addMessage(messagesEl, 'bot', 'Approx how many customer inquiries/calls do you get per month?');
      return;
    }
    if (state.mode === 'lead_volume') {
      state.lead.volume = value;
      finishLeadFlow(messagesEl);
    }
  }

  function routeReply(messagesEl, text) {
    if (state.mode.indexOf('lead_') === 0) {
      handleLeadStep(messagesEl, text);
      return;
    }

    var lower = text.toLowerCase().trim();

    if (wantsLeadCapture(lower)) {
      startLeadFlow(messagesEl);
      return;
    }

    sendPfaiApi(messagesEl, text);
  }

  var booted = false;

  function bootBot(kb) {
    if (booted || document.getElementById('pfai-shell')) return;
    booted = true;

    SITE = buildSite(kb) || FALLBACK_SITE;
    if (kb && kb.contact && kb.contact.email) {
      contactEmail = kb.contact.email;
    }

  var styles = document.createElement('style');
  styles.textContent = `
    #pfai-shell * { box-sizing: border-box; }
    #pfai-shell {
      position: fixed;
      right: 24px;
      bottom: 22px;
      z-index: 100000;
      font-family: 'DM Sans', sans-serif;
    }
    #pfai-trigger {
      border: 0;
      border-radius: 999px;
      background: #c9a84c;
      color: #0a0a08;
      font-weight: 700;
      font-size: 13px;
      padding: 12px 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      cursor: pointer;
    }
    #pfai-window {
      display: none;
      width: min(390px, calc(100vw - 24px));
      height: 560px;
      background: #111110;
      border: 1px solid #2a2a24;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 16px 50px rgba(0,0,0,0.45);
      margin-bottom: 10px;
    }
    #pfai-window.open { display: flex; flex-direction: column; }
    .pfai-header {
      background: #171714;
      border-bottom: 1px solid #2a2a24;
      padding: 14px;
    }
    .pfai-title { color: #f5f0e8; font-size: 15px; font-weight: 700; }
    .pfai-sub { color: #8a8578; font-size: 12px; margin-top: 2px; }
    .pfai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #111110;
    }
    .pfai-row { display: flex; }
    .pfai-row.user { justify-content: flex-end; }
    .pfai-bubble {
      max-width: 86%;
      font-size: 13px;
      line-height: 1.45;
      border-radius: 10px;
      padding: 9px 11px;
      white-space: pre-wrap;
    }
    .pfai-bubble.bot {
      background: #1f1f1b;
      border: 1px solid #30302a;
      color: #f5f0e8;
    }
    .pfai-bubble.user {
      background: #c9a84c;
      color: #0a0a08;
      font-weight: 600;
    }
    .pfai-quick {
      padding: 0 12px 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      background: #111110;
    }
    .pfai-chip {
      border: 1px solid #393930;
      border-radius: 999px;
      background: #1b1b18;
      color: #f5f0e8;
      font-size: 11px;
      padding: 6px 10px;
      cursor: pointer;
    }
    .pfai-input-row {
      display: flex;
      gap: 8px;
      border-top: 1px solid #2a2a24;
      background: #171714;
      padding: 10px;
    }
    #pfai-input {
      flex: 1;
      border: 1px solid #34342e;
      border-radius: 9px;
      background: #0f0f0d;
      color: #f5f0e8;
      padding: 10px 11px;
      font-size: 13px;
      outline: none;
    }
    #pfai-send {
      border: 0;
      border-radius: 9px;
      background: #c9a84c;
      color: #0a0a08;
      font-weight: 700;
      padding: 0 14px;
      cursor: pointer;
    }
    @media (max-width: 640px) {
      #pfai-shell { right: 10px; bottom: 10px; }
      #pfai-window { height: 68vh; width: min(390px, calc(100vw - 20px)); }
      #pfai-trigger { font-size: 12px; padding: 10px 13px; }
    }
  `;
  document.head.appendChild(styles);

  var shell = document.createElement('div');
  shell.id = 'pfai-shell';
  shell.innerHTML = `
    <div id="pfai-window">
      <div class="pfai-header">
        <div class="pfai-title">Pro Fast AI Assistant</div>
        <div class="pfai-sub">Service businesses · Orange County, CA</div>
      </div>
      <div id="pfai-messages" class="pfai-messages"></div>
      <div class="pfai-quick">
        <button class="pfai-chip" type="button" data-topic="offer">What is Pro Fast AI?</button>
        <button class="pfai-chip" type="button" data-topic="howItWorks">How it works</button>
        <button class="pfai-chip" type="button" data-topic="pricingAll">Pricing</button>
        <button class="pfai-chip" type="button" data-topic="trial">30-day free trial</button>
      </div>
      <form id="pfai-form" class="pfai-input-row">
        <input id="pfai-input" placeholder="Ask anything or type 'start free trial'" autocomplete="off" />
        <button id="pfai-send" type="submit">Send</button>
      </form>
    </div>
    <button id="pfai-trigger" type="button">Chat With Pro Fast AI</button>
  `;
  document.body.appendChild(shell);

  var trigger = document.getElementById('pfai-trigger');
  var windowEl = document.getElementById('pfai-window');
  var messagesEl = document.getElementById('pfai-messages');
  var formEl = document.getElementById('pfai-form');
  var inputEl = document.getElementById('pfai-input');
  var chips = shell.querySelectorAll('.pfai-chip');

  function openChat() {
    state.open = true;
    windowEl.classList.add('open');
    trigger.textContent = 'Close Chat';
    if (!state.greeted) {
      state.greeted = true;
      addMessage(
        messagesEl,
        'bot',
        'Welcome. Ask a question or use a shortcut below. Type start free trial when you want us to follow up.'
      );
    }
    inputEl.focus();
  }

  function closeChat() {
    state.open = false;
    windowEl.classList.remove('open');
    trigger.textContent = 'Chat With Pro Fast AI';
  }

  function submitQuestion(text) {
    var msg = (text || '').trim();
    if (!msg) return;
    addMessage(messagesEl, 'user', msg);
    inputEl.value = '';
    setTimeout(function () {
      routeReply(messagesEl, msg);
    }, 250);
  }

  trigger.addEventListener('click', function () {
    if (state.open) closeChat();
    else openChat();
  });

  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    submitQuestion(inputEl.value);
  });

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var topic = chip.getAttribute('data-topic');
      var label = (chip.textContent || '').trim();
      if (topic && SITE[topic]) {
        addMessage(messagesEl, 'user', label);
        setTimeout(function () {
          sendPfaiApi(messagesEl, label);
        }, 200);
        return;
      }
      submitQuestion(label);
    });
  });
  }

  if (window.__PROFAST_KB__) {
    bootBot(window.__PROFAST_KB__);
  } else {
    window.addEventListener('profat:kb', function onProfatKb(ev) {
      window.removeEventListener('profat:kb', onProfatKb);
      bootBot(ev.detail);
    });
    window.setTimeout(function () {
      if (booted || document.getElementById('pfai-shell')) return;
      if (window.__PROFAST_KB__) {
        bootBot(window.__PROFAST_KB__);
        return;
      }
      fetch('./knowledge.json')
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        })
        .then(function (kb) {
          window.__PROFAST_KB__ = kb;
          if (typeof window.profastApplyKnowledge === 'function') {
            window.profastApplyKnowledge(kb);
          }
          bootBot(kb);
        })
        .catch(function () {
          bootBot(null);
        });
    }, 100);
  }
})();
