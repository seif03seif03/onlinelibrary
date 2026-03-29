// Function One: rebuilds the navbar links based on the current saved role.
function setupNavbar() {
    var navList = document.querySelector(".nav-links");
    if (!navList) {
        return;
    }

    var currentUser = getCurrentUser();
    var links = currentUser && currentUser.accountType === "admin"
        ? getAdminNavLinks()
        : currentUser && currentUser.accountType === "user"
            ? getUserNavLinks()
            : getGuestNavLinks();

    navList.innerHTML = links.map(function (link) {
        var actionAttribute = link.action ? ' data-action="' + link.action + '"' : "";
        return '<li><a href="' + link.href + '"' + actionAttribute + ">" + link.label + "</a></li>";
    }).join("");

    if (currentUser) {
        navList.insertAdjacentHTML("beforeend", '<li><span class="nav-role">' + escapeHtml(currentUser.accountType) + "</span></li>");
    }

    navList.addEventListener("click", function (event) {
        var actionLink = event.target.closest("[data-action='logout']");
        if (!actionLink) {
            return;
        }

        event.preventDefault();
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        location.href = navPath("Login.html", "../Login.html", "../Login.html");
    });
}

// Function Two: highlights the current page link in the navbar.
function highlightNav() {
    var current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function (link) {
        var href = link.getAttribute("href") || "";
        if (href.endsWith(current)) {
            link.classList.add("is-active");
        }
    });
}

// Function Three: returns navbar links for guest pages.
function getGuestNavLinks() {
    return [
        { label: "Home", href: navPath("index.html", "../index.html", "../index.html") },
        { label: "Books", href: navPath("AllBooks.html", "../AllBooks.html", "../AllBooks.html") },
        { label: "Search", href: navPath("User/SearchBook.html", "SearchBook.html", "../User/SearchBook.html") },
        { label: "Login", href: navPath("Login.html", "../Login.html", "../Login.html") },
        { label: "Sign Up", href: navPath("Signup.html", "../Signup.html", "../Signup.html") }
    ];
}

// Function Four: returns navbar links for regular user pages.
function getUserNavLinks() {
    return [
        { label: "Home", href: navPath("index.html", "../index.html", "../index.html") },
        { label: "Books", href: navPath("AllBooks.html", "../AllBooks.html", "../AllBooks.html") },
        { label: "Search", href: navPath("User/SearchBook.html", "SearchBook.html", "../User/SearchBook.html") },
        { label: "Borrow", href: navPath("User/BorrowBooks.html", "BorrowBooks.html", "../User/BorrowBooks.html") },
        { label: "My Books", href: navPath("User/MyBooks.html", "MyBooks.html", "../User/MyBooks.html") },
        { label: "My Profile", href: navPath("User/Profile.html", "Profile.html", "../User/Profile.html") },
        { label: "Logout", href: "#", action: "logout" }
    ];
}

// Function Five: returns navbar links for admin pages.
function getAdminNavLinks() {
    return [
        { label: "Home", href: navPath("index.html", "../index.html", "../index.html") },
        { label: "Books", href: navPath("AllBooks.html", "../AllBooks.html", "../AllBooks.html") },
        { label: "Manage Books", href: navPath("Admin/ManageBook.html", "../Admin/ManageBook.html", "ManageBook.html") },
        { label: "Add Book", href: navPath("Admin/AdminAddBook.html", "../Admin/AdminAddBook.html", "AdminAddBook.html") },
        { label: "My Profile", href: navPath("User/Profile.html", "Profile.html", "../User/Profile.html") },
        { label: "Logout", href: "#", action: "logout" }
    ];
}
