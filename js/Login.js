// Function One: starts the shared setup and prepares the login form.
function functionOne() {
    init();
    functionTwo();
}

// Function Two: attaches the submit event to the login form.
function functionTwo() {
    var form = document.getElementById("login-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", functionThree);
}

// Function Three: validates the form, checks the account, and redirects after login.
function functionThree(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var message = document.getElementById("login-message");
    var data = getFormData(form);

    if (!functionFour(data, message)) {
        return;
    }

    var user = functionFive(data.identifier, data.password);
    if (!user) {
        showMessage(message, "Incorrect login details. Try again.", "error");
        return;
    }

    write(STORAGE_KEYS.currentUser, user);
    showMessage(message, "Login successful. Redirecting...", "success");

    setTimeout(function () {
        location.href = user.accountType === "admin" ? "Admin/ManageBook.html" : "User/Profile.html";
    }, 800);
}

// Function Four: checks that the basic required fields are filled correctly.
function functionFour(data, message) {
    if (!data.identifier.trim() || !data.password.trim()) {
        showMessage(message, "Please enter username or email and password.", "error");
        return false;
    }

    return true;
}

// Function Five: searches the static demo accounts saved in local storage.
function functionFive(identifier, password) {
    var normalizedValue = identifier.trim().toLowerCase();

    return getUsers().find(function (user) {
        var matchesName = user.username.toLowerCase() === normalizedValue;
        var matchesEmail = user.email.toLowerCase() === normalizedValue;
        return (matchesName || matchesEmail) && user.password === password;
    });
}

functionOne();
