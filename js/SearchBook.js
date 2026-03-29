// Function One: starts the shared setup and prepares the search form.
function functionOne() {
    init();
    functionTwo();
}

// Function Two: connects search and clear actions to the static cards.
function functionTwo() {
    var form = document.getElementById("search-form");
    var clearButton = document.getElementById("clear-search");

    if (!form || !clearButton) {
        return;
    }

    form.addEventListener("submit", functionThree);
    clearButton.addEventListener("click", functionFour);
}

// Function Three: filters the already existing static cards on the page.
function functionThree(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var data = getFormData(form);
    var cards = document.querySelectorAll("#search-results .book-card");
    var visibleCount = 0;

    cards.forEach(function (card) {
        var title = card.dataset.title || "";
        var author = card.dataset.author || "";
        var category = card.dataset.category || "";
        var titleMatch = !data.title || title.indexOf(data.title.trim().toLowerCase()) !== -1;
        var authorMatch = !data.author || author.indexOf(data.author.trim().toLowerCase()) !== -1;
        var categoryMatch = !data.category || category === data.category.toLowerCase();
        var shouldShow = titleMatch && authorMatch && categoryMatch;

        card.hidden = !shouldShow;
        if (shouldShow) {
            visibleCount += 1;
        }
    });

    functionFive(visibleCount);
}

// Function Four: resets the form and shows all static cards again.
function functionFour() {
    var form = document.getElementById("search-form");
    var cards = document.querySelectorAll("#search-results .book-card");

    form.reset();
    cards.forEach(function (card) {
        card.hidden = false;
    });

    functionFive(cards.length);
}

// Function Five: updates the message below the search form.
function functionFive(count) {
    var message = document.getElementById("search-message");
    showMessage(message, count + " book(s) visible.", count ? "success" : "error");
}

functionOne();
