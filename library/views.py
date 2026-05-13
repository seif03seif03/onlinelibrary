from datetime import date

from django.db.models import Q, Sum
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from accounts.models import Account
from accounts.permissions import get_account_for_user, role_required
from Books.models import Book, BorrowRecord


def _is_ajax(request):
    return request.headers.get('x-requested-with') == 'XMLHttpRequest'


def _book_form_payload(request):
    # Centralizing book form parsing keeps add/edit behavior consistent.
    return {
        'title': (request.POST.get('title') or '').strip(),
        'author': (request.POST.get('author') or '').strip(),
        'category': (request.POST.get('category') or 'General').strip() or 'General',
        'description': (request.POST.get('description') or '').strip(),
        'published_date': request.POST.get('published_date'),
        'isbn': (request.POST.get('isbn') or '').strip(),
        'available_copies': int(request.POST.get('available_copies') or 0),
        'image': request.FILES.get('image'),
    }


def _book_form_error(payload):
    if not payload['title']:
        return 'Title is required.'
    if not payload['author']:
        return 'Author is required.'
    if not payload['description']:
        return 'Description is required.'
    if not payload['published_date']:
        return 'Published date is required.'
    if not payload['isbn']:
        return 'ISBN is required.'
    if payload['available_copies'] < 0:
        return 'Available copies cannot be negative.'
    return None


def _get_active_borrowed_book_ids(request):
    if not request.user.is_authenticated:
        return set()

    account = getattr(request, 'account', None) or get_account_for_user(request.user)
    if not account:
        return set()

    return set(
        BorrowRecord.objects.filter(
            account=account,
            status=BorrowRecord.STATUS_ACTIVE,
        ).values_list('book_id', flat=True)
    )


def index(request):
    books_queryset = Book.objects.all().order_by('title')
    featured_books = books_queryset[:3]
    return render(request, 'index.html', {
        'title': 'Library Index',
        'featured_books': featured_books,
        'total_books': books_queryset.count(),
        'available_copies': books_queryset.aggregate(total=Sum('available_copies'))['total'] or 0,
        'registered_users': Account.objects.count(),
    })


def search(request):
    title = request.GET.get('title', '').strip()
    author = request.GET.get('author', '').strip()
    category = request.GET.get('category', '').strip()

    books_queryset = Book.objects.all().order_by('title')

    # We build the filters incrementally so the form can combine title/author/category.
    if title:
        books_queryset = books_queryset.filter(title__icontains=title)
    if author:
        books_queryset = books_queryset.filter(author__icontains=author)
    if category:
        books_queryset = books_queryset.filter(category__icontains=category)

    active_borrowed_book_ids = _get_active_borrowed_book_ids(request)

    return render(request, 'User/SearchBook.html', {
        'title': 'Search',
        'books': books_queryset,
        'active_borrowed_book_ids': active_borrowed_book_ids,
        'filters': {
            'title': title,
            'author': author,
            'category': category,
        },
    })


@role_required(Account.ROLE_USER)
def borrow(request):
    selected_book = None
    message = None
    error = None
    active_borrowed_book_ids = _get_active_borrowed_book_ids(request)
    available_books = Book.objects.filter(available_copies__gt=0).exclude(id__in=active_borrowed_book_ids).order_by('title')

    book_id = request.GET.get('book_id') or request.POST.get('book_id')
    if book_id:
        selected_book = get_object_or_404(Book, id=book_id)

    if request.method == 'POST':
        selected_book = get_object_or_404(Book, id=request.POST.get('book_id'))
        borrow_date = date.fromisoformat(request.POST.get('borrow_date'))
        return_date = date.fromisoformat(request.POST.get('return_date'))

        if return_date < borrow_date:
            error = 'Return date must be after the borrow date.'
        elif BorrowRecord.objects.filter(
            account=request.account,
            book=selected_book,
            status=BorrowRecord.STATUS_ACTIVE,
        ).exists():
            error = 'You already have this book borrowed.'
        elif selected_book.available_copies < 1:
            error = 'This book is currently unavailable.'
        else:
            # Decrementing copies here keeps the availability count aligned with active borrows.
            record = BorrowRecord.objects.create(
                account=request.account,
                book=selected_book,
                borrow_date=borrow_date,
                return_date=return_date,
            )
            selected_book.available_copies -= 1
            selected_book.save(update_fields=['available_copies'])
            message = 'Borrow request submitted successfully.'
            if _is_ajax(request):
                return JsonResponse({
                    'success': True,
                    'message': message,
                    'record': {
                        'id': record.id,
                        'book_title': selected_book.title,
                        'borrow_date': str(record.borrow_date),
                        'return_date': str(record.return_date),
                        'status': record.get_status_display(),
                    },
                    'book': {
                        'id': selected_book.id,
                        'title': selected_book.title,
                        'available_copies': selected_book.available_copies,
                    },
                })

        if _is_ajax(request):
            return JsonResponse({'success': False, 'error': error}, status=400)

    return render(request, 'User/BorrowBooks.html', {
        'title': 'Borrow Books',
        'selected_book': selected_book,
        'available_books': available_books,
        'today': date.today().isoformat(),
        'message': message,
        'error': error,
    })


