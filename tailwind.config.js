module.exports = {
    content: [
        "./public/**/*.html",
        "./public/**/*.js",
        "./public/dashboard/**/*.html",
        "./public/dashboard/**/*.js",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2563eb",
                secondary: "#14b8a6",
                accent: "#ec4899",
                dark: "#1e293b",
                light: "#f1f5f9",
            },
            fontFamily: {
                heading: ["Roboto Slab", "serif"],
                body: ["Poppins", "sans-serif"],
            },
        },
    },
    darkMode: "class",
    plugins: [],
};