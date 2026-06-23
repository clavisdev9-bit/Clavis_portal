const token = localStorage.getItem("token");
if (!token) {
    // not logged in, redirect to login page
    window.location.href = "/login.html";
}
window.addEventListener('load', () => {
    const path = window.location.pathname;
    if (path==='/dashboard-sales-activity.html') {
        Alpine.store('app').mode = 'dark';
        Alpine.store('app').sidebar = true;
        document.documentElement.classList.add('dark');
    } else {
        Alpine.store('app').mode = 'light';
        Alpine.store('app').sidebar = false;
        document.documentElement.classList.remove('dark');
    }
});