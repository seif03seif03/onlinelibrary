from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from accounts.models import Account
from Books.models import Book, BorrowRecord

User = get_user_model()


class LibraryFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='reader@example.com',
            email='reader@example.com',
            password='Secret123',
        )
        self.account = Account.objects.create(
            name='Reader',
            email='reader@example.com',
            password=self.user.password,
            phone_number='01000000000',
            address='Cairo',
            type=Account.ROLE_USER,
        )
        self.admin_user = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='Secret123',
            is_staff=True,
        )
        self.admin_account = Account.objects.create(
            name='Admin',
            email='admin@example.com',
            password=self.admin_user.password,
            phone_number='01000000001',
            address='Giza',
            type=Account.ROLE_ADMIN,
        )
        self.book = Book.objects.create(
            title='Django for Teams',
            author='William Vincent',
            category='Programming',
            description='A practical Django guide.',
            published_date=date(2024, 1, 1),
            isbn='1234567890123',
            available_copies=3,
        )

    def test_books_page_shows_books(self):
        response = self.client.get(reverse('books'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Django for Teams')

    def test_user_can_borrow_book_and_reduce_available_copies(self):
        self.client.force_login(self.user)

        response = self.client.post(reverse('borrow'), {
            'book_id': self.book.id,
            'borrow_date': date.today().isoformat(),
            'return_date': (date.today() + timedelta(days=7)).isoformat(),
        })

        self.book.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.book.available_copies, 2)
        self.assertTrue(BorrowRecord.objects.filter(account=self.account, book=self.book).exists())

    def test_admin_can_add_book_from_manage_page(self):
        self.client.force_login(self.admin_user)

        response = self.client.post(reverse('manage_books'), {
            'action': 'add',
            'title': 'Clean Code',
            'author': 'Robert C. Martin',
            'category': 'Programming',
            'description': 'Software craftsmanship principles.',
            'published_date': '2008-08-01',
            'isbn': '9999999999999',
            'available_copies': 5,
        })

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Book.objects.filter(isbn='9999999999999').exists())

    def test_regular_user_cannot_open_manage_books(self):
        self.client.force_login(self.user)

        response = self.client.get(reverse('manage_books'))

        self.assertEqual(response.status_code, 403)

    def test_borrow_returns_json_for_ajax_requests(self):
        self.client.force_login(self.user)

        response = self.client.post(
            reverse('borrow'),
            {
                'book_id': self.book.id,
                'borrow_date': date.today().isoformat(),
                'return_date': (date.today() + timedelta(days=7)).isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload['success'])
        self.assertEqual(payload['book']['id'], self.book.id)

    def test_admin_add_book_returns_json_for_ajax_requests(self):
        self.client.force_login(self.admin_user)

        response = self.client.post(
            reverse('manage_books'),
            {
                'action': 'add',
                'title': 'Refactoring',
                'author': 'Martin Fowler',
                'category': 'Programming',
                'description': 'Improving existing code.',
                'published_date': '2018-11-19',
                'isbn': '8888888888888',
                'available_copies': 4,
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload['success'])
        self.assertEqual(payload['book']['title'], 'Refactoring')

    def test_admin_can_delete_book_from_manage_page_via_ajax(self):
        self.client.force_login(self.admin_user)

        response = self.client.post(
            reverse('manage_books'),
            {
                'action': 'delete',
                'book_id': self.book.id,
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
            HTTP_HOST='localhost',
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload['success'])
        self.assertEqual(payload['book_id'], self.book.id)
        self.assertFalse(Book.objects.filter(id=self.book.id).exists())

    def test_admin_can_open_add_book_page(self):
        self.client.force_login(self.admin_user)

        response = self.client.get(reverse('add_book'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Add New Book')

    def test_admin_can_edit_book(self):
        self.client.force_login(self.admin_user)

        response = self.client.post(reverse('edit_book', args=[self.book.id]), {
            'title': 'Updated Django for Teams',
            'author': self.book.author,
            'category': self.book.category,
            'description': self.book.description,
            'published_date': self.book.published_date.isoformat(),
            'isbn': self.book.isbn,
            'available_copies': 7,
        })

        self.assertRedirects(response, reverse('manage_books'))
        self.book.refresh_from_db()
        self.assertEqual(self.book.title, 'Updated Django for Teams')
        self.assertEqual(self.book.available_copies, 7)

    def test_borrow_page_shows_only_available_books_in_select(self):
        unavailable_book = Book.objects.create(
            title='Unavailable Book',
            author='Nobody',
            category='Programming',
            description='No copies left.',
            published_date=date(2024, 1, 2),
            isbn='7777777777777',
            available_copies=0,
        )
        self.client.force_login(self.user)

        response = self.client.get(reverse('borrow'))

        self.assertContains(response, 'Django for Teams')
        self.assertNotContains(response, unavailable_book.title)

    def test_borrow_button_hides_after_user_already_borrowed_the_book(self):
        BorrowRecord.objects.create(
            account=self.account,
            book=self.book,
            borrow_date=date.today(),
            return_date=date.today() + timedelta(days=7),
            status=BorrowRecord.STATUS_ACTIVE,
        )
        self.client.force_login(self.user)

        books_response = self.client.get(reverse('books'))
        details_response = self.client.get(reverse('book_details', args=[self.book.id]))

        self.assertNotContains(books_response, 'href="/borrow/?book_id=%s"' % self.book.id, html=False)
        self.assertNotContains(details_response, 'Borrow This Book')

    def test_user_cannot_borrow_same_book_twice(self):
        BorrowRecord.objects.create(
            account=self.account,
            book=self.book,
            borrow_date=date.today(),
            return_date=date.today() + timedelta(days=7),
            status=BorrowRecord.STATUS_ACTIVE,
        )
        self.client.force_login(self.user)

        response = self.client.post(reverse('borrow'), {
            'book_id': self.book.id,
            'borrow_date': date.today().isoformat(),
            'return_date': (date.today() + timedelta(days=7)).isoformat(),
        })

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'You already have this book borrowed.')
        self.assertEqual(BorrowRecord.objects.filter(account=self.account, book=self.book).count(), 1)
