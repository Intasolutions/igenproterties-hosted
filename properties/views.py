from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Property, PropertyDocument, PropertyKeyDate
from .serializers import PropertySerializer, PropertyDocumentSerializer, PropertyKeyDateSerializer
from users.permissions import IsSuperUser
from rest_framework.permissions import IsAuthenticated


class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
     user = self.request.user

     if user.role == 'SUPER_USER':
        return Property.objects.all().prefetch_related('documents', 'key_dates')
    
     elif user.role == 'PROPERTY_MANAGER':
        # ❗ Only properties belonging to user's companies
        return Property.objects.filter(company__in=user.companies.all()).prefetch_related('documents', 'key_dates')

    # Default fallback — restrict others similarly
     return Property.objects.filter(company__in=user.companies.all()).prefetch_related('documents', 'key_dates')


    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        try:
            prop = self.get_object()
            prop.is_active = not prop.is_active
            prop.save()
            return Response({'status': 'success', 'is_active': prop.is_active})
        except Property.DoesNotExist:
            return Response({'status': 'error', 'message': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)


class PropertyDocumentViewSet(viewsets.ModelViewSet):
    queryset = PropertyDocument.objects.all()
    serializer_class = PropertyDocumentSerializer
    permission_classes = [IsAuthenticated]


class PropertyKeyDateViewSet(viewsets.ModelViewSet):
    queryset = PropertyKeyDate.objects.all()
    serializer_class = PropertyKeyDateSerializer
    permission_classes = [IsAuthenticated]
