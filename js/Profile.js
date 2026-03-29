// Function One: runs the shared page setup for the profile page.
function functionOne() {
    init();
    functionTwo();
}

// Function Two: reads the current saved user and fills the profile fields.
function functionTwo() {
    var currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }

    functionThree("profile-username", currentUser.username);
    functionThree("profile-role", functionFour(currentUser.accountType));
    functionThree("profile-email", currentUser.email);
    functionThree("profile-address", currentUser.address);
    functionThree("profile-phone", currentUser.phone);
}

// Function Three: writes one text value into one profile field.
function functionThree(elementId, value) {
    var element = document.getElementById(elementId);
    if (!element) {
        return;
    }

    element.textContent = value || "-";
}

// Function Four: formats the saved role text for display.
function functionFour(role) {
    if (!role) {
        return "User";
    }

    return role.charAt(0).toUpperCase() + role.slice(1);
}

functionOne();
