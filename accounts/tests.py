from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.test import TestCase
from django.urls import reverse

from accounts.models import Account

User = get_user_model()


class AccountAuthTests(TestCase):
    def test_signup_creates_regular_user_role(self):
        response = self.client.post(reverse('signup'), {
            'username': 'Ali',
            'email': 'ali@example.com',
            'password': 'Secret123',
            'confirmPassword': 'Secret123',
            'address': 'Cairo',
            'phone': '01000000000',
        })

        self.assertRedirects(response, reverse('login'))
        account = Account.objects.get(email='ali@example.com')
        user = User.objects.get(username='ali@example.com')
        self.assertEqual(account.type, Account.ROLE_USER)
        self.assertFalse(account.is_admin)
        self.assertFalse(user.is_staff)
        self.assertTrue(user.check_password('Secret123'))

    def test_login_accepts_username_not_only_email(self):
        user = User.objects.create_user(
            username='ali@example.com',
            email='ali@example.com',
            password='Secret123',
            first_name='Ali',
        )
        Account.objects.create(
            name='AliUser',
            email='ali@example.com',
            password=user.password,
            phone_number='01000000000',
            address='Cairo',
            type=Account.ROLE_USER,
        )

        response = self.client.post(reverse('login'), {
            'login-identifier': 'AliUser',
            'login-password': 'Secret123',
        })

        self.assertRedirects(response, reverse('account_profile'))

    def test_signup_rejects_duplicate_username(self):
        existing_user = User.objects.create_user(
            username='ali@example.com',
            email='ali@example.com',
            password='Secret123',
        )
        Account.objects.create(
            name='AliUser',
            email='ali@example.com',
            password=existing_user.password,
            phone_number='01000000000',
            address='Cairo',
            type=Account.ROLE_USER,
        )

        response = self.client.post(reverse('signup'), {
            'username': 'AliUser',
            'email': 'new@example.com',
            'password': 'Secret123',
            'confirmPassword': 'Secret123',
            'address': 'Cairo',
            'phone': '01000000000',
        })

        self.assertEqual(response.status_code, 400)
        self.assertContains(response, 'Username already exists.', status_code=400)

    def test_signup_rejects_short_password(self):
        response = self.client.post(reverse('signup'), {
            'username': 'AliUser',
            'email': 'ali@example.com',
            'password': '123',
            'confirmPassword': '123',
            'address': 'Cairo',
            'phone': '01000000000',
        })

        self.assertEqual(response.status_code, 400)
        self.assertContains(response, 'Password must be at least 8 characters long.', status_code=400)

    def test_admin_login_redirects_to_manage_books_and_syncs_staff_role(self):
        user = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='Secret123',
            first_name='Admin',
            is_staff=False,
        )
        Account.objects.create(
            name='Admin',
            email='admin@example.com',
            password=user.password,
            phone_number='01000000000',
            address='Cairo',
            type=Account.ROLE_ADMIN,
        )

        response = self.client.post(reverse('login'), {
            'login-identifier': 'admin@example.com',
            'login-password': 'Secret123',
        })

        user.refresh_from_db()
        self.assertRedirects(response, reverse('manage_books'))
        self.assertTrue(user.is_staff)

    def test_regular_user_cannot_access_manage_books(self):
        user = User.objects.create_user(
            username='ali@example.com',
            email='ali@example.com',
            password='Secret123',
        )
        Account.objects.create(
            name='Ali',
            email='ali@example.com',
            password=user.password,
            phone_number='01000000000',
            address='Cairo',
            type=Account.ROLE_USER,
        )
        self.client.force_login(user)

        response = self.client.get(reverse('manage_books'))

        self.assertEqual(response.status_code, 403)

    def test_admin_can_access_borrow_page(self):
        user = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='Secret123',
        )
        Account.objects.create(
            name='Admin',
            email='admin@example.com',
            password=user.password,
            phone_number='01000000000',
            address='Cairo',
            type=Account.ROLE_ADMIN,
        )
        self.client.force_login(user)

        response = self.client.get(reverse('borrow'))

        self.assertEqual(response.status_code, 200)

    def test_profile_page_shows_logged_in_account_data(self):
        user = User.objects.create_user(
            username='ali@example.com',
            email='ali@example.com',
            password='Secret123',
            first_name='Ali',
        )
        Account.objects.create(
            name='Ali',
            email='ali@example.com',
            password=user.password,
            phone_number='01000000000',
            address='Cairo',
            type=Account.ROLE_USER,
        )
        self.client.force_login(user)

        response = self.client.get(reverse('account_profile'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Ali')
        self.assertContains(response, 'ali@example.com')
        self.assertContains(response, 'Cairo')

    def test_edit_profile_updates_account_and_user_email(self):
        user = User.objects.create_user(
            username='ali@example.com',
            email='ali@example.com',
            password='Secret123',
            first_name='Ali',
        )
        Account.objects.create(
            name='Ali',
            email='ali@example.com',
            password=user.password,
            phone_number='01000000000',
            address='Cairo',
            type=Account.ROLE_USER,
        )
        self.client.force_login(user)

        response = self.client.post(reverse('edit_profile'), {
            'username': 'Ali Updated',
            'email': 'ali-updated@example.com',
            'address': 'Alexandria',
            'phone': '01111111111',
        })

        self.assertRedirects(response, reverse('account_profile'))
        user.refresh_from_db()
        account = Account.objects.get(email='ali-updated@example.com')
        self.assertEqual(account.name, 'Ali Updated')
        self.assertEqual(account.email, 'ali-updated@example.com')
        self.assertEqual(account.address, 'Alexandria')
        self.assertEqual(account.phone_number, '01111111111')
        self.assertEqual(user.username, 'ali-updated@example.com')
        self.assertEqual(user.email, 'ali-updated@example.com')
        self.assertEqual(user.first_name, 'Ali Updated')

    def test_edit_profile_rejects_duplicate_email(self):
        first_user = User.objects.create_user(
            username='ali@example.com',
            email='ali@example.com',
            password='Secret123',
            first_name='Ali',
        )
        Account.objects.create(
            name='Ali',
            email='ali@example.com',
            password=first_user.password,
            phone_number='01000000000',
            address='Cairo',
            type=Account.ROLE_USER,
        )
        second_user = User.objects.create_user(
            username='sara@example.com',
            email='sara@example.com',
            password='Secret123',
            first_name='Sara',
        )
        Account.objects.create(
            name='Sara',
            email='sara@example.com',
            password=second_user.password,
            phone_number='01111111111',
            address='Giza',
            type=Account.ROLE_USER,
        )
        self.client.force_login(second_user)

        response = self.client.post(reverse('edit_profile'), {
            'username': 'Sara',
            'email': 'ali@example.com',
            'address': 'Giza City',
            'phone': '01111111111',
        })

        self.assertEqual(response.status_code, 400)
        self.assertContains(response, 'Email already exists', status_code=400)

    def test_legacy_admin_account_can_still_login(self):
        Account.objects.create(
            name='Legacy Admin',
            email='legacy-admin@example.com',
            password=make_password('Secret123'),
            phone_number='01000000000',
            address='Cairo',
            type=Account.ROLE_ADMIN,
        )

        response = self.client.post(reverse('login'), {
            'login-identifier': 'legacy-admin@example.com',
            'login-password': 'Secret123',
        })

        user = User.objects.get(username='legacy-admin@example.com')
        self.assertRedirects(response, reverse('manage_books'))
        self.assertTrue(user.is_staff)

    def test_logout_clears_django_auth_session(self):
        user = User.objects.create_user(
            username='ali@example.com',
            email='ali@example.com',
            password='Secret123',
        )
        self.client.force_login(user)

        response = self.client.get(reverse('logout'))

        self.assertRedirects(response, reverse('login'))
        self.assertNotIn('_auth_user_id', self.client.session)

    def test_login_returns_json_for_ajax_requests(self):
        user = User.objects.create_user(
            username='ali@example.com',
            email='ali@example.com',
            password='Secret123',
        )
        Account.objects.create(
            name='Ali',
            email='ali@example.com',
            password=user.password,
            phone_number='01000000000',
            address='Cairo',
            type=Account.ROLE_USER,
        )

        response = self.client.post(
            reverse('login'),
            {
                'login-identifier': 'ali@example.com',
                'login-password': 'Secret123',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {
            'success': True,
            'redirect_url': reverse('account_profile'),
        })

    def test_django_admin_without_account_profile_can_login(self):
        user = User.objects.create_user(
            username='admin@admin.com',
            email='admin@admin.com',
            password='Secret123',
            is_staff=True,
            is_superuser=True,
            first_name='Super',
        )

        response = self.client.post(reverse('login'), {
            'login-identifier': 'admin@admin.com',
            'login-password': 'Secret123',
        })

        self.assertRedirects(response, reverse('manage_books'))
        account = Account.objects.get(email='admin@admin.com')
        self.assertEqual(account.type, Account.ROLE_ADMIN)
        self.assertEqual(account.name, 'Super')
