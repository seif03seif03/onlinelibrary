// Function One: starts the shared setup and prepares the edit form.
function initEditBookPage() {
    init();
    bindEditBookForm();
}

// Function Two: attaches submit handling to the edit book form.
function bindEditBookForm() {
    var form = document.getElementById("edit-book-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", submitEditBookForm);
}

// Function Three: validates the edited values and shows a success message.
function submitEditBookForm(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var data = getFormData(form);
    var message = document.getElementById("edit-book-message");

    if (!validateBookData(data, message)) {
        return;
    }

    showMessage(message, "Book updated successfully.", "success");
}

// Function Four: checks the basic fields before saving the edit.
function validateBookData(data, message) {
    if (data.title.trim().length < 2 || data.author.trim().length < 2 || data.category.trim().length < 2) {
        showMessage(message, "Title, author, and category are required.", "error");
        return false;
    }

    if (data.description.trim().length < 10) {
        showMessage(message, "Description must be at least 10 characters.", "error");
        return false;
    }

    return true;
}

initEditBookPage();
