from django.urls import path
from . import views






urlpatterns = [
    path('', views.index, name='index'),
    path('search/', views.search, name='search'),
    path('borrow/', views.borrow, name='borrow'),
    path('my-books/', views.my_books, name='my_books'),
    path('manage-books/', views.manage_books, name='manage_books'),
    path('manage-books/add/', views.add_book, name='add_book'),
    path('manage-books/<int:book_id>/edit/', views.edit_book, name='edit_book'),
]
