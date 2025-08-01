from rest_framework import serializers
from .models import Transaction, ClassifiedTransaction

class TransactionSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    bank_name = serializers.CharField(source='bank_account.account_name', read_only=True)
    cost_centre_name = serializers.CharField(source='cost_centre.name', read_only=True)
    transaction_type_name = serializers.CharField(source='transaction_type.name', read_only=True)
    is_classified = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id',
            'company', 'company_name',
            'bank_account', 'bank_name',
            'cost_centre', 'cost_centre_name',
            'transaction_type', 'transaction_type_name',
            'direction', 'amount', 'date', 'notes', 'created_at',
            'is_classified'
        ]

    def get_is_classified(self, obj):
        return ClassifiedTransaction.objects.filter(transaction=obj).exists()

class ClassifiedTransactionSerializer(serializers.ModelSerializer):
    cost_centre_name = serializers.CharField(source='cost_centre.name', read_only=True)
    entity_name = serializers.CharField(source='entity.name', read_only=True)
    transaction_type_name = serializers.CharField(source='transaction_type.name', read_only=True)
    asset_name = serializers.CharField(source='asset.asset_name', read_only=True, default=None)
    contract_name = serializers.CharField(source='contract.contract_name', read_only=True, default=None)
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    bank_account = serializers.PrimaryKeyRelatedField(read_only=True)
    bank_name = serializers.CharField(source='bank_account.account_name', read_only=True)
    direction = serializers.CharField(read_only=True)

    


    class Meta:
        model = ClassifiedTransaction
        fields = [
            'classification_id',
            'transaction',
            'company', 'company_name',
            'bank_account', 'bank_name',
            'cost_centre', 'cost_centre_name',
            'entity', 'entity_name',
            'transaction_type', 'transaction_type_name',
            'direction',
            'asset', 'asset_name',
            'contract', 'contract_name',
            'amount', 'value_date',
            'remarks', 'is_active_classification', 'created_at',
            'parent_transaction_reference', 'parent_transaction_date' 
        ]
        extra_kwargs = {
            'transaction': {'required': True},
            'cost_centre': {'required': True},
            'entity': {'required': True},
            'transaction_type': {'required': True},
            'amount': {'required': True},
            'value_date': {'required': True},
        }

    def create(self, validated_data):
        transaction = validated_data['transaction']

        # Auto-assign from transaction (snapshot logic)
        validated_data['company'] = transaction.company
        validated_data['bank_account'] = transaction.bank_account
        validated_data['transaction_type'] = transaction.transaction_type
   
        validated_data['parent_transaction_reference'] = str(transaction.id)
        validated_data['parent_transaction_date'] = transaction.date

        return super().create(validated_data)
