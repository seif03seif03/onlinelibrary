// Function One: starts the shared setup and prepares the table actions.
function initManageBooksPage() {
    init();
    bindManageBooksActions();
}

// Function Two: connects the show and delete actions for the static rows.
function bindManageBooksActions() {
    var showButton = document.getElementById("show-all-books");
    var deleteButton = document.getElementById("delete-all-books");
    var body = document.getElementById("manage-books-body");

    if (!showButton || !deleteButton || !body) {
        return;
    }

    showButton.addEventListener("click", showAllRows);
    deleteButton.addEventListener("click", hideAllRows);
    body.addEventListener("click", hideRow);
    updateVisibleRowsMessage();
}

// Function Three: shows every static row in the admin table again.
function showAllRows() {
    document.querySelectorAll("#manage-books-body tr").forEach(function (row) {
        row.hidden = false;
    });

    updateVisibleRowsMessage();
}

// Function Four: hides every row as a simple delete-all demo action.
function hideAllRows() {
    document.querySelectorAll("#manage-books-body tr").forEach(function (row) {
        row.hidden = true;
    });

    updateVisibleRowsMessage();
}

// Function Five: hides one row when the delete button is pressed.
function hideRow(event) {
    var button = event.target.closest("[data-delete-row]");
    if (!button) {
        return;
    }

    var row = button.closest("tr");
    if (row) {
        row.hidden = true;
    }

    updateVisibleRowsMessage();
}

// Function Six: updates the page message based on visible rows.
function updateVisibleRowsMessage() {
    var message = document.getElementById("manage-books-message");
    var visibleRows = Array.from(document.querySelectorAll("#manage-books-body tr")).filter(function (row) {
        return !row.hidden;
    }).length;

    showMessage(message, visibleRows + " book row(s) visible.", visibleRows ? "success" : "error");
}

initManageBooksPage();
