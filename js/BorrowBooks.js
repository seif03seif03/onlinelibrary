// Function One: starts the shared setup and prepares the borrow form.
function initBorrowBooksPage() {
    init();
    requireSignedInUser();
    fillBorrowDefaults();
    bindBorrowForm();
}

// Function Two: redirects guests away from the borrow form.
function requireSignedInUser() {
    var currentUser = getCurrentUser();
    var message = document.getElementById("borrow-message");
    var form = document.getElementById("borrow-form");

    if (currentUser) {
        return;
    }

    if (form) {
        form.querySelectorAll("input, button").forEach(function (field) {
            field.disabled = true;
        });
    }

    showMessage(message, "Please sign in before submitting a borrow request.", "error");

    setTimeout(function () {
        location.href = "../Login.html";
    }, 1000);
}

// Function Three: fills simple default values for the borrow form.
function fillBorrowDefaults() {
    var addressInput = document.getElementById("borrow-address");
    var borrowDateInput = document.getElementById("borrow-date");
    var bookIdInput = document.getElementById("borrow-book-id");
    var currentUser = getCurrentUser();
    var queryBookId = new URLSearchParams(location.search).get("bookId");

    if (addressInput && currentUser) {
        addressInput.value = currentUser.address || "";
    }

    if (borrowDateInput && !borrowDateInput.value) {
        borrowDateInput.value = new Date().toISOString().split("T")[0];
    }

    if (bookIdInput && queryBookId) {
        bookIdInput.value = queryBookId;
    }
}

// Function Four: attaches simple interactions to the form and book id field.
function bindBorrowForm() {
    var form = document.getElementById("borrow-form");
    var bookInput = document.getElementById("borrow-book-id");

    if (!form || !bookInput || !getCurrentUser()) {
        return;
    }

    bookInput.addEventListener("input", updateSelectedBookNote);
    form.addEventListener("submit", submitBorrowRequest);
    updateSelectedBookNote();
}

// Function Five: shows a small note about the typed book id.
function updateSelectedBookNote() {
    var bookInput = document.getElementById("borrow-book-id");
    var info = document.getElementById("borrow-selected-book");

    if (!bookInput || !info) {
        return;
    }

    info.textContent = bookInput.value ? "Selected book ID: " + bookInput.value : "Enter a book ID to continue.";
}

// Function Six: validates the borrow request and saves a simple demo record.
function submitBorrowRequest(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var data = getFormData(form);
    var message = document.getElementById("borrow-message");
    var currentUser = getCurrentUser();

    if (!currentUser) {
        showMessage(message, "Please sign in before submitting a borrow request.", "error");
        setTimeout(function () {
            location.href = "../Login.html";
        }, 1000);
        return;
    }

    if (!data.bookId || !data.borrowDate || !data.returnDate || data.address.trim().length < 5) {
        showMessage(message, "Please complete all borrow fields.", "error");
        return;
    }

    if (data.returnDate <= data.borrowDate) {
        showMessage(message, "Return date must be after borrow date.", "error");
        return;
    }

    var borrowings = getBorrowings();

    borrowings.push({
        id: nextId(borrowings),
        userId: currentUser.id,
        bookId: Number(data.bookId),
        bookTitle: "Static Library Book",
        borrowDate: data.borrowDate,
        returnDate: data.returnDate,
        status: "Pending"
    });

    write(STORAGE_KEYS.borrowings, borrowings);
    showMessage(message, "Borrow request saved successfully. Redirecting to home page...", "success");

    setTimeout(function () {
        location.href = "../index.html";
    }, 800);
}

initBorrowBooksPage();
