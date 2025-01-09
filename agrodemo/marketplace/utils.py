# marketplace/utils.py or marketplace/validators.py
from PIL import Image
from rest_framework.exceptions import ValidationError

def validate_image(image_file):
    """Validate uploaded image file."""
    if image_file.size > 5 * 1024 * 1024:
        raise ValidationError("Image file too large ( > 5MB )")
    try:
        img = Image.open(image_file)
        if img.format.upper() not in ['JPEG', 'PNG', 'WEBP']:
            raise ValidationError("Unsupported image format")
        if img.width > 4096 or img.height > 4096:
            raise ValidationError("Image dimensions too large")
    except Exception as e:
        raise ValidationError(f"Invalid image file: {str(e)}")