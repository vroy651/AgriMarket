from django import forms
from django.utils.html import format_html


class MultipleFileInput(forms.ClearableFileInput):
    """
    A widget that allows multiple file uploads.
    """
    def render(self, name, value, attrs=None, renderer=None):
         html = super().render(name, value, attrs, renderer)
         return format_html('<div class="multiple-file-input">{}<br><input type="file" name="{}" id="{}" multiple /></div>', html, name, attrs.get('id', ''))