from accounts.permissions import get_account_for_user
from accounts.models import Account


def account_context(request):
    if not request.user.is_authenticated:
        return {
            'current_account': None,
            'current_role': None,
        }

    account = get_account_for_user(request.user)
    if not account and (request.user.is_staff or request.user.is_superuser):
        account = Account.objects.create(
            name=request.user.first_name or request.user.username.split('@')[0] or 'Admin',
            email=request.user.email or request.user.username,
            phone_number='0000000',
            address='Admin Dashboard',
            type=Account.ROLE_ADMIN,
            password=request.user.password,
        )
    return {
        'current_account': account,
        'current_role': account.type if account else ('admin' if request.user.is_staff or request.user.is_superuser else None),
    }
