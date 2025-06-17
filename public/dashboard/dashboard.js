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

function updateNavbarUserInfo() {
    const userRole = getCookie("role") || "Guest";
    const userName = getCookie("firstName") || "User";

    document.getElementById("user-role").textContent = userRole;
    document.getElementById("user-name").textContent = userName;
}
// ✅ Toggle Profile Dropdown Menu
function toggleProfileMenu() {
    const profileMenu = document.getElementById("profile-menu");
    profileMenu.classList.toggle("hidden");
}

function closeDropdownOnOutsideClick(event) {
    const profileMenu = document.getElementById("profile-menu");
    if (!event.target.closest(".dropdown")) {
        profileMenu.classList.add("hidden");
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
// ✅ Load Footer and Filter Links by Role
async function loadFooter() {
    const userRole = await fetchUserRole(); // ✅ Fetch user role before rendering footer

    fetch("/dashboard/components/footer.html")
        .then(response => response.text())
        .then(html => {
            requestAnimationFrame(() => {
                document.body.insertAdjacentHTML("beforeend", html);
                filterFooterLinks(userRole); // ✅ Filter footer dynamically
                activateNavigation();
            });
        })
        .catch(error => console.error("Error loading footer:", error));
}
async function loadNavBar() {
    fetch("/dashboard/components/navbar.html")
        .then(response => response.text())
        .then(html => {
            requestAnimationFrame(() => {
                document.body.insertAdjacentHTML("beforebegin", html);
            });
        })
        .catch(error => console.error("Error loading Navbar:", error));
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
// ✅ Filter footer links dynamically based on user role
function filterFooterLinks(userRole) {
    document.querySelectorAll("#footer-links .list").forEach(item => {
        const itemRole = item.getAttribute("data-role");
        if (itemRole !== "all" && itemRole !== userRole) {
            item.style.display = "none"; // ✅ Hide links that don’t match the user's role
        }
    });
}

// ✅ Activate Footer Navigation Dynamically
function activateNavigation() {
    document.querySelectorAll(".list a").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const targetPage = link.getAttribute("onclick").split("'")[1];

            requestAnimationFrame(() => {
                loadDashboardPage(targetPage);
                updateActiveNav(targetPage);
            });
        });
    });
}

// ✅ Update Navigation Based on Active Page
function updateActiveNav(activePage) {
    requestAnimationFrame(() => {
        // Remove active classes from all list items, icons, and spinners
        document.querySelectorAll(".list").forEach(item => item.classList.remove("active"));
        document.querySelectorAll(".icon-wrapper").forEach(icon => icon.classList.remove("active"));
        // Remove spinner class from all icons.
        document.querySelectorAll(".list .icon").forEach(icon => icon.classList.remove("spinner"));
        // Find the active list item
        const activeLink = document.querySelector(`.list a[onclick="loadDashboardPage('${activePage}')"]`);
        if (activeLink) {
            const listItem = activeLink.closest(".list");
            listItem.classList.add("active");
            listItem.querySelector(".icon-wrapper").classList.add("active");
            // ✅ Add spinner class to the icon element
            listItem.querySelector(".icon").classList.add("spinner");
            // ✅ Activate the spinner inside the icon element
        }
    });
}

function handleNavbarScroll() {
    window.addEventListener("scroll", () => {
        const navbar = document.querySelector(".navbar");
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });
}

function initializeDashboard() {
    loadNavBar();
    loadFooter();
    setTimeout(() => {
        loadDashboardPage('home.html');
        activateNavigation(); // Initializes navigation after footer loads
        handleNavbarScroll(); // Handles navbar scroll effect
    }, 500);
};
window.onload = initializeDashboard;