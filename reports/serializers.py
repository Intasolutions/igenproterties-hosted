from rest_framework import serializers
from .models import TransactionLedgerCombined

class TransactionLedgerSerializer(serializers.ModelSerializer):
    entity_name = serializers.CharField(source='entity.name', read_only=True)
    cost_centre_name = serializers.CharField(source='cost_centre.name', read_only=True)
    transaction_type_name = serializers.CharField(source='transaction_type.name', read_only=True)

    class Meta:
        model = TransactionLedgerCombined
        fields = '__all__'
        read_only_fields = ['entity_name', 'cost_centre_name', 'transaction_type_name']
