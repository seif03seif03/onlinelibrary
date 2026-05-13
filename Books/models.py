from django.db import models

from accounts.models import Account


class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    category = models.CharField(max_length=100, default='General')
    description = models.TextField()
    published_date = models.DateField()
    isbn = models.CharField(max_length=13, unique=True)
    image = models.ImageField(upload_to='book_covers/%Y/%m/%d', max_length=200, blank=True, null=True)
    available_copies = models.PositiveIntegerField(default=0)

    @property
    def status(self):
        return 'Available' if self.available_copies > 0 else 'Unavailable'

    def __str__(self):
        return self.title


class BorrowRecord(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_RETURNED = 'returned'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_RETURNED, 'Returned'),
    ]

    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='borrow_records')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='borrow_records')
    borrow_date = models.DateField()
    return_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.account.email} -> {self.book.title}'
