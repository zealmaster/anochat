const socket = io({
  auth: {
    token: `Bearer ${localStorage.getItem("token")}`,
  },
});

const nameInput = document.getElementById("client-name-input");
const messageForm = document.getElementById("message-form");
const messageContainer = document.getElementById("message-container");
const message = document.getElementById("message-input");
const feedback = document.getElementById("feedback");
const clientName = document.getElementById("client-name");
const logout = document.getElementById("logout");

let username = localStorage.getItem("username");

window.onload = () => {
  if (!localStorage.getItem("token")) location.href = "index.html";
  clientName.innerText = localStorage.getItem("receiver");
  messageContainer.style.display = "none";
  clientName.style.display = "none";
  messageForm.style.display = "none";
};

socket.on("connect_error", (error) => {
  if (
    error.message === "Authentication error" ||
    error.message === "jwt expired"
  ) {
    handleSessionExpiry();
  }
});

function handleSessionExpiry() {
  alert("Your session has expired. Please sign in again.");
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("receiver");

  window.location.href = "index.html";
}

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (message.value == "") return;
  const data = {
    sender: localStorage.getItem("username"),
    receiver: localStorage.getItem("receiver"),
    message: message.value,
  };
  socket.emit("message", data);
  message.value = "";
});

// Retrieve chat messages from the database
socket.on("chat-message", (data) => {
  messageContainer.textContent = "";
  clientName.innerText = localStorage.getItem("receiver");
  data.forEach((message) => {
    if (message.sender == username) {
      sendChatToUI(true, message);
    } else {
      sendChatToUI(false, message);
    }
  });
});

// Show real-time message to the receiver if the chat window is opened
socket.on("live-chat", (data) => {
  if (data.sender == localStorage.getItem("receiver")) {
    if (data.sender == username) {
      sendChatToUI(true, data);
    } else {
      sendChatToUI(false, data);
    }
  }
});

// Display real-time message in the sender chat window
socket.on("send-message", (data) => {
  sendChatToUI(true, data);
});

// Chat UI logic function
function sendChatToUI(isOwnMessage, data) {
  const element = `<li class="${
    isOwnMessage ? "message-right" : "message-left"
  }">
  <p>${data.message}</p>
  
  <span> ${moment(data.createdAt).fromNow()}</span>
</li>`;
  messageContainer.innerHTML += element;
  scrollToBottom();
}

// Scroll to the chat message container bottom
function scrollToBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight);
}

// Display users in the chat list
const userList = document.getElementById("user-list");

socket.on("chat-list", (data) => {
  userList.innerHTML = "";
  data.forEach((user) => {

    const userLink = document.createElement("a");
    // userLink.href = "#";
    const userItem = document.createElement("li");
    const displayPic = document.createElement("img");
    displayPic.setAttribute("class", "display-pic");
    displayPic.setAttribute(
      "src",
      `${user.gender === "Male" ? "images/profile.png" : "images/woman.png"}`
    );
    userLink.className = "user";

    if (user.username != localStorage.getItem("username")) {
      userItem.textContent = user.contact;
      displayPic.textContent = "DP";
      // Add user ID as a data attribute
      userItem.setAttribute("data-id", user._id);
      // Append to the list
      userLink.appendChild(displayPic);
      userLink.appendChild(userItem);
      userList.appendChild(userLink);

      userItem.addEventListener("click", () => {
        localStorage.setItem("receiver", user.contact);
        clientName.innerText = localStorage.getItem("receiver");
        const privateData = {
          receiver: user.contact,
          sender: username,
        };
        socket.emit("private", privateData);
        messageContainer.textContent = "";
        messageContainer.style.display = "flex";
        clientName.style.display = "flex";
        messageForm.style.display = "flex";
      });
    }
  });
});

// Logout a user
logout.addEventListener("click", () => {
  localStorage.removeItem("username");
  localStorage.removeItem("receiver");
  localStorage.removeItem("token");
  location.href = "index.html";
});
