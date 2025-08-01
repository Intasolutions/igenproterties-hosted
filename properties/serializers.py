from rest_framework import serializers
from .models import Property, PropertyDocument, PropertyKeyDate

class PropertyDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyDocument
        fields = '__all__'

class PropertyKeyDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyKeyDate
        fields = '__all__'

class PropertySerializer(serializers.ModelSerializer):
    documents = PropertyDocumentSerializer(many=True, required=False)
    key_dates = PropertyKeyDateSerializer(many=True, required=False)
    company_name = serializers.ReadOnlyField(source='company.name')
    is_active_display = serializers.SerializerMethodField()
    document_urls = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = '__all__'
        extra_fields = ['company_name', 'is_active_display', 'document_urls']

    def get_is_active_display(self, obj):
        return "Active" if obj.is_active else "Inactive"

    def get_document_urls(self, obj):
        return [doc.file_url.url for doc in obj.documents.all() if doc.file_url]

    def to_internal_value(self, data):
        data = data.copy()
        for field in ['status', 'purpose']:
            value = data.get(field)
            if isinstance(value, list) and len(value) > 0:
                data[field] = value[0]
        return super().to_internal_value(data)

    def create(self, validated_data):
        request = self.context.get('request')
        documents_data = request.FILES.getlist('documents') if request else []
        key_dates_raw = request.data.get('key_dates', '[]')

        import json
        try:
            key_dates_data = json.loads(key_dates_raw)
        except Exception:
            key_dates_data = []

        # Remove nested keys to avoid model conflict
        validated_data.pop('documents', None)
        validated_data.pop('key_dates', None)

        property_instance = Property.objects.create(**validated_data)

        # Save uploaded documents
        for doc_file in documents_data:
            PropertyDocument.objects.create(
                property=property_instance,
                file_url=doc_file,
                file_name=doc_file.name
            )

        # Save key date entries
        for kd in key_dates_data:
            PropertyKeyDate.objects.create(
                property=property_instance,
                date_label=kd.get('date_label', ''),
                due_date=kd.get('due_date', None),
                remarks=kd.get('remarks', '')
            )

        return property_instance
