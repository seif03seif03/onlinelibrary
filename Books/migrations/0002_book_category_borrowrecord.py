from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('Books', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='category',
            field=models.CharField(default='General', max_length=100),
        ),
        migrations.AlterField(
            model_name='book',
            name='description',
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name='book',
            name='image',
            field=models.ImageField(blank=True, max_length=200, null=True, upload_to='book_covers/%Y/%m/%d'),
        ),
        migrations.AlterField(
            model_name='book',
            name='available_copies',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.CreateModel(
            name='BorrowRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('borrow_date', models.DateField()),
                ('return_date', models.DateField()),
                ('status', models.CharField(choices=[('active', 'Active'), ('returned', 'Returned')], default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('account', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='borrow_records', to='accounts.account')),
                ('book', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='borrow_records', to='Books.book')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
