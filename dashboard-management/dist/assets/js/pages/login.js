import axios from "axios";
document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault(); // stop default form submit
    const button = document.getElementById("send_login_button");
    const btnText = document.getElementById("send_login_text");
    const loader = document.getElementById("send_login_loader");
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    // basic validation

    if (!validateEmail(email)) {
        alert("Please enter a valid email");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }
    // --- Show Loading State ---
    button.disabled = true;
    btnText.textContent = "Sending...";
    loader.classList.remove("hidden");

    // if all validation passed → call the controller
    submitLoginController({
        email,
        password
    });

    button.disabled = false;
    btnText.textContent = "Sign In";
    loader.classList.add("hidden");
});

// email validation function
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function submitLoginController(data) {
    try {
        const registerPoint = await axios.post(`${__API_URL__}/user/login`, data);
        const data_ = registerPoint.data;

        if (registerPoint.status === 200) {
            localStorage.setItem("token", data_.token);
            localStorage.setItem("name", data_.user.name);
            localStorage.setItem("company", data_.user.company);
            localStorage.setItem("id_user", data_.user.id);
            window.location.href = "/index.html";
        }
    } catch (err) {
        // Jika response dari backend ada status code
        if (err.response) {
            const status = err.response.status;

            if (status === 404) {
                showErrorToast("Email not found!");
            }
            else if (status === 401) {
                showErrorToast("Invalid password!");
            } 
            else {
                showErrorToast("Login failed, please try again.");
            }
        } 
        else {
            showErrorToast("Network error, please check your connection.");
        }
    }
}
function showErrorToast(message) {
    const toast = document.getElementById("errorToast");

    toast.textContent = message;
    toast.classList.remove("hidden");
    
    // Show animation
    setTimeout(() => {
        toast.classList.remove("opacity-0");
        toast.classList.add("opacity-100");
    }, 10);
}
