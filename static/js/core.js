function submitAjaxForm(form, onSuccess) {
    const messageNode = document.querySelector(form.dataset.messageTarget || '');
    const formData = new FormData(form);
    const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]')?.value;
    const actionUrl = form.getAttribute('action') || window.location.href;
    const method = form.getAttribute('method') || 'POST';

    if (messageNode) {
        messageNode.textContent = 'Processing...';
        messageNode.className = 'form-message';
    }

    fetch(actionUrl, {
        method,
        credentials: 'same-origin',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        body: formData,
    })
        .then(async (response) => {
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const data = isJson ? await response.json() : { error: await response.text() };
            if (!response.ok) {
                throw data;
            }
            return data;
        })
        .then((data) => {
            if (messageNode && data.message) {
                messageNode.textContent = data.message;
                messageNode.className = 'form-message success';
            }

            if (data.redirect_url) {
                window.location.href = data.redirect_url;
                return;
            }

            onSuccess?.(data);
        })
        .catch((error) => {
            if (messageNode) {
                messageNode.textContent = error.error || 'Something went wrong.';
                messageNode.className = 'form-message error';
            }
        });
}

function buildManageBookRow(book, options) {
    // We rebuild the row on the client so admins see changes immediately without a full page reload.
    const editUrl = options.editUrlTemplate.replace('999999', book.id);
    return `
        <tr data-book-id="${book.id}">
            <td>${book.id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.category}</td>
            <td>${book.status}</td>
            <td>${book.available_copies}</td>
            <td>
                <a class="button button-secondary" href="${editUrl}">Edit</a>
            </td>
            <td>
                <form class="delete-book-form" method="post" action="${options.manageBooksUrl}">
                    <input type="hidden" name="csrfmiddlewaretoken" value="">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="book_id" value="${book.id}">
                    <button class="button button-danger" type="submit">Delete</button>
                </form>
            </td>
        </tr>
    `;
}

function syncManageBooksEmptyState(tbody) {
    const rows = tbody.querySelectorAll('tr[data-book-id]');
    const emptyRow = tbody.querySelector('[data-empty-state="true"]');

    if (rows.length === 0 && !emptyRow) {
        const row = document.createElement('tr');
        row.dataset.emptyState = 'true';
        row.innerHTML = '<td colspan="8">No books found.</td>';
        tbody.appendChild(row);
        return;
    }

    if (rows.length > 0 && emptyRow) {
        emptyRow.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.dataset.messageTarget = '#login-message';
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            submitAjaxForm(loginForm);
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.dataset.messageTarget = '#signup-message';
        signupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            submitAjaxForm(signupForm);
        });
    }

    const borrowForm = document.getElementById('borrow-form');
    if (borrowForm) {
        borrowForm.dataset.messageTarget = '#borrow-message';
        borrowForm.addEventListener('submit', (event) => {
            event.preventDefault();
            submitAjaxForm(borrowForm, (data) => {
                const selectedBookNode = document.querySelector('.info-chip');
                const bookSelect = document.getElementById('borrow-book-id');
                if (selectedBookNode && data.book) {
                    selectedBookNode.textContent = `Selected book: ${data.book.title} (${data.book.available_copies} copies left)`;
                }
                if (bookSelect && data.book) {
                    const selectedOption = bookSelect.querySelector(`option[value="${data.book.id}"]`);
                    if (selectedOption) {
                        if (data.book.available_copies > 0) {
                            selectedOption.textContent = `${data.book.title} - ${data.book.available_copies} copies`;
                        } else {
                            selectedOption.remove();
                            bookSelect.value = '';
                        }
                    }
                }
            });
        });
    }

    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.dataset.messageTarget = '#edit-profile-message';
        editProfileForm.addEventListener('submit', (event) => {
            event.preventDefault();
            submitAjaxForm(editProfileForm);
        });
    }

    const manageBookForm = document.getElementById('manage-book-form');
    const manageBooksBody = document.getElementById('manage-books-body');
    const manageBooksConfig = manageBooksBody ? {
        manageBooksUrl: manageBooksBody.dataset.manageBooksUrl,
        editUrlTemplate: manageBooksBody.dataset.editUrlTemplate,
    } : null;
    if (manageBookForm) {
        manageBookForm.dataset.messageTarget = '#manage-books-message';
        manageBookForm.addEventListener('submit', (event) => {
            event.preventDefault();
            submitAjaxForm(manageBookForm, (data) => {
                if (!data.book || !manageBooksBody || !manageBooksConfig) {
                    return;
                }

                const row = document.createElement('tbody');
                row.innerHTML = buildManageBookRow(data.book, manageBooksConfig);
                const newRow = row.firstElementChild;
                const csrfValue = manageBookForm.querySelector('[name=csrfmiddlewaretoken]').value;
                newRow.querySelector('[name=csrfmiddlewaretoken]').value = csrfValue;
                manageBooksBody.prepend(newRow);
                syncManageBooksEmptyState(manageBooksBody);
                manageBookForm.reset();
            });
        });
    }

    document.addEventListener('submit', (event) => {
        const deleteForm = event.target.closest('.delete-book-form');
        if (!deleteForm) {
            return;
        }

        event.preventDefault();
        if (!window.confirm('Delete this book?')) {
            return;
        }
        deleteForm.dataset.messageTarget = '#manage-books-message';
        submitAjaxForm(deleteForm, (data) => {
            const row = document.querySelector(`[data-book-id="${data.book_id}"]`);
            row?.remove();
            if (manageBooksBody) {
                syncManageBooksEmptyState(manageBooksBody);
            }
        });
    });
});
