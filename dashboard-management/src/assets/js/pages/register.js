import axios from "axios";
document.getElementById("registerForm").addEventListener("submit", function (e) {
    e.preventDefault(); // stop default form submit

    let firstName = document.getElementById("firstName").value.trim();
    let lastName = document.getElementById("lastName").value.trim();
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();
    let terms = document.getElementById("terms").checked;
    const button = document.getElementById("send_register_button");
    const btnText = document.getElementById("send_register_text");
    const loader = document.getElementById("send_register_loader");

    // basic validation
    if (firstName === "") {
        alert("First name is required");
        return;
    }

    if (lastName === "") {
        alert("Last name is required");
        return;
    }

    if (!validateEmail(email)) {
        alert("Please enter a valid email");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    if (!terms) {
        alert("You must accept the terms and conditions");
        return;
    }

    // --- Show Loading State ---
    button.disabled = true;
    btnText.textContent = "Sending...";
    loader.classList.remove("hidden");

    // if all validation passed → call the controller
    submitRegisterController({
        firstName,
        lastName,
        email,
        password
    });

    // --- Remove Loading State ---
    button.disabled = false;
    btnText.textContent = "Create an account";
    loader.classList.add("hidden");
});

// email validation function
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function submitRegisterController(data) {
    const registerPoint=await axios.post(`${__API_URL__}/user/register`, data);
    const data_ = registerPoint.data;
    if(registerPoint.status===200){
        localStorage.setItem("token",data_.token);
        localStorage.setItem("name",data_.name);
        window.location.href = "/index.html";
    }else{
        alert("Login failed: " + data_.message);
    }
}