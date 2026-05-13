from django.contrib.auth import authenticate, get_user_model, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from accounts.models import Account
from accounts.permissions import get_account_for_user

User = get_user_model()


def _is_ajax(request):
    return request.headers.get('x-requested-with') == 'XMLHttpRequest'


def _error_response(request, template_name, title, message, status=400):
    if _is_ajax(request):
        return JsonResponse({'success': False, 'error': message}, status=status)
    return render(request, template_name, {
        'title': title,
        'error': message,
    }, status=status)


def _normalize_login_identifier(identifier):
    identifier = (identifier or '').strip()
    if not identifier:
        return None

    account = Account.objects.filter(name__iexact=identifier).first()
    if account:
        return account.email
    return identifier


def _validate_signup_payload(name, email, phone_number, address, password, confirm_password):
    if not name or len(name.strip()) < 3:
        return 'Username must be at least 3 characters long.'

    try:
        validate_email(email)
    except ValidationError:
        return 'Please enter a valid email address.'

    if Account.objects.filter(name__iexact=name.strip()).exists():
        return 'Username already exists.'

    if not phone_number or len(phone_number.strip()) < 7:
        return 'Please enter a valid phone number.'

    if not address or len(address.strip()) < 5:
        return 'Address must be at least 5 characters long.'

    if not password or len(password) < 8:
        return 'Password must be at least 8 characters long.'

    if password != confirm_password:
        return 'Passwords do not match'

    if Account.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
        return 'Email already exists'

    return None


def _sync_user_role(user, account):
    is_admin = account.is_admin
    fields_to_update = []

    if user.username != account.email:
        user.username = account.email
        fields_to_update.append('username')

    if user.email != account.email:
        user.email = account.email
        fields_to_update.append('email')

    if user.first_name != account.name:
        user.first_name = account.name
        fields_to_update.append('first_name')

    if user.is_staff != is_admin:
        user.is_staff = is_admin
        fields_to_update.append('is_staff')

    if fields_to_update:
        user.save(update_fields=fields_to_update)


def _ensure_admin_account(user):
    account = get_account_for_user(user)
    if account:
        return account

    if not (user.is_staff or user.is_superuser):
        return None

    # Django-created admins may exist without an Account row, so we provision one on demand.
    return Account.objects.create(
        name=user.first_name or user.username.split('@')[0] or 'Admin',
        email=user.email or user.username,
        phone_number='0000000',
        address='Admin Dashboard',
        type=Account.ROLE_ADMIN,
        password=user.password,
    )


def _post_login_redirect(account):
    if account.is_admin:
        return 'manage_books'
    return 'account_profile'


def _validate_profile_payload(name, email, phone_number, address, current_account, current_user):
    if not name or len(name.strip()) < 3:
        return 'Username must be at least 3 characters long.'

    try:
        validate_email(email)
    except ValidationError:
        return 'Please enter a valid email address.'

    if Account.objects.filter(name__iexact=name.strip()).exclude(id=current_account.id).exists():
        return 'Username already exists.'

    if not phone_number or len(phone_number.strip()) < 7:
        return 'Please enter a valid phone number.'

    if not address or len(address.strip()) < 5:
        return 'Address must be at least 5 characters long.'

    email_taken = Account.objects.filter(email=email).exclude(id=current_account.id).exists()
    user_taken = User.objects.filter(username=email).exclude(id=current_user.id).exists()
    if email_taken or user_taken:
        return 'Email already exists'

    return None


@login_required(login_url='login')
def profile(request):
    account = get_account_for_user(request.user) or _ensure_admin_account(request.user)
    account = get_object_or_404(Account, id=account.id)
    return render(request, 'User/Profile.html', {
        'title': 'User Profile',
        'account': account,
    })


@login_required(login_url='login')
def edit_profile(request):
    account = get_account_for_user(request.user) or _ensure_admin_account(request.user)
    account = get_object_or_404(Account, id=account.id)
    error = None

    if request.method == 'POST':
        name = (request.POST.get('username') or '').strip()
        email = (request.POST.get('email') or '').strip().lower()
        phone_number = (request.POST.get('phone') or '').strip()
        address = (request.POST.get('address') or '').strip()

        error = _validate_profile_payload(name, email, phone_number, address, account, request.user)
        if not error:
            account.name = name
            account.email = email
            account.phone_number = phone_number
            account.address = address
            account.save(update_fields=['name', 'email', 'phone_number', 'address'])

            _sync_user_role(request.user, account)

            if _is_ajax(request):
                return JsonResponse({
                    'success': True,
                    'message': 'Profile updated successfully.',
                    'redirect_url': redirect('account_profile').url,
                })
            return redirect('account_profile')

        if _is_ajax(request):
            return JsonResponse({'success': False, 'error': error}, status=400)

    status = 400 if error else 200
    return render(request, 'User/EditUserProfile.html', {
        'title': 'Edit Profile',
        'account': account,
        'error': error,
    }, status=status)


def signup(request):
    if request.method == "POST":
        name = (request.POST.get('username') or '').strip()
        email = (request.POST.get('email') or '').strip().lower()
        phone_number = (request.POST.get('phone') or '').strip()
        address = (request.POST.get('address') or '').strip()
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirmPassword')

        validation_error = _validate_signup_payload(
            name,
            email,
            phone_number,
            address,
            password,
            confirm_password,
        )
        if validation_error:
            return _error_response(request, 'Signup.html', 'Sign Up', validation_error)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name,
            is_staff=False,
        )

        Account.objects.create(
            name=name,
            email=email,
            phone_number=phone_number,
            address=address,
            type=Account.ROLE_USER,
            password=user.password
        )

        if _is_ajax(request):
            return JsonResponse({
                'success': True,
                'message': 'Account created successfully.',
                'redirect_url': redirect('login').url,
            })
        return redirect('login')

    return render(request, 'Signup.html', {
        'title': 'Sign Up'
    })


def login(request):
    if request.method == "POST":
        identifier = (request.POST.get('login-identifier') or '').strip()
        password = request.POST.get('login-password')
        email = _normalize_login_identifier(identifier)

        if not email or not password:
            return _error_response(request, 'Login.html', 'Login', 'Username/email and password are required.')

        user = authenticate(request, username=email, password=password)
        if user:
            account = get_account_for_user(user) or _ensure_admin_account(user)
            if not account:
                return _error_response(request, 'Login.html', 'Login', 'Account profile was not found for this user', status=404)

            _sync_user_role(user, account)
            auth_login(request, user)
            if _is_ajax(request):
                return JsonResponse({
                    'success': True,
                    'redirect_url': redirect(_post_login_redirect(account)).url,
                })
            return redirect(_post_login_redirect(account))

        account = Account.objects.filter(email=email).first()
        if account and check_password(password, account.password):
            user, created = User.objects.get_or_create(
                username=email,
                defaults={
                    'email': email,
                    'first_name': account.name,
                }
            )
            if created or not user.check_password(password):
                user.set_password(password)

            _sync_user_role(user, account)
            user.save()
            auth_login(request, user)
            if _is_ajax(request):
                return JsonResponse({
                    'success': True,
                    'redirect_url': redirect(_post_login_redirect(account)).url,
                })
            return redirect(_post_login_redirect(account))

        return _error_response(request, 'Login.html', 'Login', 'Invalid credentials')

    return render(request, 'Login.html', {
        'title': 'Login'
    })


def logout(request):
    auth_logout(request)
    return redirect('login')
