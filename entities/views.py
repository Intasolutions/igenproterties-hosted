from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import Entity
from .serializers import EntitySerializer
from users.permissions import IsSuperUser  # adjust your permission as needed

from rest_framework.permissions import IsAuthenticated  # ✅ Import this

class EntityViewSet(viewsets.ModelViewSet):
    serializer_class = EntitySerializer
    permission_classes = [IsAuthenticated]  # ✅ Changed from IsSuperUser

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_USER':
            return Entity.objects.all()
        return Entity.objects.filter(company__in=user.companies.all())

    def perform_create(self, serializer):
        entity_type = self.request.data.get('entity_type')
        linked_property = self.request.data.get('linked_property')
        linked_project = self.request.data.get('linked_project')

        if entity_type == 'Property' and not linked_property:
            raise ValidationError({"linked_property": "linked_property is required for entity_type=Property"})
        if entity_type == 'Project' and not linked_project:
            raise ValidationError({"linked_project": "linked_project is required for entity_type=Project"})
        if entity_type == 'Internal' and (linked_property or linked_project):
            raise ValidationError("linked_property or linked_project must not be set for entity_type=Internal")

        serializer.save()

    def perform_update(self, serializer):
        self.perform_create(serializer)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = 'Inactive'
        instance.save()
        return Response({'detail': 'Entity soft-deleted (status set to Inactive).'}, status=status.HTTP_200_OK)
