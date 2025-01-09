from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True) # Add a slug field
    # You can add more fields like description, image, etc

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
             self.slug = self.name.lower().replace(' ', '-')
        super(Category, self).save(*args, **kwargs)