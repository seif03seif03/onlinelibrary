// Function One: starts the shared setup and prepares the signup form.
function initSignupPage() {
    init();
    bindSignupForm();
}

// Function Two: connects the submit event for the signup form.
function bindSignupForm() {
    var form = document.getElementById("signup-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", submitSignupForm);
}

// Function Three: validates signup values and saves a simple demo account.
function submitSignupForm(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var data = getFormData(form);
    var message = document.getElementById("signup-message");

    if (!validateSignupData(data, message)) {
        return;
    }

    var users = getUsers();
    var newUser = {
        id: nextId(users),
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        address: data.address.trim(),
        phone: data.phone.trim(),
        accountType: data.accountType
    };

    users.push(newUser);
    write(STORAGE_KEYS.users, users);
    write(STORAGE_KEYS.currentUser, newUser);
    showMessage(message, "Account created successfully. Redirecting to home page...", "success");
    form.reset();

    setTimeout(function () {
        location.href = "index.html";
    }, 800);
}

// Function Four: checks the required signup fields before saving.
function validateSignupData(data, message) {
    if (data.username.trim().length < 3) {
        showMessage(message, "Username must be at least 3 characters.", "error");
        return false;
    }

    if (!isValidEmail(data.email)) {
        showMessage(message, "Enter a valid email address.", "error");
        return false;
    }

    if (!isStrongPassword(data.password)) {
        showMessage(message, "Password must contain letters and numbers.", "error");
        return false;
    }

    if (data.password !== data.confirmPassword) {
        showMessage(message, "Passwords do not match.", "error");
        return false;
    }

    if (!isValidPhone(data.phone)) {
        showMessage(message, "Enter a valid phone number.", "error");
        return false;
    }

    return true;
}

initSignupPage();
