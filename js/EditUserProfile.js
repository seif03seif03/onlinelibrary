// Function One: starts the shared page setup and prepares the profile form.
function functionOne() {
    init();
    functionTwo();
}

// Function Two: attaches the submit event to the edit profile form.
function functionTwo() {
    var form = document.getElementById("edit-profile-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", functionThree);
}

// Function Three: validates the values and saves the simple updated profile.
function functionThree(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var message = document.getElementById("edit-profile-message");
    var data = getFormData(form);

    if (!functionFour(data, message)) {
        return;
    }

    var currentUser = getCurrentUser() || {
        id: 2,
        password: "Reader123!",
        accountType: "user"
    };

    var updatedUser = {
        id: currentUser.id,
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        password: currentUser.password,
        address: data.address.trim(),
        phone: data.phone.trim(),
        accountType: currentUser.accountType
    };

    write(STORAGE_KEYS.currentUser, updatedUser);
    showMessage(message, "Profile updated successfully.", "success");
}

// Function Four: checks the form fields before saving the profile.
function functionFour(data, message) {
    if (data.username.trim().length < 3) {
        showMessage(message, "Username must be at least 3 characters.", "error");
        return false;
    }

    if (!isValidEmail(data.email)) {
        showMessage(message, "Enter a valid email address.", "error");
        return false;
    }

    if (!isValidPhone(data.phone)) {
        showMessage(message, "Enter a valid phone number.", "error");
        return false;
    }

    if (data.address.trim().length < 5) {
        showMessage(message, "Address must be more clear.", "error");
        return false;
    }

    return true;
}

functionOne();
