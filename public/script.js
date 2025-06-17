// 🚀 Improved Page Loading with requestAnimationFrame()
function loadPage(page) {
    fetch(`/pages/${page}`)
        .then(response => response.text())
        .then(data => {
            requestAnimationFrame(() => {
                document.getElementById("page-content").innerHTML = data;
                // Initialize specific page features if needed
            });
        })
        .catch(error => console.error(`Error loading ${page}:`, error));
}
// 🚀 Unified Initialization with setTimeout() for smoother loading
function initializeApp() {
    loadPage('home.html');
}