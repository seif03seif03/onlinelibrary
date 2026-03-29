// Function One: runs the shared page setup for the profile page.
function initProfilePage() {
    init();
    fillProfileFields();
}

// Function Two: reads the current saved user and fills the profile fields.
function fillProfileFields() {
    var currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }

    setProfileField("profile-username", currentUser.username);
    setProfileField("profile-role", formatRole(currentUser.accountType));
    setProfileField("profile-email", currentUser.email);
    setProfileField("profile-address", currentUser.address);
    setProfileField("profile-phone", currentUser.phone);
}

// Function Three: writes one text value into one profile field.
function setProfileField(elementId, value) {
    var element = document.getElementById(elementId);
    if (!element) {
        return;
    }

    element.textContent = value || "-";
}

// Function Four: formats the saved role text for display.
function formatRole(role) {
    if (!role) {
        return "User";
    }

    return role.charAt(0).toUpperCase() + role.slice(1);
}

initProfilePage();
