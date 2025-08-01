from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import dashboard_stats

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/dashboard-stats/', dashboard_stats, name='dashboard-stats'),

    # Include all app-specific APIs
    path('api/users/', include('users.urls')),
    path('api/companies/', include('companies.urls')),
    path('api/banks/', include('banks.urls')),
    path('api/cost-centres/', include('cost_centres.urls')),
    path('api/transaction-types/', include('transaction_types.urls')),
    path('api/', include('transactions.urls')),

    path('api/projects/', include('projects.urls')),
    path('api/entities/', include('entities.urls')),
    path('api/receipts/', include('receipts.urls')),
    path('api/', include('assets.urls')),  # instead of 'api/assets/'
    path('api/', include('contacts.urls')),
    path('api/', include('vendors.urls')),
    path('api/', include('contracts.urls')),
    path('api/cash-ledger/', include('cash_ledger.urls')),
    path('api/reports/', include('reports.urls')),



    # ✅ FIXED: This now registers properties API correctly
    path('api/', include('properties.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
