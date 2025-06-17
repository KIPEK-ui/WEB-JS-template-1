// 🚀 Activate Footer Navigation (Using `onclick` and requestAnimationFrame)
function activateNavigation() {
    document.querySelectorAll(".list a").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const targetPage = link.getAttribute("onclick").split("'")[1];

            requestAnimationFrame(() => {
                loadPage(targetPage);
                updateActiveNav(targetPage);
            });
        });
    });
}

function updateActiveNav(activePage) {
    requestAnimationFrame(() => {
        // Remove active class from all items
        document.querySelectorAll(".list").forEach(item => item.classList.remove("active"));
        document.querySelectorAll(".list .icon").forEach(icon => icon.classList.remove("spinner"));


        // Select the correct footer item based on `onclick`
        const activeLink = document.querySelector(`.list a[onclick="loadPage('${activePage}')"]`);
        if (activeLink) {
            activeLink.closest(".list").classList.add("active");

            // Ensure `.icon-wrapper` updates correctly
            document.querySelectorAll(".icon-wrapper").forEach(icon => icon.classList.remove("active"));
            document.querySelectorAll(".list .icon").forEach(icon => icon.classList.remove("spinner"));

            activeLink.querySelector(".icon-wrapper").classList.add("active");
            activeLink.querySelector(".icon").classList.add("spinner");

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
// ✅ Function to Open Modal
function openSigninModal() {
    document.getElementById("authModal").classList.remove("hidden");
}

// ✅ Function to Close Modal
function closeSigninModal() {
    document.getElementById("authModal").classList.add("hidden");
}

function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    loginUser(email, password);
}

async function loginUser(email, password) {
    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ Login Successful!");
            closeModal(); // Close modal on success
            window.location.href = "/dashboard"; // Redirect to dashboard
        } else {
            alert(`❌ Login Failed: ${result.message}`);
        }
    } catch (error) {
        alert("❌ Error logging in. Please try again.");
    }
}


function loadNavbar() {
    fetch("/components/navbar.html")
        .then(response => response.text())
        .then(html => {
            requestAnimationFrame(() => {
                document.body.insertAdjacentHTML("beforebegin", html);
            });
        })

}

function loadFooter() {
    fetch("/components/footer.html")
        .then(response => response.text())
        .then(html => {
            requestAnimationFrame(() => {
                document.body.insertAdjacentHTML("beforeend", html);
                activateNavigation(); // Initializes navigation after footer loads
            });
        })
        .catch(error => console.error("Error loading footer:", error));
}
// 🚀 Improved Page Loading with requestAnimationFrame()
function loadPage(page, effect = "fade") {
    const pageContent = document.getElementById("page-content");

    pageContent.classList.add(`${effect}-enter`);

    fetch(`/pages/${page}`)
        .then(response => response.text())
        .then(data => {
            requestAnimationFrame(() => {
                pageContent.innerHTML = data;

                setTimeout(() => {
                    pageContent.classList.remove(`${effect}-enter`);
                    pageContent.classList.add(`${effect}-enter-active`);
                }, 100);
            });
        })
        .catch(error => console.error(`❌ Error loading ${page}:`, error));
}
// 🚀 Unified Initialization with setTimeout() for smoother loading
function initializeApp() {
    loadNavbar();
    loadFooter();
    setTimeout(() => {
        loadPage('home.html');
        activateNavigation(); // Initializes navigation after footer loads
        handleNavbarScroll(); // Handles navbar scroll effect
    }, 500);
    handleLogin(); // Handles login form submission
}