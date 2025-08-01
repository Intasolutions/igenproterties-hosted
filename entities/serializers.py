from rest_framework import serializers
from .models import Entity

class EntitySerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    linked_property_name = serializers.CharField(source='linked_property.name', read_only=True)
    linked_project_name = serializers.CharField(source='linked_project.name', read_only=True)

    class Meta:
        model = Entity
        fields = [
            'id',  # ✅ Use default `id`, not `entity_id` unless your model explicitly defines it.
            'company', 'company_name',
            'name', 'entity_type',
            'linked_property', 'linked_property_name',
            'linked_project', 'linked_project_name',
            'status', 'remarks',
        ]
        read_only_fields = [
            'id', 'company_name', 'linked_property_name', 'linked_project_name'
        ]

    def validate(self, data):
        entity_type = data.get('entity_type')
        linked_property = data.get('linked_property')
        linked_project = data.get('linked_project')

        if entity_type == 'Property' and not linked_property:
            raise serializers.ValidationError({
                "linked_property": "linked_property is required for entity_type='Property'"
            })

        if entity_type == 'Project' and not linked_project:
            raise serializers.ValidationError({
                "linked_project": "linked_project is required for entity_type='Project'"
            })

        if entity_type == 'Internal' and (linked_property or linked_project):
            raise serializers.ValidationError(
                "linked_property or linked_project must not be set for entity_type='Internal'"
            )

        return data
