function renderStats() {
    var books = getBooks();
    var users = getUsers();
    var available = books.reduce(function (sum, book) {
        return sum + Number(book.availableCopies || 0);
    }, 0);
    setText("stat-books", String(books.length));
    setText("stat-available", String(available));
    setText("stat-users", String(users.length));
}

function renderBooksGrid(targetId, books) {
    var container = document.getElementById(targetId);
    if (!container) {
        return;
    }

    if (!books.length) {
        container.innerHTML = '<div class="empty-state">No books are available right now.</div>';
        return;
    }

    container.innerHTML = books.map(function (book) {
        var borrowable = book.isActive && book.canBorrow && Number(book.availableCopies) > 0;
        var imagePath = normalizeImagePath(book.image);
        return [
            '<article class="book-card">',
            '<div class="book-cover"><img src="' + imagePath + '" alt="' + escapeHtml(book.title) + '"></div>',
            "<div><h3>" + escapeHtml(book.title) + "</h3><p>by " + escapeHtml(book.author) + "</p></div>",
            '<div class="book-meta">',
            '<span class="tag">' + escapeHtml(book.category) + "</span>",
            '<span class="tag ' + (borrowable ? "success" : "danger") + '">' + (borrowable ? "Available" : "Not Available") + "</span>",
            "</div>",
            '<div class="inline-actions">',
            '<a class="button button-secondary" href="' + detailPath(book.id) + '">More Info</a>',
            '<a class="button ' + (borrowable ? "button-primary" : "button-secondary") + '" href="' + borrowPath(book.id) + '">' + (borrowable ? "Borrow" : "View") + "</a>",
            "</div>",
            "</article>"
        ].join("");
    }).join("");
}

function bindSignup() {
    var form = document.getElementById("signup-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = getFormData(form);
        var message = document.getElementById("signup-message");
        var users = getUsers();

        if (data.username.trim().length < 3) {
            return showMessage(message, "Username must be at least 3 characters.", "error");
        }
        if (!isValidEmail(data.email)) {
            return showMessage(message, "Enter a valid email address.", "error");
        }
        if (!isStrongPassword(data.password)) {
            return showMessage(message, "Password must be at least 8 characters and include letters and numbers.", "error");
        }
        if (data.password !== data.confirmPassword) {
            return showMessage(message, "Passwords do not match.", "error");
        }
        if (!isValidPhone(data.phone)) {
            return showMessage(message, "Enter a valid phone number using 10 to 15 digits.", "error");
        }
        if (users.some(function (user) {
            return user.username.toLowerCase() === data.username.toLowerCase() || user.email.toLowerCase() === data.email.toLowerCase();
        })) {
            return showMessage(message, "Username or email already exists.", "error");
        }

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
        showMessage(message, "Account created successfully. Redirecting...", "success");
        form.reset();
        setTimeout(function () {
            location.href = newUser.accountType === "admin" ? "Admin/ManageBook.html" : "User/Profile.html";
        }, 900);
    });
}

function bindLogin() {
    var form = document.getElementById("login-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = getFormData(form);
        var message = document.getElementById("login-message");

        if (!data.identifier.trim() || !data.password.trim()) {
            return showMessage(message, "Please enter both your username/email and password.", "error");
        }

        var user = getUsers().find(function (item) {
            var match = item.username.toLowerCase() === data.identifier.trim().toLowerCase()
                || item.email.toLowerCase() === data.identifier.trim().toLowerCase();
            return match && item.password === data.password;
        });

        if (!user) {
            return showMessage(message, "Incorrect login details. Try again.", "error");
        }

        write(STORAGE_KEYS.currentUser, user);
        showMessage(message, "Login successful. Redirecting...", "success");
        setTimeout(function () {
            location.href = user.accountType === "admin" ? "Admin/ManageBook.html" : "User/Profile.html";
        }, 900);
    });
}

function bindSearch() {
    var form = document.getElementById("search-form");
    var category = document.getElementById("search-category");
    var message = document.getElementById("search-message");
    if (!form || !category) {
        return;
    }

    var categories = Array.from(new Set(getBooks().map(function (book) {
        return book.category;
    })));
    category.innerHTML += categories.map(function (item) {
        return '<option value="' + escapeHtml(item) + '">' + escapeHtml(item) + "</option>";
    }).join("");

    function performSearch() {
        var data = getFormData(form);
        var filtered = getBooks().filter(function (book) {
            var titleMatch = !data.title || book.title.toLowerCase().includes(data.title.trim().toLowerCase());
            var authorMatch = !data.author || book.author.toLowerCase().includes(data.author.trim().toLowerCase());
            var categoryMatch = !data.category || book.category === data.category;
            return titleMatch && authorMatch && categoryMatch;
        });
        renderBooksGrid("search-results", filtered);
        showMessage(message, filtered.length + " book(s) found.", filtered.length ? "success" : "error");
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        performSearch();
    });

    document.getElementById("clear-search").addEventListener("click", function () {
        form.reset();
        renderBooksGrid("search-results", getBooks());
        showMessage(message, "Search filters cleared.", "success");
    });

    renderBooksGrid("search-results", getBooks());
}

