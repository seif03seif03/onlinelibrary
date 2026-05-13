from django.db import models


class Account(models.Model):
    ROLE_USER = 'user'
    ROLE_ADMIN = 'admin'
    ROLE_CHOICES = [
        (ROLE_USER, 'User'),
        (ROLE_ADMIN, 'Admin'),
    ]

    name = models.CharField(max_length=100)
    email = models.EmailField()
    password = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    address = models.CharField(max_length=200)
    type = models.CharField(max_length=50, choices=ROLE_CHOICES, default=ROLE_USER)

    @property
    def is_admin(self):
        return self.type == self.ROLE_ADMIN

    @property
    def is_user(self):
        return self.type == self.ROLE_USER