@role_required(Account.ROLE_USER)
def my_books(request):
    borrow_records = BorrowRecord.objects.filter(account=request.account).select_related('book')
    return render(request, 'User/MyBooks.html', {
        'title': 'My Borrowed Books',
        'borrow_records': borrow_records,
    })


@role_required(Account.ROLE_ADMIN)
def manage_books(request):
    message = None
    error = None

    if request.method == 'POST':
        action = request.POST.get('action')

        if action == 'add':
            payload = _book_form_payload(request)
            error = _book_form_error(payload)

            if not error:
                if Book.objects.filter(isbn=payload['isbn']).exists():
                    error = 'ISBN already exists.'
                else:
                    book = Book.objects.create(
                        title=payload['title'],
                        author=payload['author'],
                        category=payload['category'],
                        description=payload['description'],
                        published_date=payload['published_date'],
                        isbn=payload['isbn'],
                        available_copies=payload['available_copies'],
                        image=payload['image'],
                    )
                    message = 'Book added successfully.'
                    if _is_ajax(request):
                        return JsonResponse({
                            'success': True,
                            'message': message,
                            'book': {
                                'id': book.id,
                                'title': book.title,
                                'author': book.author,
                                'category': book.category,
                                'status': book.status,
                                'available_copies': book.available_copies,
                            },
                        })

            if error and _is_ajax(request):
                return JsonResponse({'success': False, 'error': error}, status=400)

        if action == 'delete':
            book = get_object_or_404(Book, id=request.POST.get('book_id'))
            deleted_id = book.id
            book.delete()
            message = 'Book deleted successfully.'
            if _is_ajax(request):
                return JsonResponse({
                    'success': True,
                    'message': message,
                    'book_id': deleted_id,
                })

    books_queryset = Book.objects.all().order_by('title')
    active_borrows = BorrowRecord.objects.filter(status=BorrowRecord.STATUS_ACTIVE).select_related('book', 'account')

    return render(request, 'Admin/ManageBook.html', {
        'title': 'Manage Books',
        'books': books_queryset,
        'active_borrows': active_borrows,
        'message': message,
        'error': error,
    })


@role_required(Account.ROLE_ADMIN)
def add_book(request):
    error = None

    if request.method == 'POST':
        payload = _book_form_payload(request)
        error = _book_form_error(payload)

        if not error:
            if Book.objects.filter(isbn=payload['isbn']).exists():
                error = 'ISBN already exists.'
            else:
                book = Book.objects.create(
                    title=payload['title'],
                    author=payload['author'],
                    category=payload['category'],
                    description=payload['description'],
                    published_date=payload['published_date'],
                    isbn=payload['isbn'],
                    available_copies=payload['available_copies'],
                    image=payload['image'],
                )
                if _is_ajax(request):
                    return JsonResponse({
                        'success': True,
                        'message': 'Book added successfully.',
                        'redirect_url': redirect('manage_books').url,
                        'book_id': book.id,
                    })
                return redirect('manage_books')

        if _is_ajax(request):
            return JsonResponse({'success': False, 'error': error}, status=400)

    return render(request, 'Admin/AdminAddBook.html', {
        'title': 'Add Book',
        'error': error,
    })


@role_required(Account.ROLE_ADMIN)
def edit_book(request, book_id):
    book = get_object_or_404(Book, id=book_id)
    error = None

    if request.method == 'POST':
        payload = _book_form_payload(request)
        error = _book_form_error(payload)

        if not error:
            duplicate_isbn = Book.objects.filter(isbn=payload['isbn']).exclude(id=book.id).exists()
            if duplicate_isbn:
                error = 'ISBN already exists.'
            else:
                book.title = payload['title']
                book.author = payload['author']
                book.category = payload['category']
                book.description = payload['description']
                book.published_date = payload['published_date']
                book.isbn = payload['isbn']
                book.available_copies = payload['available_copies']
                if payload['image']:
                    book.image = payload['image']
                book.save()

                if _is_ajax(request):
                    return JsonResponse({
                        'success': True,
                        'message': 'Book updated successfully.',
                        'redirect_url': redirect('manage_books').url,
                    })
                return redirect('manage_books')

        if _is_ajax(request):
            return JsonResponse({'success': False, 'error': error}, status=400)

    return render(request, 'Admin/AdminEditBook.html', {
        'title': 'Edit Book',
        'book': book,
        'error': error,
    })
