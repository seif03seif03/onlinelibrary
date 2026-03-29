// Function One: starts the shared setup for the my books page.
function functionOne() {
    init();
    functionTwo();
}

// Function Two: shows a simple summary message for the static table.
function functionTwo() {
    var message = document.getElementById("my-books-message");
    var rows = document.querySelectorAll("#my-books-body tr");

    if (!message) {
        return;
    }

    showMessage(message, rows.length + " borrowed book(s) shown.", rows.length ? "success" : "error");
}

functionOne();
