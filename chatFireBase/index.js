// index.js
// Configuração do Firebase
// substitua com suas próprias credenciais do console do Firebase :]
var firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};


firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Username e Avatar
const usernameModal = document.getElementById("username-modal");
const usernameInput = document.getElementById("username-input");
const usernameSubmit = document.getElementById("username-submit");

let username = localStorage.getItem("username") || "";
let avatarChoice = localStorage.getItem("avatarChoice");

if (!username) {
    usernameModal.style.display = "flex";
}

usernameSubmit.addEventListener("click", () => {
    username = usernameInput.value;
    if (username) {
        localStorage.setItem("username", username);
        usernameModal.style.display = "none";
        showAvatarModal();
    }
});

// Avatar
const avatarModal = document.getElementById("avatar-modal");
const avatarSubmit = document.getElementById("avatar-submit");
const avatarOptions = document.querySelectorAll(".avatar-option");

function showAvatarModal() {
    if (!avatarChoice) {
        avatarModal.style.display = "flex";
    }
}

avatarOptions.forEach(option => {
    option.addEventListener("click", () => {
        avatarChoice = option.getAttribute("data-avatar");
        localStorage.setItem("avatarChoice", avatarChoice);
        updateProfileAvatar(avatarChoice);
        avatarModal.style.display = "none";
    });
});

avatarSubmit.addEventListener("click", () => {
    if (avatarChoice) {
        avatarModal.style.display = "none";
    } else {
        alert("Escolha um avatar primeiro!");
    }
});

function updateProfileAvatar(avatar) {
    const avatarElement = document.getElementById("profile-avatar");
    if (avatarElement) {
        avatarElement.src = `screenshots/${avatar}.png`;
    }
}

function loadProfileAvatar() {
    const savedAvatar = localStorage.getItem("avatarChoice");
    if (savedAvatar) {
        updateProfileAvatar(savedAvatar);
    }
}

loadProfileAvatar();

// Enviar mensagens
document.getElementById("message-form").addEventListener("submit", sendMessage);

function sendMessage(e) {
    e.preventDefault();

    if (!username) {
        alert("Escolha um nome primeiro!");
        return;
    }

    const timestamp = Date.now();
    const messageInput = document.getElementById("message-input");
    const message = messageInput.value;
    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];
    const imagePreview = document.getElementById("image-preview");
    const avatarSelecionado = localStorage.getItem("avatarChoice") || "c1";

    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const fileData = event.target.result;
            db.ref("messages/" + timestamp)
                .set({
                    username,
                    message: message || "",
                    timestamp,
                    avatar: avatarSelecionado,
                    file: {
                        name: file.name,
                        data: fileData,
                    },
                })
                .then(() => {
                    messageInput.value = "";
                    fileInput.value = "";
                    document.getElementById("file-name").textContent = "";
                    if (imagePreview) {
                        imagePreview.src = "";
                        imagePreview.style.display = "none";
                    }
                });
        };
        reader.readAsDataURL(file);
    } else if (message) {
        db.ref("messages/" + timestamp)
            .set({
                username,
                message,
                timestamp,
                avatar: avatarSelecionado,
            })
            .then(() => {
                messageInput.value = "";
            });
    }
}

// Exibir mensagens
const fetchChat = db.ref("messages/");
const addedMessages = {};

function transformarLinks(texto) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return texto.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
}

fetchChat.on("child_added", function (snapshot) {
    const messages = snapshot.val();
    const messageId = snapshot.key;

    if (!addedMessages[messageId]) {
        addedMessages[messageId] = true;

        const date = new Date(messages.timestamp);
        const messageElement = document.createElement("li");
        messageElement.className = username === messages.username ? "sent" : "receive";

        const avatar = messages.avatar || "c1";
        const avatarImg = `<img src="screenshots/${avatar}.png" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px;" />`;

        if (messages.file) {
            messageElement.innerHTML += `<span>${avatarImg}${messages.username}: </span>${transformarLinks(messages.message)}<br><a href="${messages.file.data}"><img src="${messages.file.data}" style="max-width: 100%; max-height: 200px; cursor: pointer;" onclick="showFullscreenImage('${messages.file.data}')"></a><br><span class="time">${date.toLocaleString("pt-BR")}</span>`;
        } else {
            messageElement.innerHTML += `<span>${avatarImg}${messages.username}: </span>${transformarLinks(messages.message)}<br><span class="time">${date.toLocaleString("pt-BR")}</span>`;
        }

        document.getElementById("messages").appendChild(messageElement);
        setTimeout(() => {
            messageElement.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }
});

// Preview da imagem
document.getElementById("file-input").addEventListener("change", function (event) {
    const file = event.target.files[0];
    const imagePreview = document.getElementById("image-preview");
    const fileNameElement = document.getElementById("file-name");

    if (file) {
        fileNameElement.textContent = file.name;
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function (e) {
                if (imagePreview) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = "inline";
                    imagePreview.onclick = function () {
                        showFullscreenImage(e.target.result);
                    };
                }
            };
            reader.readAsDataURL(file);
        } else {
            if (imagePreview) {
                imagePreview.src = "";
                imagePreview.style.display = "none";
            }
        }
    } else {
        fileNameElement.textContent = "";
        if (imagePreview) {
            imagePreview.src = "";
            imagePreview.style.display = "none";
        }
    }
});

// Tela cheia para imagem
function showFullscreenImage(imageData) {
    const fullscreenDiv = document.createElement("div");
    fullscreenDiv.style.position = "fixed";
    fullscreenDiv.style.top = "0";
    fullscreenDiv.style.left = "0";
    fullscreenDiv.style.width = "100%";
    fullscreenDiv.style.height = "100%";
    fullscreenDiv.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    fullscreenDiv.style.display = "flex";
    fullscreenDiv.style.justifyContent = "center";
    fullscreenDiv.style.alignItems = "center";
    fullscreenDiv.style.zIndex = "1000";
    fullscreenDiv.onclick = function () {
        document.body.removeChild(fullscreenDiv);
    };

    const fullscreenImage = document.createElement("img");
    fullscreenImage.src = imageData;
    fullscreenImage.style.maxWidth = "90%";
    fullscreenImage.style.maxHeight = "90%";
    fullscreenDiv.appendChild(fullscreenImage);
    document.body.appendChild(fullscreenDiv);
}
