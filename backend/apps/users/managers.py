"""
Custom manager for the LMS User model.

Centralises email normalisation and enforces the invariant that every User
is created with a valid email + hashed password. The create_superuser method
defaults to the INSTRUCTOR role so that admin shell users have full course access.
"""

from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    """Drop-in replacement for Django's default username-based manager."""

    def create_user(
        self,
        email: str,
        password: str,
        role: str,
        **extra_fields,
    ) -> 'User':
        """
        Create and persist a regular user with a hashed password.

        :param email: Primary identifier; domain portion is lowercased via normalize_email.
        :param password: Plaintext; hashed before the record is written to the DB.
        :param role: Must be a valid User.Role value ('INSTRUCTOR' or 'STUDENT').
        :raises ValueError: If email is falsy.
        """
        if not email:
            raise ValueError('An email address is required.')

        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra_fields) -> 'User':
        """
        Create a superuser.

        Defaults role to INSTRUCTOR so that the admin shell account has access
        to all instructor-scoped views. Raises if is_staff or is_superuser are
        explicitly overridden to False, as that would produce a broken admin state.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('first_name', 'Admin')
        extra_fields.setdefault('last_name', 'User')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        # Using the string literal avoids a circular import with models.py
        return self.create_user(email, password, role='INSTRUCTOR', **extra_fields)
