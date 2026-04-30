// Function One: runs the shared setup and loads the selected book details.
function initBookDetailsPage() {
    init();
    loadBookDetails();
}

// Function Two: gets the selected book id from the URL and finds its details.
function loadBookDetails() {
    var bookId = Number(new URLSearchParams(location.search).get("id")) || 1;
    var book = getBookDetails(bookId);

    if (!book) {
        return;
    }

    renderBookDetails(book);
}

// Function Three: returns the static details for one specific book.
function getBookDetails(bookId) {
    var books = {
        1: {
            id: 1,
            title: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            category: "Classic",
            description: "A polished portrait of parties, obsession, and the hollow promise of the American Dream.",
            status: "Available for borrowing",
            copies: 4,
            image: "../images/thegreatgatsby.jpg"
        },
        2: {
            id: 2,
            title: "To Kill a Mockingbird",
            author: "Harper Lee",
            category: "Novel",
            description: "A humane courtroom story about conscience, prejudice, and moral courage in a small town.",
            status: "Currently unavailable",
            copies: 0,
            image: "../images/To Kill a Mockingbird.jpg"
        },
        3: {
            id: 3,
            title: "1984",
            author: "George Orwell",
            category: "Science Fiction",
            description: "A chilling dystopian warning about surveillance, language control, and the erasure of truth.",
            status: "Available for borrowing",
            copies: 3,
            image: "../images/1984 by George Orwell.jpg"
        },
        4: {
            id: 4,
            title: "The Hobbit",
            author: "J.R.R. Tolkien",
            category: "Fantasy",
            description: "A warm adventure tale following Bilbo from quiet comfort into dragons, riddles, and courage.",
            status: "Available for borrowing",
            copies: 6,
            image: "../images/thehobbit.jpg"
        },
        5: {
            id: 5,
            title: "Fahrenheit 451",
            author: "Ray Bradbury",
            category: "Dystopian",
            description: "A fast dystopian novel where forbidden books become sparks for memory and rebellion.",
            status: "Available for borrowing",
            copies: 4,
            image: "../images/Fahrenheit 451 by Ray Bradbury.jpg"
        },
        6: {
            id: 6,
            title: "Moby-Dick",
            author: "Herman Melville",
            category: "Adventure",
            description: "A stormy sea voyage that turns into a haunting meditation on revenge and obsession.",
            status: "Available for borrowing",
            copies: 2,
            image: "../images/mobydick.jpg"
        },
        7: {
            id: 7,
            title: "Pride and Prejudice",
            author: "Jane Austen",
            category: "Romance",
            description: "A witty and elegant novel that follows Elizabeth Bennet as she confronts pride, prejudice, and unexpected love.",
            status: "Available for borrowing",
            copies: 5,
            image: "../images/Pride and Prejudice.jpg"
        },
        8: {
            id: 8,
            title: "The Catcher in the Rye",
            author: "J.D. Salinger",
            category: "Coming-of-Age",
            description: "A restless coming-of-age story filled with loneliness, rebellion, and youthful voice.",
            status: "Currently unavailable",
            copies: 0,
            image: "../images/The Catcher in the Rye.jpg"
        },
        9: {
            id: 9,
            title: "A Song of Ice and Fire",
            author: "George R.R. Martin",
            category: "Epic Fantasy",
            description: "An epic fantasy saga of rival families, fragile alliances, and power won at a price.",
            status: "Available for borrowing",
            copies: 3,
            image: "../images/ASOIAF.jpg"
        }
    };

    return books[bookId] || books[1];
}

// Function Four: writes the selected book details into the page.
function renderBookDetails(book) {
    document.getElementById("book-title").textContent = book.title;
    document.getElementById("book-id").textContent = String(book.id);
    document.getElementById("book-author").textContent = book.author;
    document.getElementById("book-category").textContent = book.category;
    document.getElementById("book-description").textContent = book.description;
    document.getElementById("book-status").textContent = book.status;
    document.getElementById("book-copies").textContent = String(book.copies);

    var image = document.getElementById("book-image");
    image.src = book.image;
    image.alt = book.title;

    var borrowLink = document.getElementById("borrow-book-link");
    if (isAdminUser()) {
        borrowLink.classList.add("is-hidden");
        borrowLink.setAttribute("aria-hidden", "true");
        borrowLink.tabIndex = -1;
        return;
    }

    borrowLink.href = "BorrowBooks.html?bookId=" + book.id;
}

initBookDetailsPage();
