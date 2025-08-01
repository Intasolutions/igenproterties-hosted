from django.contrib import admin
from .models import Transaction, ClassifiedTransaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'company', 'bank_account', 'cost_centre', 'transaction_type', 'direction', 'amount', 'date', 'created_at')
    list_filter = ('company', 'direction', 'date', 'transaction_type')
    search_fields = ('notes',)
    date_hierarchy = 'date'
    ordering = ('-date',)

@admin.register(ClassifiedTransaction)
class ClassifiedTransactionAdmin(admin.ModelAdmin):
    list_display = ('classification_id', 'transaction', 'cost_centre', 'entity', 'transaction_type', 'amount', 'value_date', 'is_active_classification', 'created_at')
    list_filter = ('is_active_classification', 'value_date', 'transaction_type')
    search_fields = ('remarks',)
    ordering = ('-value_date',)
