// Function One: starts the shared setup and prepares the borrow form.
function functionOne() {
    init();
    functionTwo();
    functionThree();
}

// Function Two: fills simple default values for the borrow form.
function functionTwo() {
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

// Function Three: attaches simple interactions to the form and book id field.
function functionThree() {
    var form = document.getElementById("borrow-form");
    var bookInput = document.getElementById("borrow-book-id");

    if (!form || !bookInput) {
        return;
    }

    bookInput.addEventListener("input", functionFour);
    form.addEventListener("submit", functionFive);
    functionFour();
}

// Function Four: shows a small note about the typed book id.
function functionFour() {
    var bookInput = document.getElementById("borrow-book-id");
    var info = document.getElementById("borrow-selected-book");

    if (!bookInput || !info) {
        return;
    }

    info.textContent = bookInput.value ? "Selected book ID: " + bookInput.value : "Enter a book ID to continue.";
}

// Function Five: validates the borrow request and saves a simple demo record.
function functionFive(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var data = getFormData(form);
    var message = document.getElementById("borrow-message");

    if (!data.bookId || !data.borrowDate || !data.returnDate || data.address.trim().length < 5) {
        showMessage(message, "Please complete all borrow fields.", "error");
        return;
    }

    if (data.returnDate <= data.borrowDate) {
        showMessage(message, "Return date must be after borrow date.", "error");
        return;
    }

    var currentUser = getCurrentUser() || { id: 2 };
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
    showMessage(message, "Borrow request saved successfully.", "success");
}

functionOne();
