const token = localStorage.getItem("token");
if (token) {
    // not logged in, redirect to login page
    window.location.replace("/index.html");
}