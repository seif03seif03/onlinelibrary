from django.urls import path

from . import views


urlpatterns = [
    path('profile/', views.profile, name='account_profile'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('signup/', views.signup, name='signup'),
]
