(function () {
  const BOT_NAME = 'Clementine';
  const BOT_SUBTITLE = "Ask me anything - menus, reservations, catering and more.";
  const WELCOME_MSG = "Bonjour. I'm Clementine, your AI assistant. How can I help you today?";
  const QUICK_REPLIES = ['Locations & Hours', 'See the Menu', 'Reservations', 'Catering Info', 'Contact Us'];

  const styles = `
    #cdlc-widget * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }
    #cdlc-bubble {
      position: fixed; bottom: 28px; right: 28px; z-index: 99999;
      width: 60px; height: 60px; border-radius: 50%;
      background: #8b1a2b; box-shadow: 0 4px 20px rgba(139, 26, 43, 0.45);
      cursor: pointer; border: none; display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    #cdlc-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(139, 26, 43, 0.55); }
    #cdlc-bubble svg { width: 26px; height: 26px; fill: #faf3e0; }
    #cdlc-bubble .cdlc-close { display: none; font-size: 22px; color: #faf3e0; line-height: 1; }
    #cdlc-bubble.open .cdlc-open { display: none; }
    #cdlc-bubble.open .cdlc-close { display: block; }

    #cdlc-window {
      position: fixed; bottom: 100px; right: 28px; z-index: 99998;
      width: 370px; height: 560px; background: #faf3e0;
      border-radius: 20px; box-shadow: 0 16px 60px rgba(0, 0, 0, 0.2);
      display: flex; flex-direction: column; overflow: hidden;
      opacity: 0; transform: translateY(20px) scale(0.97); pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    #cdlc-window.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
    #cdlc-header {
      background: #8b1a2b; padding: 18px 20px; display: flex; align-items: center; gap: 12px;
    }
    #cdlc-avatar {
      width: 44px; height: 44px; border-radius: 50%; background: #c9a84c;
      display: flex; align-items: center; justify-content: center; font-size: 20px;
    }
    #cdlc-header-text h3 { font-size: 18px; font-weight: 700; color: #faf3e0; }
    #cdlc-header-text p { font-size: 11px; color: rgba(250, 243, 224, 0.78); margin-top: 2px; line-height: 1.4; }
    #cdlc-online { margin-left: auto; font-size: 11px; color: rgba(250, 243, 224, 0.8); }

    #cdlc-messages { flex: 1; overflow-y: auto; padding: 18px 16px 8px; display: flex; flex-direction: column; gap: 10px; }
    .cdlc-msg { display: flex; flex-direction: column; max-width: 82%; }
    .cdlc-msg.bot { align-self: flex-start; }
    .cdlc-msg.user { align-self: flex-end; }
    .cdlc-bubble-text { padding: 11px 14px; border-radius: 16px; font-size: 13.5px; line-height: 1.55; }
    .cdlc-msg.bot .cdlc-bubble-text { background: #fff; color: #2c2c2c; border-bottom-left-radius: 5px; }
    .cdlc-msg.user .cdlc-bubble-text { background: #8b1a2b; color: #faf3e0; border-bottom-right-radius: 5px; }
    .cdlc-typing { padding: 11px 14px; background: #fff; border-radius: 16px; border-bottom-left-radius: 5px; width: 62px; }

    #cdlc-quick-replies { padding: 6px 14px 10px; display: flex; flex-wrap: wrap; gap: 6px; }
    .cdlc-qr {
      background: #fff; border: 1.5px solid #c9a84c; color: #8b1a2b; font-size: 12px;
      padding: 6px 11px; border-radius: 20px; cursor: pointer;
    }
    .cdlc-qr:hover { background: #8b1a2b; color: #faf3e0; border-color: #8b1a2b; }

    #cdlc-input-row { padding: 10px 14px 16px; display: flex; gap: 8px; border-top: 1px solid rgba(201, 168, 76, 0.24); }
    #cdlc-input {
      flex: 1; border: 1.5px solid #e0d5c0; border-radius: 22px;
      padding: 10px 16px; font-size: 13.5px; background: #fff; color: #2c2c2c; outline: none;
    }
    #cdlc-send {
      width: 40px; height: 40px; border-radius: 50%; border: none;
      background: #8b1a2b; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    #cdlc-send svg { width: 16px; height: 16px; fill: #faf3e0; }
    #cdlc-footer { text-align: center; padding: 0 0 10px; font-size: 10px; color: #999; }
    @media (max-width: 480px) {
      #cdlc-window { width: calc(100vw - 20px); right: 10px; bottom: 90px; height: 70vh; }
      #cdlc-bubble { bottom: 18px; right: 18px; }
    }
  `;

  const html = `
    <style>${styles}</style>
    <div id="cdlc-widget">
      <div id="cdlc-window">
        <div id="cdlc-header">
          <div id="cdlc-avatar">🥞</div>
          <div id="cdlc-header-text">
            <h3>${BOT_NAME}</h3>
            <p>${BOT_SUBTITLE}</p>
          </div>
          <div id="cdlc-online">Online</div>
        </div>
        <div id="cdlc-messages"></div>
        <div id="cdlc-quick-replies">
          ${QUICK_REPLIES.map(function (r) { return '<button class="cdlc-qr">' + r + '</button>'; }).join('')}
        </div>
        <div id="cdlc-input-row">
          <input id="cdlc-input" type="text" placeholder="Type your question..." autocomplete="off" />
          <button id="cdlc-send"><svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg></button>
        </div>
        <div id="cdlc-footer">Powered by Pro Fast AI Solutions</div>
      </div>
      <button id="cdlc-bubble" aria-label="Chat with us">
        <svg class="cdlc-open" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        <span class="cdlc-close">x</span>
      </button>
    </div>
  `;

  var container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  var bubble = document.getElementById('cdlc-bubble');
  var win = document.getElementById('cdlc-window');
  var messagesEl = document.getElementById('cdlc-messages');
  var input = document.getElementById('cdlc-input');
  var sendBtn = document.getElementById('cdlc-send');
  var qrBtns = document.querySelectorAll('.cdlc-qr');

  var isOpen = false;
  var greeted = false;

  bubble.addEventListener('click', function () {
    isOpen = !isOpen;
    bubble.classList.toggle('open', isOpen);
    win.classList.toggle('open', isOpen);
    if (isOpen && !greeted) {
      greeted = true;
      addMessage('bot', WELCOME_MSG);
    }
    if (isOpen) setTimeout(function () { input.focus(); }, 250);
  });

  function addMessage(role, text) {
    var div = document.createElement('div');
    div.className = 'cdlc-msg ' + role;
    var msg = document.createElement('div');
    msg.className = 'cdlc-bubble-text';
    msg.textContent = text;
    div.appendChild(msg);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'cdlc-typing';
    div.id = 'cdlc-typing-indicator';
    div.textContent = '...';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    var t = document.getElementById('cdlc-typing-indicator');
    if (t) t.remove();
  }

  function getReply(text) {
    var lower = text.toLowerCase();
    if (lower.includes('hour') || lower.includes('open') || lower.includes('close')) {
      return 'We are available daily and can confirm exact hours for your location. Would you like weekday or weekend times?';
    }
    if (lower.includes('menu')) {
      return 'We serve sweet and savory crepes, coffee, brunch favorites, and desserts. I can also help with dietary options.';
    }
    if (lower.includes('reservation') || lower.includes('book') || lower.includes('table')) {
      return 'I can help reserve a table. Share your date, time, party size, and phone number for confirmation.';
    }
    if (lower.includes('catering') || lower.includes('event') || lower.includes('party')) {
      return 'Yes, catering is available for private events and office gatherings. Please share your event date and guest count.';
    }
    if (lower.includes('contact') || lower.includes('phone') || lower.includes('email')) {
      return 'Call us at +1 (424) 206-8097 or email Wilfried.lefebvre@gmail.com and we will help right away.';
    }
    if (lower.includes('location') || lower.includes('address')) {
      return 'We serve Orange County. Tell me your city and I can guide you to the nearest location.';
    }
    return 'Happy to help. You can ask about menu, reservations, catering, locations, and contact details.';
  }

  function sendMessage(text) {
    if (!text.trim()) return;
    addMessage('user', text.trim());
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    showTyping();
    setTimeout(function () {
      hideTyping();
      addMessage('bot', getReply(text));
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }, 450);
  }

  sendBtn.addEventListener('click', function () { sendMessage(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMessage(input.value); });
  qrBtns.forEach(function (btn) { btn.addEventListener('click', function () { sendMessage(btn.textContent || ''); }); });
})();