function renderBookDetails() {
    var container = document.getElementById("book-details");
    if (!container) {
        return;
    }

    var bookId = Number(new URLSearchParams(location.search).get("id"));
    var book = getBooks().find(function (item) {
        return item.id === bookId;
    }) || getBooks()[0];

    if (!book) {
        container.innerHTML = '<div class="empty-state">No book details could be loaded.</div>';
        return;
    }

    var borrowable = book.isActive && book.canBorrow && Number(book.availableCopies) > 0;
    container.innerHTML = [
        '<p class="eyebrow">Book Details</p>',
        "<h1>" + escapeHtml(book.title) + "</h1>",
        '<div class="book-cover detail-cover"><img src="' + normalizeImagePath(book.image) + '" alt="' + escapeHtml(book.title) + '"></div>',
        '<dl class="detail-list">',
        "<div><dt>Book ID</dt><dd>" + book.id + "</dd></div>",
        "<div><dt>Author</dt><dd>" + escapeHtml(book.author) + "</dd></div>",
        "<div><dt>Category</dt><dd>" + escapeHtml(book.category) + "</dd></div>",
        "<div><dt>Description</dt><dd>" + escapeHtml(book.description) + "</dd></div>",
        "<div><dt>Status</dt><dd>" + (borrowable ? "Available for borrowing" : "Currently unavailable") + "</dd></div>",
        "<div><dt>Available Copies</dt><dd>" + Number(book.availableCopies) + "</dd></div>",
        "</dl>",
        '<div class="inline-actions detail-actions">',
        '<a class="button button-primary" href="' + borrowPath(book.id) + '">Borrow This Book</a>',
        '<a class="button button-secondary" href="../AllBooks.html">Back to Books</a>',
        "</div>"
    ].join("");
}

function bindBorrow() {
    var form = document.getElementById("borrow-form");
    if (!form) {
        return;
    }

    var currentUser = getCurrentUser();
    var message = document.getElementById("borrow-message");
    var addressInput = document.getElementById("borrow-address");
    var bookIdInput = document.getElementById("borrow-book-id");
    var borrowDateInput = document.getElementById("borrow-date");
    var selectedBook = document.getElementById("borrow-selected-book");

    if (currentUser) {
        addressInput.value = currentUser.address || "";
    }

    var queryBookId = new URLSearchParams(location.search).get("bookId");
    if (queryBookId) {
        bookIdInput.value = queryBookId;
    }

    borrowDateInput.value = new Date().toISOString().split("T")[0];

    function updateSelectedBook() {
        var book = getBooks().find(function (item) {
            return item.id === Number(bookIdInput.value);
        });
        selectedBook.textContent = book ? "Selected: " + book.title + " by " + book.author : "";
    }

    bookIdInput.addEventListener("input", updateSelectedBook);
    updateSelectedBook();

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!currentUser) {
            return showMessage(message, "Please login before borrowing a book.", "error");
        }

        var data = getFormData(form);
        var books = getBooks();
        var book = books.find(function (item) {
            return item.id === Number(data.bookId);
        });

        if (!book) {
            return showMessage(message, "Book ID does not exist.", "error");
        }
        if (!book.isActive || !book.canBorrow || Number(book.availableCopies) < 1) {
            return showMessage(message, "This book is not available for borrowing.", "error");
        }
        if (!data.borrowDate || !data.returnDate) {
            return showMessage(message, "Please choose both borrow and return dates.", "error");
        }
        if (data.returnDate <= data.borrowDate) {
            return showMessage(message, "Return date must be after borrow date.", "error");
        }
        if (data.address.trim().length < 5) {
            return showMessage(message, "Please enter a complete address.", "error");
        }

        var borrowings = getBorrowings();
        borrowings.push({
            id: nextId(borrowings),
            userId: currentUser.id,
            bookId: book.id,
            bookTitle: book.title,
            borrowDate: data.borrowDate,
            returnDate: data.returnDate,
            status: "Borrowed",
            address: data.address.trim()
        });

        book.availableCopies = Number(book.availableCopies) - 1;
        write(STORAGE_KEYS.books, books);
        write(STORAGE_KEYS.borrowings, borrowings);
        showMessage(message, "Book borrowed successfully. Redirecting to My Books...", "success");
        setTimeout(function () {
            location.href = "MyBooks.html";
        }, 900);
    });
}

