var STORAGE_KEYS = {
    books: "libraryBooks",
    users: "libraryUsers",
    borrowings: "libraryBorrowings",
    currentUser: "libraryCurrentUser"
};

var FALLBACK_IMAGE = "images/thegreatgatsby.jpg";

// Function One: starts the shared setup used by all pages.
function init() {
    seedDemoData();
    setupNavbar();
    highlightNav();
}

// Function Two: saves simple static demo data for forms and login.
function seedDemoData() {
    if (!read(STORAGE_KEYS.books)) {
        write(STORAGE_KEYS.books, [
            { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Classic", description: "A polished portrait of glamour, longing, and the cost of chasing an impossible dream." },
            { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee", category: "Novel", description: "A humane story about justice, empathy, and courage in a divided Southern town." },
            { id: 3, title: "1984", author: "George Orwell", category: "Science Fiction", description: "A chilling dystopian warning about surveillance, propaganda, and truth erased by power." },
            { id: 4, title: "The Hobbit", author: "J.R.R. Tolkien", category: "Fantasy", description: "A warm fantasy adventure that turns an unlikely hero into a brave traveler." },
            { id: 5, title: "Fahrenheit 451", author: "Ray Bradbury", category: "Dystopian", description: "A swift dystopian novel where reading becomes rebellion in a numbed-out society." },
            { id: 6, title: "Moby-Dick", author: "Herman Melville", category: "Adventure", description: "A vast sea voyage transformed by obsession, vengeance, and the mystery of the whale." },
            { id: 7, title: "Pride and Prejudice", author: "Jane Austen", category: "Romance", description: "A witty romantic classic about manners, misunderstanding, and emotional honesty." },
            { id: 8, title: "The Catcher in the Rye", author: "J.D. Salinger", category: "Coming-of-Age", description: "A deeply personal coming-of-age novel shaped by loneliness and teenage unrest." },
            { id: 9, title: "A Song of Ice and Fire", author: "George R.R. Martin", category: "Epic Fantasy", description: "An epic fantasy world of rival houses, fragile alliances, and ambition sharpened by war." }
        ]);
    }

    if (!read(STORAGE_KEYS.users)) {
        write(STORAGE_KEYS.users, [
            {
                id: 1,
                username: "admin",
                email: "admin@library.com",
                password: "Admin123!",
                address: "Main Library Branch",
                phone: "01000000000",
                accountType: "admin"
            },
            {
                id: 2,
                username: "reader",
                email: "reader@library.com",
                password: "Reader123!",
                address: "Cairo, Egypt",
                phone: "01111111111",
                accountType: "user"
            }
        ]);
    }

    if (!read(STORAGE_KEYS.borrowings)) {
        write(STORAGE_KEYS.borrowings, [
            {
                id: 301,
                userId: 2,
                bookId: 1,
                bookTitle: "The Great Gatsby",
                borrowDate: "2026-03-20",
                returnDate: "2026-04-02",
                status: "Borrowed"
            }
        ]);
    }
}

// Function Three: reads the saved book list from local storage.
function getBooks() {
    return read(STORAGE_KEYS.books) || [];
}

// Function Four: reads the saved user list from local storage.
function getUsers() {
    return read(STORAGE_KEYS.users) || [];
}

// Function Five: reads the saved borrowing list from local storage.
function getBorrowings() {
    return read(STORAGE_KEYS.borrowings) || [];
}

// Function Six: reads the current logged in user from local storage.
function getCurrentUser() {
    return read(STORAGE_KEYS.currentUser);
}

// Function Seven: reads and parses a value from local storage.
function read(key) {
    var value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

// Function Eight: saves a value in local storage.
function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Function Nine: collects form values in a simple object.
function getFormData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

// Function Ten: returns the next numeric id for a collection.
function nextId(collection) {
    return collection.length ? Math.max.apply(null, collection.map(function (item) {
        return Number(item.id);
    })) + 1 : 1;
}

// Function Eleven: writes a message and style class into a message element.
function showMessage(element, message, type) {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = "form-message " + type;
}

// Function Twelve: checks whether an email value looks valid.
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Function Thirteen: checks whether a password is strong enough.
function isStrongPassword(password) {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

// Function Fourteen: checks whether a phone number format is valid.
function isValidPhone(phone) {
    return /^\+?\d{10,15}$/.test(phone.trim());
}

// Function Fifteen: returns the right path based on the current folder.
function navPath(rootPath, userPath, adminPath) {
    if (location.pathname.includes("/User/")) {
        return userPath;
    }

    if (location.pathname.includes("/Admin/")) {
        return adminPath;
    }

    return rootPath;
}

// Function Sixteen: checks whether the current page is in the root folder.
function isRootPage() {
    return !location.pathname.includes("/User/") && !location.pathname.includes("/Admin/");
}

// Function Seventeen: escapes text before showing it inside HTML.
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
