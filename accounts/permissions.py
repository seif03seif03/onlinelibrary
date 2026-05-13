from functools import wraps

from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden

from accounts.models import Account


def get_account_for_user(user):
    return Account.objects.filter(email=user.email).first()


def role_required(*allowed_roles):
    def decorator(view_func):
        @login_required(login_url='login')
        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            account = get_account_for_user(request.user)
            if not account:
                return HttpResponseForbidden('Account profile was not found for this user.')

            # Admins can move freely across the dashboard and user flows after login.
            if not account.is_admin and account.type not in allowed_roles:
                return HttpResponseForbidden('You do not have permission to access this page.')

            request.account = account
            return view_func(request, *args, **kwargs)

        return wrapped

    return decorator