function renderMyBooks() {
    var body = document.getElementById("my-books-body");
    var message = document.getElementById("my-books-message");
    if (!body || !message) {
        return;
    }

    var currentUser = getCurrentUser();
    if (!currentUser) {
        showMessage(message, "Please login to view your borrowed books.", "error");
        body.innerHTML = "";
        return;
    }

    var items = getBorrowings().filter(function (item) {
        return item.userId === currentUser.id;
    });

    if (!items.length) {
        showMessage(message, "You have not borrowed any books yet.", "error");
        body.innerHTML = "";
        return;
    }

    showMessage(message, items.length + " borrowed book(s) found.", "success");
    body.innerHTML = items.map(function (item) {
        return [
            "<tr>",
            "<td>" + item.id + "</td>",
            "<td>" + escapeHtml(item.bookTitle) + "</td>",
            "<td>" + escapeHtml(item.borrowDate) + "</td>",
            "<td>" + escapeHtml(item.returnDate) + "</td>",
            "<td>" + escapeHtml(item.status) + "</td>",
            "</tr>"
        ].join("");
    }).join("");
}

function renderProfile() {
    var container = document.getElementById("profile-details");
    if (!container) {
        return;
    }

    var user = getCurrentUser();
    if (!user) {
        container.innerHTML = '<div class="empty-state">Please login to view your profile.</div>';
        return;
    }

    container.innerHTML = [
        '<dl class="profile-item"><dt>Username</dt><dd>' + escapeHtml(user.username) + "</dd></dl>",
        '<dl class="profile-item"><dt>Role</dt><dd>' + escapeHtml(user.accountType) + "</dd></dl>",
        '<dl class="profile-item"><dt>Email</dt><dd>' + escapeHtml(user.email) + "</dd></dl>",
        '<dl class="profile-item"><dt>Address</dt><dd>' + escapeHtml(user.address) + "</dd></dl>",
        '<dl class="profile-item"><dt>Phone Number</dt><dd>' + escapeHtml(user.phone) + "</dd></dl>"
    ].join("");
}

function bindProfileEdit() {
    var form = document.getElementById("edit-profile-form");
    if (!form) {
        return;
    }

    var currentUser = getCurrentUser();
    var message = document.getElementById("edit-profile-message");
    if (!currentUser) {
        showMessage(message, "Please login before editing your profile.", "error");
        form.querySelectorAll("input").forEach(function (input) {
            input.disabled = true;
        });
        return;
    }

    form.username.value = currentUser.username;
    form.email.value = currentUser.email;
    form.address.value = currentUser.address;
    form.phone.value = currentUser.phone;

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = getFormData(form);
        var users = getUsers();

        if (data.username.trim().length < 3) {
            return showMessage(message, "Username must be at least 3 characters.", "error");
        }
        if (!isValidEmail(data.email)) {
            return showMessage(message, "Enter a valid email address.", "error");
        }
        if (!isValidPhone(data.phone)) {
            return showMessage(message, "Enter a valid phone number using 10 to 15 digits.", "error");
        }

        var duplicate = users.find(function (user) {
            return user.id !== currentUser.id
                && (user.username.toLowerCase() === data.username.trim().toLowerCase()
                || user.email.toLowerCase() === data.email.trim().toLowerCase());
        });
        if (duplicate) {
            return showMessage(message, "That username or email is already used by another account.", "error");
        }

        var updatedUser = {
            id: currentUser.id,
            username: data.username.trim(),
            email: data.email.trim().toLowerCase(),
            password: currentUser.password,
            address: data.address.trim(),
            phone: data.phone.trim(),
            accountType: currentUser.accountType
        };

        write(STORAGE_KEYS.users, users.map(function (user) {
            return user.id === currentUser.id ? updatedUser : user;
        }));
        write(STORAGE_KEYS.currentUser, updatedUser);
        showMessage(message, "Profile updated successfully. Redirecting...", "success");
        setTimeout(function () {
            location.href = "Profile.html";
        }, 900);
    });
}

