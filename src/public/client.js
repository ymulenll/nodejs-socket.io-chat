const socket = io();

const username = prompt("Entre su nombre de usuario: ");

if (username) {
  socket.emit("set-username", username);
}

const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

// cargar mensajes guardados
fetch("/messages")
  .then((res) => res.json())
  .then((messages) => {
    messages.forEach(addMessage);
  });

socket.on("new-message-ok", (payload) => {
  addMessage(payload);
});

msgerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const msgText = msgerInput.value;
  if (!msgText) return;

  socket.emit("new-message", msgText);

  msgerInput.value = "";
});

function addMessage(payload) {
  const { text, user, createdAt } = payload;
  const isMe = user.username === username;
  appendMessage(
    user.username,
    isMe ? "right" : "left",
    text,
    createdAt
  );
}

function appendMessage(name, side, text, date) {
  const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name || "Invitado"}</div>
          <div class="msg-info-time" datetime="${date}"></div>
        </div>
        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;

  const msgerTime = document.querySelectorAll(".msg-info-time");
  timeago.render(msgerTime, "es");
}

// Utils
function get(selector, root = document) {
  return root.querySelector(selector);
}
