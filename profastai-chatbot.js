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
    transcript: []
  };

  var FAQ = {
    pricing: 'We offer Starter ($49/mo), Standard ($99/mo), and Pro ($199/mo), each with a one-time setup fee. Most restaurants start with Standard because it includes booking + lead capture.',
    setup: 'Setup is usually done in about 2 hours and can go live in 48 hours. We handle installation and training for your specific restaurant.',
    integrations: 'We can support booking flows, website embeds, and lead capture workflows. We can also connect to your reservation tooling based on your plan.',
    support: 'You get ongoing support by email, plus priority support on higher tiers. We also provide optimization and reporting in advanced plans.',
    results: 'Most restaurants use it to answer repetitive questions, reduce missed inquiries after hours, and capture booking/lead requests automatically.',
    contact: 'You can reach us at Wilfried.lefebvre@gmail.com or +1 (424) 206-8097.'
  };

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
    addMessage(messagesEl, 'bot', "Great. I'll help you get started. What is your full name?");
  }

  function finishLeadFlow(messagesEl) {
    state.mode = 'normal';
    var summary = [
      'Lead captured:',
      '- Name: ' + state.lead.name,
      '- Restaurant: ' + state.lead.business,
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
        'Restaurant: ' + state.lead.business,
        'Email: ' + state.lead.email,
        'Phone: ' + state.lead.phone,
        'Monthly inquiry volume: ' + state.lead.volume,
        '',
        'Transcript:',
        state.transcript.join('\n')
      ].join('\n')
    );

    var handoff = document.createElement('a');
    handoff.href = 'mailto:Wilfried.lefebvre@gmail.com?subject=' + subject + '&body=' + body;
    handoff.click();
  }

  function handleLeadStep(messagesEl, text) {
    var value = text.trim();

    if (state.mode === 'lead_name') {
      state.lead.name = value;
      state.mode = 'lead_business';
      addMessage(messagesEl, 'bot', 'Thanks, ' + value + '. What is your restaurant name?');
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

    var lower = text.toLowerCase();

    if (
      lower.includes('start') ||
      lower.includes('free trial') ||
      lower.includes('book a call') ||
      lower.includes('demo') ||
      lower.includes('get started')
    ) {
      startLeadFlow(messagesEl);
      return;
    }

    if (lower.includes('price') || lower.includes('cost') || lower.includes('plan')) {
      addMessage(messagesEl, 'bot', FAQ.pricing);
      return;
    }
    if (lower.includes('setup') || lower.includes('install') || lower.includes('live')) {
      addMessage(messagesEl, 'bot', FAQ.setup);
      return;
    }
    if (lower.includes('integrat') || lower.includes('calendar') || lower.includes('booking')) {
      addMessage(messagesEl, 'bot', FAQ.integrations);
      return;
    }
    if (lower.includes('support') || lower.includes('help')) {
      addMessage(messagesEl, 'bot', FAQ.support);
      return;
    }
    if (lower.includes('result') || lower.includes('roi') || lower.includes('benefit')) {
      addMessage(messagesEl, 'bot', FAQ.results);
      return;
    }
    if (lower.includes('email') || lower.includes('phone') || lower.includes('contact')) {
      addMessage(messagesEl, 'bot', FAQ.contact);
      return;
    }

    addMessage(
      messagesEl,
      'bot',
      'I can help with pricing, setup timeline, integrations, and expected results. If you want, I can also collect your info now and schedule a follow-up.'
    );
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
        <div class="pfai-sub">Professional support + lead qualification</div>
      </div>
      <div id="pfai-messages" class="pfai-messages"></div>
      <div class="pfai-quick">
        <button class="pfai-chip" type="button">Pricing</button>
        <button class="pfai-chip" type="button">Setup Time</button>
        <button class="pfai-chip" type="button">Integrations</button>
        <button class="pfai-chip" type="button">Start Free Trial</button>
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
        'Welcome. I help restaurant owners evaluate Pro Fast AI and get started quickly. Ask about pricing, setup, or type "start free trial".'
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
      submitQuestion(chip.textContent || '');
    });
  });
})();
