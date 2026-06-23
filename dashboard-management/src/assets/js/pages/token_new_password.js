// Ambil token dari URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

if (!token) {
    alert("Invalid reset link");
}

document.getElementById("send_reset_button").addEventListener("click", async (e) => {
    e.preventDefault();

    const password = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;

    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) return alert("Token missing!");

    if (password !== confirm) return alert("Passwords do not match!");

    const response = await fetch(`${__API_URL__}/user/set_new_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
    });
    console.log(response);
    if (!response.ok) return alert("Failed to reset password");

    alert("Password updated successfully!");
    window.location.href = "login.html";
});
