from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, ClassifiedTransactionViewSet, bulk_upload_transactions
from .views import spend_by_cost_centre

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'classified-transactions', ClassifiedTransactionViewSet, basename='classified-transactions')

urlpatterns = [
    path('bulk-upload/', bulk_upload_transactions, name='bulk-upload-transactions'),  # ✅ must be outside router
    path('', include(router.urls)),
    path('spend-by-cost-centre/', spend_by_cost_centre),
]


