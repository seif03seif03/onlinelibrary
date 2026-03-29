// Function One: runs the shared page setup for the home page.
function functionOne() {
    init();
    functionTwo();
}

// Function Two: hides the create account button when a user is already logged in.
function functionTwo() {
    var createAccountLink = document.getElementById("create-account-link");
    if (!createAccountLink || !getCurrentUser()) {
        return;
    }

    createAccountLink.style.display = "none";
}

functionOne();
