var STORAGE_KEYS = {
    books: "libraryBooks",
    users: "libraryUsers",
    borrowings: "libraryBorrowings",
    currentUser: "libraryCurrentUser"
};

var FALLBACK_IMAGE = "images/thegreatgatsby.jpg";
var page = document.body.dataset.page || "";

function init() {
    seedData();
    setupNavbar();
    highlightNav();
    runPage();
}

function seedData() {
    if (!read(STORAGE_KEYS.books)) {
        write(STORAGE_KEYS.books, [
            {
                id: 1,
                title: "The Great Gatsby",
                author: "F. Scott Fitzgerald",
                category: "Classic",
                description: "A novel about ambition, illusion, and the cost of chasing a dream.",
                image: "images/thegreatgatsby.jpg",
                isActive: true,
                canBorrow: true,
                availableCopies: 4
            },
            {
                id: 2,
                title: "To Kill a Mockingbird",
                author: "Harper Lee",
                category: "Novel",
                description: "A thoughtful story about justice, empathy, and courage.",
                image: "images/To Kill a Mockingbird.jpg",
                isActive: true,
                canBorrow: false,
                availableCopies: 0
            },
            {
                id: 3,
                title: "1984",
                author: "George Orwell",
                category: "Science Fiction",
                description: "A dystopian story about surveillance, control, and truth.",
                image: "images/1984 by George Orwell.jpg",
                isActive: true,
                canBorrow: true,
                availableCopies: 3
            },
            {
                id: 4,
                title: "The Hobbit",
                author: "J.R.R. Tolkien",
                category: "Fantasy",
                description: "A fantasy adventure following Bilbo on an unexpected journey.",
                image: "images/thehobbit.jpg",
                isActive: true,
                canBorrow: true,
                availableCopies: 5
            }
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
        write(STORAGE_KEYS.borrowings, []);
    }
}

function runPage() {
    switch (page) {
        case "home":
            renderStats();
            renderBooksGrid("featured-books", getBooks().slice(0, 3));
            break;
        case "books":
            renderBooksGrid("all-books", getBooks());
            break;
        case "signup":
            bindSignup();
            break;
        case "login":
            bindLogin();
            break;
        case "search":
            bindSearch();
            break;
        case "details":
            renderBookDetails();
            break;
        case "borrow":
            bindBorrow();
            break;
        case "my-books":
            renderMyBooks();
            break;
        case "profile":
            renderProfile();
            break;
        case "edit-profile":
            bindProfileEdit();
            break;
        case "manage-books":
            bindManageBooks();
            break;
        case "add-book":
            bindAddBook();
            break;
        case "edit-book":
            bindEditBook();
            break;
        default:
            break;
    }
}

function getBooks() {
    return read(STORAGE_KEYS.books) || [];
}

function getUsers() {
    return read(STORAGE_KEYS.users) || [];
}

function getBorrowings() {
    return read(STORAGE_KEYS.borrowings) || [];
}

function getCurrentUser() {
    return read(STORAGE_KEYS.currentUser);
}

function read(key) {
    var value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getFormData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function nextId(collection) {
    return collection.length ? Math.max.apply(null, collection.map(function (item) {
        return Number(item.id);
    })) + 1 : 1;
}

function showMessage(element, message, type) {
    if (!element) {
        return;
    }
    element.textContent = message;
    element.className = "form-message " + type;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isStrongPassword(password) {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function isValidPhone(phone) {
    return /^\+?\d{10,15}$/.test(phone.trim());
}

function setText(id, value) {
    var element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function detailPath(bookId) {
    return isRootPage() ? "User/BookDetails.html?id=" + bookId : "BookDetails.html?id=" + bookId;
}

function borrowPath(bookId) {
    return isRootPage() ? "User/BorrowBooks.html?bookId=" + bookId : "BorrowBooks.html?bookId=" + bookId;
}

function navPath(rootPath, userPath, adminPath) {
    if (location.pathname.includes("/User/")) {
        return userPath;
    }
    if (location.pathname.includes("/Admin/")) {
        return adminPath;
    }
    return rootPath;
}

function isRootPage() {
    return !location.pathname.includes("/User/") && !location.pathname.includes("/Admin/");
}

function normalizeImagePath(path) {
    if (!path) {
        path = FALLBACK_IMAGE;
    }
    if (path.startsWith("data:") || path.startsWith("http")) {
        return path;
    }
    if (isRootPage()) {
        return path.replace(/^\.\.\//, "");
    }
    return path.startsWith("../") ? path : "../" + path;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function fileToDataUrl(file, fallbackPath) {
    if (!file) {
        return Promise.resolve(fallbackPath);
    }
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
            resolve(String(reader.result));
        };
        reader.onerror = function () {
            reject(new Error("Unable to read image file."));
        };
        reader.readAsDataURL(file);
    });
}
