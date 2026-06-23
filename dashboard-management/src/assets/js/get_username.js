let username = localStorage.getItem("name");
console.log(username);
document.getElementById("username").textContent = username || "";