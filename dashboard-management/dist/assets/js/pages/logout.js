
document.getElementById("logout_button").addEventListener("click", function (e) {
    console.log('logout button')
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    window.location.href = "/login.html";
});