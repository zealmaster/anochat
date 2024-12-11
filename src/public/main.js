const signup = document.getElementById("user-sign-up");
const signin = document.getElementById("user-sign-in");
const signupDiv = document.getElementById("sign-up-form");
const signinDiv = document.getElementById("sign-in-form");
const container = document.getElementsByClassName("container");
const signupForm = document.getElementById("register-form");
const signinForm = document.getElementById("login-form");
const signupUsername = document.getElementById("sign-up-username");
const signupPassword = document.getElementById("sign-up-password");
const signinUsername = document.getElementById("sign-in-username");
const signinPassword = document.getElementById("sign-in-password");
const signError = document.getElementById("sign-in-error");

// Home page script
window.onload = () => {
  signinDiv.style.display = "display";
  signupDiv.style.display = "none";
  if (localStorage.getItem("token")) location.href = "home.html";
};

signup.addEventListener("click", (e) => {
  (signinDiv.style.display = "none"), (signupDiv.style.display = "block");
});
signin.addEventListener("click", (e) => {
  (signinDiv.style.display = "block"), (signupDiv.style.display = "none");
});

// submit registration form
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = signupUsername.value;
  const password = signupPassword.value;
  if (!username || !password) return;
  const data = {
    username,
    password,
  };

  try {
    const respond = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const resData = await respond.json();
    
    if (resData.error) {
      signError.style.color = "red";
      signError.innerText = resData.error;
    } else {
      signError.style.color = "green";
      signError.innerText = "Registration successful.";
      location.href = "./index.html";
    }
  } catch (error) {
    console.log(error);
  }
});

// Send login form
signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    username: signinUsername.value,
    password: signinPassword.value,
  };
  try {
    const respond = await fetch("/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const resData = await respond.json();
    if (resData.error) {
      signError.style.color = "red";
      signError.innerText = resData.error;
    } else {
      localStorage.setItem("token", resData.token);
      localStorage.setItem("username", resData.username);
      window.location.href = "./users.html";
    }
  } catch (error) {
    // console.log(error);
  }
});
