from django.db.models import Sum
from django.shortcuts import get_object_or_404, render

from accounts.permissions import get_account_for_user

from .models import Book, BorrowRecord


def _get_active_borrowed_book_ids(request):
    if not request.user.is_authenticated:
        return set()

    account = get_account_for_user(request.user)
    if not account:
        return set()

    return set(
        BorrowRecord.objects.filter(
            account=account,
            status=BorrowRecord.STATUS_ACTIVE,
        ).values_list('book_id', flat=True)
    )


def books(request):
    books_queryset = Book.objects.all().order_by('title')
    total_copies = books_queryset.aggregate(total=Sum('available_copies'))['total'] or 0
    active_borrowed_book_ids = _get_active_borrowed_book_ids(request)
    return render(request, 'AllBooks.html', {
        'title': 'Books',
        'books': books_queryset,
        'total_books': books_queryset.count(),
        'total_copies': total_copies,
        'active_borrowed_book_ids': active_borrowed_book_ids,
    })


def book_details(request, book_id):
    book = get_object_or_404(Book, id=book_id)
    active_borrowed_book_ids = _get_active_borrowed_book_ids(request)
    return render(request, 'User/BookDetails.html', {
        'title': book.title,
        'book': book,
        'already_borrowed': book.id in active_borrowed_book_ids,
    })
