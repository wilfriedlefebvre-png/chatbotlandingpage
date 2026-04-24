(function () {
  var host = document.getElementById('demoWidgetHost');
  if (!host) return;
  var placeholder = document.getElementById('demoPlaceholder');

  var API_URL = '/api/chat';
  var BOT_NAME = 'Clementine';
  var BOT_SUBTITLE = "Ask me anything - menus, reservations, catering and more.";
  var WELCOME_MSG = "Bonjour. I'm Clementine, your Creme de la Crepe assistant. How can I help you today?";
  var QUICK_REPLIES = ['Locations & Hours', 'See the Menu', 'Reservations', 'Catering Info', 'Contact Us'];

  var styles = document.createElement('style');
  styles.textContent = `
    #cdlc-demo-widget * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }
    #cdlc-demo-widget { position: absolute; right: 16px; bottom: 16px; z-index: 6; pointer-events: auto; }
    #cdlc-demo-bubble {
      border: 1px solid rgba(201, 168, 76, 0.85);
      background: #8b1a2b; color: #faf3e0;
      border-radius: 999px; font-size: 13px; font-weight: 700;
      padding: 10px 14px; cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    #cdlc-demo-panel {
      position: absolute; right: 0; bottom: 56px;
      width: min(430px, calc(100vw - 64px)); height: 450px;
      background: #faf3e0; border-radius: 14px; overflow: hidden;
      box-shadow: 0 16px 60px rgba(0, 0, 0, 0.24);
      display: none; flex-direction: column;
    }
    #cdlc-demo-panel.open { display: flex; }
    #cdlc-demo-header { background: #8b1a2b; color: #faf3e0; padding: 14px 16px; }
    #cdlc-demo-header h3 { font-size: 16px; font-weight: 700; }
    #cdlc-demo-header p { font-size: 11px; margin-top: 3px; opacity: 0.9; }
    #cdlc-demo-messages {
      flex: 1; overflow-y: auto; padding: 14px;
      display: flex; flex-direction: column; gap: 10px; background: #faf3e0;
    }
    .cdlc-demo-msg { display: flex; flex-direction: column; max-width: 84%; }
    .cdlc-demo-msg.bot { align-self: flex-start; }
    .cdlc-demo-msg.user { align-self: flex-end; }
    .cdlc-demo-bubble-text {
      border-radius: 14px; padding: 9px 12px; font-size: 13px; line-height: 1.45;
      white-space: pre-wrap;
    }
    .cdlc-demo-msg.bot .cdlc-demo-bubble-text {
      background: #ffffff; color: #2c2c2c; border-bottom-left-radius: 5px; border: 1px solid #efe6d4;
    }
    .cdlc-demo-msg.user .cdlc-demo-bubble-text {
      background: #8b1a2b; color: #faf3e0; border-bottom-right-radius: 5px;
    }
    #cdlc-demo-quick { padding: 0 14px 10px; display: flex; flex-wrap: wrap; gap: 6px; background: #faf3e0; }
    .cdlc-demo-qr {
      background: #fff; border: 1.5px solid #c9a84c; color: #8b1a2b;
      border-radius: 18px; padding: 5px 10px; font-size: 11px; cursor: pointer;
    }
    #cdlc-demo-input-row {
      padding: 10px; border-top: 1px solid #e6dbc6; display: flex; gap: 8px; background: #faf3e0;
    }
    #cdlc-demo-input {
      flex: 1; border: 1px solid #decfb5; border-radius: 18px;
      padding: 9px 12px; font-size: 13px; outline: none; color: #2c2c2c;
    }
    #cdlc-demo-send {
      border: 0; border-radius: 18px; background: #8b1a2b; color: #faf3e0;
      font-weight: 700; padding: 0 12px; cursor: pointer;
    }
    @media (max-width: 768px) {
      #cdlc-demo-widget { right: 10px; bottom: 10px; }
      #cdlc-demo-panel { width: min(340px, calc(100vw - 44px)); height: 390px; }
      #cdlc-demo-bubble { font-size: 12px; padding: 9px 12px; }
    }
  `;
  document.head.appendChild(styles);

  host.innerHTML = `
    <div id="cdlc-demo-widget">
      <div id="cdlc-demo-panel">
        <div id="cdlc-demo-header">
          <h3>${BOT_NAME}</h3>
          <p>${BOT_SUBTITLE}</p>
        </div>
        <div id="cdlc-demo-messages"></div>
        <div id="cdlc-demo-quick">
          ${QUICK_REPLIES.map(function (r) { return '<button class="cdlc-demo-qr">' + r + '</button>'; }).join('')}
        </div>
        <div id="cdlc-demo-input-row">
          <input id="cdlc-demo-input" type="text" placeholder="Type your question..." autocomplete="off" />
          <button id="cdlc-demo-send" type="button">Send</button>
        </div>
      </div>
      <button id="cdlc-demo-bubble" type="button">Open Live Demo Chat</button>
    </div>
  `;

  var bubble = document.getElementById('cdlc-demo-bubble');
  var panel = document.getElementById('cdlc-demo-panel');
  var messagesEl = document.getElementById('cdlc-demo-messages');
  var input = document.getElementById('cdlc-demo-input');
  var sendBtn = document.getElementById('cdlc-demo-send');
  var qrBtns = host.querySelectorAll('.cdlc-demo-qr');
  var greeted = false;
  var history = [];

  function addMessage(role, text) {
    var div = document.createElement('div');
    div.className = 'cdlc-demo-msg ' + role;
    var bubbleText = document.createElement('div');
    bubbleText.className = 'cdlc-demo-bubble-text';
    bubbleText.textContent = text;
    div.appendChild(bubbleText);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function localFallbackReply(text) {
    var lower = text.toLowerCase();
    if (lower.includes('hour') || lower.includes('location')) return 'All locations are typically open daily 8:00 AM - 9:30 PM. I can share the nearest location too.';
    if (lower.includes('reservation') || lower.includes('book')) return 'Reservations are available through OpenTable. Search for "Creme de la Crepe".';
    if (lower.includes('catering')) return 'For catering, call (310) 469-2727 or email catering@cremedelacrepe.com.';
    if (lower.includes('menu')) return 'You can view menu highlights at cremedelacrepe.com, including savory and sweet crepes.';
    return 'I can help with locations, hours, menu, reservations, and catering. What would you like to know?';
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    addMessage('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;

    try {
      var res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      var data = await res.json();
      var reply = data.reply || localFallbackReply(text);
      addMessage('bot', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (e) {
      addMessage('bot', localFallbackReply(text));
    }

    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }

  bubble.addEventListener('click', function () {
    var isOpen = panel.classList.toggle('open');
    bubble.textContent = isOpen ? 'Close Demo Chat' : 'Open Live Demo Chat';
    if (placeholder) placeholder.style.display = isOpen ? 'none' : 'block';
    if (isOpen && !greeted) {
      greeted = true;
      addMessage('bot', WELCOME_MSG);
    }
    if (isOpen) input.focus();
  });

  sendBtn.addEventListener('click', function () { sendMessage(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMessage(input.value);
  });
  qrBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { sendMessage(btn.textContent || ''); });
  });

  // Keep the demo chat visible by default so visitors always see it.
  panel.classList.add('open');
  bubble.textContent = 'Close Demo Chat';
  if (placeholder) placeholder.style.display = 'none';
  if (!greeted) {
    greeted = true;
    addMessage('bot', WELCOME_MSG);
  }
})();