function bindManageBooks() {
    var body = document.getElementById("manage-books-body");
    var message = document.getElementById("manage-books-message");
    if (!body || !message) {
        return;
    }

    function render() {
        var books = getBooks();
        if (!books.length) {
            body.innerHTML = "";
            showMessage(message, "No books in the catalog.", "error");
            return;
        }

        showMessage(message, books.length + " book(s) loaded.", "success");
        body.innerHTML = books.map(function (book) {
            return [
                "<tr>",
                "<td>" + book.id + "</td>",
                "<td>" + escapeHtml(book.title) + "</td>",
                "<td>" + escapeHtml(book.author) + "</td>",
                "<td>" + escapeHtml(book.category) + "</td>",
                "<td>" + (book.isActive ? "Active" : "Inactive") + "</td>",
                "<td>" + (book.canBorrow ? "Yes" : "No") + "</td>",
                "<td>" + Number(book.availableCopies) + "</td>",
                '<td><a class="button button-secondary" href="AdminEditBook.html?id=' + book.id + '">Edit</a></td>',
                '<td><button class="button button-danger" type="button" data-delete-id="' + book.id + '">Delete</button></td>',
                "</tr>"
            ].join("");
        }).join("");
    }

    render();

    body.addEventListener("click", function (event) {
        var button = event.target.closest("[data-delete-id]");
        if (!button) {
            return;
        }

        var bookId = Number(button.dataset.deleteId);
        write(STORAGE_KEYS.books, getBooks().filter(function (book) {
            return book.id !== bookId;
        }));
        render();
    });

    document.getElementById("show-all-books").addEventListener("click", render);
    document.getElementById("delete-all-books").addEventListener("click", function () {
        write(STORAGE_KEYS.books, []);
        render();
    });
}

function bindAddBook() {
    var form = document.getElementById("add-book-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var message = document.getElementById("add-book-message");
        var data = getFormData(form);

        if (data.title.trim().length < 2 || data.author.trim().length < 2 || data.category.trim().length < 2) {
            return showMessage(message, "Title, author, and category are required.", "error");
        }
        if (data.description.trim().length < 10) {
            return showMessage(message, "Description must be at least 10 characters.", "error");
        }

        var books = getBooks();
        fileToDataUrl(form.image.files[0], "../images/thegreatgatsby.jpg").then(function (imageValue) {
            books.push({
                id: nextId(books),
                title: data.title.trim(),
                author: data.author.trim(),
                category: data.category.trim(),
                description: data.description.trim(),
                image: imageValue,
                isActive: form.isActive.checked,
                canBorrow: form.canBorrow.checked,
                availableCopies: Number(data.availableCopies)
            });

            write(STORAGE_KEYS.books, books);
            showMessage(message, "Book added successfully. Redirecting...", "success");
            form.reset();
            setTimeout(function () {
                location.href = "ManageBook.html";
            }, 900);
        });
    });
}

function bindEditBook() {
    var form = document.getElementById("edit-book-form");
    if (!form) {
        return;
    }

    var message = document.getElementById("edit-book-message");
    var bookId = Number(new URLSearchParams(location.search).get("id"));
    var books = getBooks();
    var book = books.find(function (item) {
        return item.id === bookId;
    });

    if (!book) {
        showMessage(message, "Book not found.", "error");
        form.querySelectorAll("input, textarea").forEach(function (field) {
            field.disabled = true;
        });
        return;
    }

    form.id.value = book.id;
    form.title.value = book.title;
    form.author.value = book.author;
    form.category.value = book.category;
    form.description.value = book.description;
    form.availableCopies.value = book.availableCopies;
    form.isActive.checked = Boolean(book.isActive);
    form.canBorrow.checked = Boolean(book.canBorrow);

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = getFormData(form);

        if (data.title.trim().length < 2 || data.author.trim().length < 2 || data.category.trim().length < 2) {
            return showMessage(message, "Title, author, and category are required.", "error");
        }
        if (data.description.trim().length < 10) {
            return showMessage(message, "Description must be at least 10 characters.", "error");
        }

        var updatedBook = {
            id: book.id,
            title: data.title.trim(),
            author: data.author.trim(),
            category: data.category.trim(),
            description: data.description.trim(),
            image: book.image,
            availableCopies: Number(data.availableCopies),
            isActive: form.isActive.checked,
            canBorrow: form.canBorrow.checked
        };

        write(STORAGE_KEYS.books, books.map(function (item) {
            return item.id === book.id ? updatedBook : item;
        }));
        showMessage(message, "Book updated successfully. Redirecting...", "success");
        setTimeout(function () {
            location.href = "ManageBook.html";
        }, 900);
    });
}
