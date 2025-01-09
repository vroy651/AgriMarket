from rest_framework import permissions

class IsSellerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, 'seller'):
          return obj.seller == request.user
        return False

class IsOrderParticipant(permissions.BasePermission):
    """
    Custom permission to only allow buyers and sellers involved in an order
    to view or modify it.
    """
    def has_object_permission(self, request, view, obj):
        return obj.buyer == request.user or obj.seller == request.user