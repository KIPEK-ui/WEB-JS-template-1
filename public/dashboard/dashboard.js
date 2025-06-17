async function fetchUserRole() {
    const userRole = getCookie("role"); // ✅ Use cookies first
    if (userRole) return userRole;

    try {
        const response = await fetch("/api/user-role", { method: "GET", credentials: "include" });
        const data = await response.json();
        if (!data.role) throw new Error("Role not found!");

        return data.role;
    } catch (error) {
        console.error("❌ Error fetching user role:", error);
        return null;
    }

}
async function loadDashboardPage(page = "") {
    const userRole = await fetchUserRole();
    if (!userRole) {
        console.warn("User role not found—stopping dashboard load.");
        return;
    }

    if (!page) {
        console.warn("No specific page requested—waiting for user selection.");
        return;
    }

    fetch(`/dashboard/pages/${userRole}/${page}`)
        .then(response => response.text())
        .then(data => {
            requestAnimationFrame(() => {
                document.getElementById("dashboard-content").innerHTML = data;
            });
        })
        .catch(error => console.error(`Error loading ${page}:`, error));
}
// ✅ Logout - Clear Cookies, Reset Session, and Redirect Properly
function logout() {
    fetch("/logout", { method: "POST", credentials: "include" })
        .then(response => {
            if (!response.ok) throw new Error("Logout request failed");

            return response.json();
        })
        .then(data => {
            console.log(data.msg); // ✅ Log response message

            // ✅ Display logout success message before redirecting
            alert("✅ " + data.msg + "- Redirecting to home page...");

            setTimeout(() => {
                window.location.href = "/"; // ✅ Redirect after alert
            }, 1000); // Small delay for better user experience
        })
        .catch(error => {
            console.error("❌ Error logging out:", error);
            alert("❌ Logout failed! Please try again.");
        });
}
//----------------------HELPER FUNCTIONS--------------------------------------------------------------------
const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get("message");
if (message) {
    alert(message);
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
}

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = text;
    } else {
        console.warn(`Element with id "${id}" not found!`);
    }
}

function initializeDashboard() {
    loadDashboardPage('home.html');
}