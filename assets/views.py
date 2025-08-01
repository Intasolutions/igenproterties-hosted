from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Asset, AssetDocument, AssetServiceDue
from .serializers import AssetSerializer, AssetDocumentSerializer, AssetServiceDueSerializer
from rest_framework.permissions import IsAuthenticated

class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_queryset = Asset.objects.filter(is_active=True)
        if user.role == 'SUPER_USER':
            return base_queryset.order_by('-created_at')
        return base_queryset.filter(company__in=user.companies.all()).order_by('-created_at')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AssetDocumentViewSet(viewsets.ModelViewSet):
    queryset = AssetDocument.objects.all()
    serializer_class = AssetDocumentSerializer
    permission_classes = [IsAuthenticated]

class AssetServiceDueViewSet(viewsets.ModelViewSet):
    queryset = AssetServiceDue.objects.all()
    serializer_class = AssetServiceDueSerializer
    permission_classes = [IsAuthenticated]
