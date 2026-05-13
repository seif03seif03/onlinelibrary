from datetime import date
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from Books.models import Book


BOOK_SEED_DATA = [
    {
        'title': '1984',
        'author': 'George Orwell',
        'category': 'Dystopian',
        'description': 'A classic dystopian novel about surveillance, control, and resistance in a totalitarian state.',
        'published_date': date(1949, 6, 8),
        'isbn': '9780451524935',
        'available_copies': 5,
        'image_filename': '1984 by George Orwell.jpg',
    },
    {
        'title': 'A Song of Ice and Fire',
        'author': 'George R. R. Martin',
        'category': 'Fantasy',
        'description': 'An epic fantasy saga filled with political conflict, rival houses, and shifting loyalties.',
        'published_date': date(1996, 8, 6),
        'isbn': '9780553103540',
        'available_copies': 4,
        'image_filename': 'ASOIAF.jpg',
    },
    {
        'title': 'Fahrenheit 451',
        'author': 'Ray Bradbury',
        'category': 'Science Fiction',
        'description': 'A powerful novel about censorship, conformity, and the value of ideas and books.',
        'published_date': date(1953, 10, 19),
        'isbn': '9781451673319',
        'available_copies': 6,
        'image_filename': 'Fahrenheit 451 by Ray Bradbury.jpg',
    },
    {
        'title': 'Moby-Dick',
        'author': 'Herman Melville',
        'category': 'Adventure',
        'description': 'The famous sea adventure that follows Captain Ahab and his obsession with the white whale.',
        'published_date': date(1851, 11, 14),
        'isbn': '9781503280786',
        'available_copies': 3,
        'image_filename': 'mobydick.jpg',
    },
    {
        'title': 'Pride and Prejudice',
        'author': 'Jane Austen',
        'category': 'Classic',
        'description': 'A beloved novel exploring love, class, and first impressions through Elizabeth Bennet.',
        'published_date': date(1813, 1, 28),
        'isbn': '9781503290563',
        'available_copies': 5,
        'image_filename': 'Pride and Prejudice.jpg',
    },
    {
        'title': 'The Catcher in the Rye',
        'author': 'J. D. Salinger',
        'category': 'Classic',
        'description': 'A coming-of-age novel centered on teenage alienation, identity, and emotional struggle.',
        'published_date': date(1951, 7, 16),
        'isbn': '9780316769488',
        'available_copies': 4,
        'image_filename': 'The Catcher in the Rye.jpg',
    },
    {
        'title': 'The Great Gatsby',
        'author': 'F. Scott Fitzgerald',
        'category': 'Classic',
        'description': 'A portrait of ambition, illusion, and the American dream in the Jazz Age.',
        'published_date': date(1925, 4, 10),
        'isbn': '9780743273565',
        'available_copies': 5,
        'image_filename': 'thegreatgatsby.jpg',
    },
    {
        'title': 'The Hobbit',
        'author': 'J. R. R. Tolkien',
        'category': 'Fantasy',
        'description': 'Bilbo Baggins is drawn into a grand adventure of dragons, treasure, and courage.',
        'published_date': date(1937, 9, 21),
        'isbn': '9780547928227',
        'available_copies': 7,
        'image_filename': 'thehobbit.jpg',
    },
    {
        'title': 'To Kill a Mockingbird',
        'author': 'Harper Lee',
        'category': 'Classic',
        'description': 'A moving story about justice, empathy, and racial inequality seen through a child’s eyes.',
        'published_date': date(1960, 7, 11),
        'isbn': '9780061120084',
        'available_copies': 6,
        'image_filename': 'To Kill a Mockingbird.jpg',
    },
]


class Command(BaseCommand):
    help = 'Import a starter set of books using the cover images stored in static/images.'

    def handle(self, *args, **options):
        images_dir = Path(settings.BASE_DIR) / 'static' / 'images'
        created_count = 0
        updated_count = 0

        for item in BOOK_SEED_DATA:
            image_path = images_dir / item['image_filename']
            if not image_path.exists():
                self.stderr.write(self.style.ERROR(f"Missing image: {image_path}"))
                continue

            defaults = {
                'title': item['title'],
                'author': item['author'],
                'category': item['category'],
                'description': item['description'],
                'published_date': item['published_date'],
                'available_copies': item['available_copies'],
            }
            book, created = Book.objects.update_or_create(
                isbn=item['isbn'],
                defaults=defaults,
            )

            with image_path.open('rb') as image_file:
                book.image.save(item['image_filename'], File(image_file), save=False)

            book.save()

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created: {book.title}"))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f"Updated: {book.title}"))

        self.stdout.write(
            self.style.SUCCESS(
                f'Import finished. Created {created_count} books and updated {updated_count} books.'
            )
        )
