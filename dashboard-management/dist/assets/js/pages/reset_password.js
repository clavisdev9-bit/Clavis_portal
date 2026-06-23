document.getElementById("send_reset_button").addEventListener("click", async () => {
    const email = document.getElementById("resetEmail").value.trim();
    const button = document.getElementById("send_reset_button");
    const btnText = document.getElementById("send_reset_text");
    const loader = document.getElementById("send_reset_loader");
    if (!email) {
        return alert("Email is required!");
    }

    // --- Show Loading State ---
    button.disabled = true;
    btnText.textContent = "Sending...";
    loader.classList.remove("hidden");

    try {
        const response = await fetch(`${__API_URL__}/user/send-reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });
        if (!response.ok) {
            return alert("Failed to send reset link");
        }
        showSuccessToast("Password reset link sent successfully!");

    } catch (err) {
        console.error("Error:", err);
        alert("Failed to send request. Please try again later.");
    }

    // --- Remove Loading State ---
    button.disabled = false;
    btnText.textContent = "Email Password Reset Link";
    loader.classList.add("hidden");
});

function showSuccessToast(message = "Success!") {
    const toast = document.getElementById("successToast");
    toast.textContent = message;

    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.remove("opacity-0"), 50);

}