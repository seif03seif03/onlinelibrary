// Function One: runs the shared page setup for the home page.
function initHomePage() {
    init();
    hideCreateAccountLink();
    updateAudienceStat();
}

// Function Two: hides the create account button when a user is already logged in.
function hideCreateAccountLink() {
    var createAccountLink = document.getElementById("create-account-link");
    if (!createAccountLink || !getCurrentUser()) {
        return;
    }

    createAccountLink.style.display = "none";
}

// Function Three: switches the last stat between admin and public data.
function updateAudienceStat() {
    var statValue = document.getElementById("audience-stat-value");
    var statLabel = document.getElementById("audience-stat-label");
    var currentUser = getCurrentUser();

    if (!statValue || !statLabel) {
        return;
    }

    if (currentUser && currentUser.accountType === "admin") {
        statValue.textContent = String(getUsers().length);
        statLabel.textContent = "Registered Users";
        return;
    }

    statValue.textContent = String(getBorrowableBooksCount());
    statLabel.textContent = "Books Available for Borrowing";
}

// Function Four: counts books that can still be borrowed.
function getBorrowableBooksCount() {
    return getBooks().filter(function (book) {
        if (book.canBorrow === false) {
            return false;
        }

        if (typeof book.availableCopies !== "undefined") {
            return Number(book.availableCopies) > 0;
        }

        return true;
    }).length;
}

initHomePage();
