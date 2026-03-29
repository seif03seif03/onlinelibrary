// Function One: runs the shared page setup for the home page.
function initHomePage() {
    init();
    hideCreateAccountLink();
}

// Function Two: hides the create account button when a user is already logged in.
function hideCreateAccountLink() {
    var createAccountLink = document.getElementById("create-account-link");
    if (!createAccountLink || !getCurrentUser()) {
        return;
    }

    createAccountLink.style.display = "none";
}

initHomePage();
