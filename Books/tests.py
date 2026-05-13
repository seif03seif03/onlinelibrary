from datetime import date

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from Books.models import Book
from accounts.models import Account


class BookModelTests(TestCase):
    def test_book_status_is_available_when_copies_exist(self):
        book = Book.objects.create(
            title='Atomic Habits',
            author='James Clear',
            category='Self Help',
            description='Habits and improvement.',
            published_date=date(2018, 10, 16),
            isbn='1111111111111',
            available_copies=2,
        )

        self.assertEqual(book.status, 'Available')


class ManageBooksTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user_model = get_user_model()
        self.admin_email = 'admin@example.com'
        self.user = self.user_model.objects.create_user(
            username=self.admin_email,
            email=self.admin_email,
            password='pass12345',
            is_staff=True,
        )
        Account.objects.create(
            name='Admin',
            email=self.admin_email,
            password=self.user.password,
            phone_number='1234567',
            address='Admin Address',
            type=Account.ROLE_ADMIN,
        )

    def test_admin_can_delete_book_via_ajax(self):
        book = Book.objects.create(
            title='Deep Work',
            author='Cal Newport',
            category='Productivity',
            description='Focus and concentration.',
            published_date=date(2016, 1, 5),
            isbn='2222222222222',
            available_copies=3,
        )
        self.client.login(username=self.admin_email, password='pass12345')

        response = self.client.post(
            '/manage-books/',
            {
                'action': 'delete',
                'book_id': book.id,
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
            HTTP_ACCEPT='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(
            response.content,
            {
                'success': True,
                'message': 'Book deleted successfully.',
                'book_id': book.id,
            },
        )
        self.assertFalse(Book.objects.filter(id=book.id).exists())
