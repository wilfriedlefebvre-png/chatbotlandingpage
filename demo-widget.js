(function () {
  var host = document.getElementById('demoWidgetHost');
  if (!host) return;

  var styles = document.createElement('style');
  styles.textContent = `
    #pf-demo-widget {
      position: absolute;
      right: 16px;
      bottom: 16px;
      pointer-events: auto;
      z-index: 5;
    }
    #pf-demo-bubble {
      border: 1px solid rgba(201, 168, 76, 0.8);
      background: #c9a84c;
      color: #0a0a08;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      padding: 10px 14px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    #pf-demo-panel {
      position: absolute;
      right: 0;
      bottom: 52px;
      width: min(360px, calc(100vw - 56px));
      height: 430px;
      background: #141412;
      border: 1px solid #3a382f;
      border-radius: 12px;
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    #pf-demo-panel.open { display: flex; }
    #pf-demo-header {
      padding: 12px;
      border-bottom: 1px solid #2a2a24;
      font-size: 13px;
      color: #f5f0e8;
      font-weight: 600;
      background: #1b1b18;
    }
    #pf-demo-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .pf-demo-msg {
      max-width: 86%;
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 13px;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .pf-demo-msg.bot {
      background: #26261f;
      border: 1px solid #3a382f;
      color: #f5f0e8;
    }
    .pf-demo-msg.user {
      margin-left: auto;
      background: #c9a84c;
      color: #0a0a08;
      font-weight: 600;
    }
    #pf-demo-form {
      display: flex;
      gap: 8px;
      padding: 10px;
      border-top: 1px solid #2a2a24;
      background: #1b1b18;
    }
    #pf-demo-input {
      flex: 1;
      border-radius: 8px;
      border: 1px solid #3a382f;
      background: #10100e;
      color: #f5f0e8;
      padding: 9px 10px;
      font-size: 13px;
      outline: none;
    }
    #pf-demo-send {
      border: 0;
      border-radius: 8px;
      background: #c9a84c;
      color: #0a0a08;
      font-weight: 700;
      padding: 0 12px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(styles);

  host.innerHTML = `
    <div id="pf-demo-widget">
      <div id="pf-demo-panel">
        <div id="pf-demo-header">Live Demo Assistant</div>
        <div id="pf-demo-messages"></div>
        <form id="pf-demo-form">
          <input id="pf-demo-input" placeholder="Ask about hours, menu, reservations..." autocomplete="off" />
          <button id="pf-demo-send" type="submit">Send</button>
        </form>
      </div>
      <button id="pf-demo-bubble" type="button">Open Live Demo Chat</button>
    </div>
  `;

  var bubble = document.getElementById('pf-demo-bubble');
  var panel = document.getElementById('pf-demo-panel');
  var form = document.getElementById('pf-demo-form');
  var input = document.getElementById('pf-demo-input');
  var messages = document.getElementById('pf-demo-messages');
  var greeted = false;

  function add(role, text) {
    var div = document.createElement('div');
    div.className = 'pf-demo-msg ' + role;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function reply(text) {
    var lower = text.toLowerCase();
    if (lower.includes('hour')) return 'We can answer hours instantly for your restaurant, 24/7.';
    if (lower.includes('menu')) return 'The bot can answer menu, dietary options, and popular dishes.';
    if (lower.includes('reservation') || lower.includes('book')) return 'It can collect date, time, party size, and contact details for reservations.';
    if (lower.includes('price') || lower.includes('cost')) return 'Plans start at $49/month with setup. Standard is $99/month.';
    if (lower.includes('contact') || lower.includes('phone')) return 'Contact: +1 (424) 206-8097 or Wilfried.lefebvre@gmail.com.';
    return 'This is the live demo bot. Ask about hours, menu, reservations, pricing, or contact.';
  }

  bubble.addEventListener('click', function () {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !greeted) {
      greeted = true;
      add('bot', 'Welcome to the live demo. I am a demo-only chatbot for this section.');
    }
    if (panel.classList.contains('open')) input.focus();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    add('user', text);
    input.value = '';
    setTimeout(function () { add('bot', reply(text)); }, 280);
  });
})();
