from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Order  # Changed import to relative path
import logging

logger = logging.getLogger(__name__)

@shared_task
def process_order_notification(order_id):
    """
    Sends an order confirmation email to the buyer.
    """
    try:
        order = Order.objects.get(pk=order_id)
        subject = f"Your Order #{order.id} Confirmation"
        message = f"Thank you for your order! Here are the details:\n\n{order}"  # Customize this
        recipient_list = [order.buyer.email]

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)
        logger.info(f"Order notification sent successfully for order ID: {order_id}")
    except Order.DoesNotExist:
        logger.error(f"Order with ID {order_id} not found.")
    except Exception as e:
        logger.error(f"Error sending order notification for order ID {order_id}: {e}")

@shared_task
def update_inventory_after_purchase(product_id, quantity):
    """
    Updates the inventory of a product after a purchase.
    """
    from .models import Product  # Changed import to relative path
    try:
        product = Product.objects.get(pk=product_id)
        product.stock -= quantity
        product.save()
        logger.info(f"Inventory updated for product ID {product_id}. New stock: {product.stock}")
    except Product.DoesNotExist:
        logger.error(f"Product with ID {product_id} not found.")
    except Exception as e:
        logger.error(f"Error updating inventory for product ID {product_id}: {e}")