from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import TransactionLedgerCombined
from .serializers import TransactionLedgerSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.http import HttpResponse
import csv


class TransactionLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TransactionLedgerCombined.objects.all().order_by('-date')
    serializer_class = TransactionLedgerSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['date', 'entity', 'cost_centre', 'transaction_type', 'source', 'company']
    ordering_fields = ['date', 'amount']
    search_fields = ['remarks']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Restrict by user's company unless superuser
        if hasattr(user, 'role') and user.role != 'SUPER_USER':
            company = user.companies.first()
            if company:
                queryset = queryset.filter(company=company)
            else:
                return queryset.none()

        # Date range filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        # Optional min/max amount filter
        min_amount = self.request.query_params.get('min_amount')
        max_amount = self.request.query_params.get('max_amount')
        if min_amount:
            try:
                queryset = queryset.filter(amount__gte=float(min_amount))
            except ValueError:
                pass
        if max_amount:
            try:
                queryset = queryset.filter(amount__lte=float(max_amount))
            except ValueError:
                pass

        return queryset

    @action(detail=False, methods=['get'], url_path='summary')
    def get_summary(self, request):
        queryset = self.filter_queryset(self.get_queryset())

        total_credit = queryset.filter(amount__gt=0).aggregate(total=Sum('amount'))['total'] or 0
        total_debit = queryset.filter(amount__lt=0).aggregate(total=Sum('amount'))['total'] or 0
        net = total_credit + total_debit  # debit is negative

        return Response({
            'total_credit': round(total_credit, 2),
            'total_debit': round(abs(total_debit), 2),
            'net': round(net, 2),
        })

    @action(detail=False, methods=['get'], url_path='export')
    def export_csv(self, request):
        queryset = self.filter_queryset(self.get_queryset())

        if not queryset.exists():
            return Response({"detail": "No data to export."}, status=204)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="entity_wise_report.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'Date', 'Source', 'Amount', 'Cost Centre',
            'Entity', 'Transaction Type', 'Asset',
            'Contract', 'Remarks'
        ])

        for row in queryset:
            writer.writerow([
                row.date.strftime('%Y-%m-%d') if row.date else '',
                row.source,
                f"{row.amount:.2f}" if row.amount is not None else '',
                row.cost_centre.name if row.cost_centre else '',
                row.entity.name if row.entity else '',
                row.transaction_type.name if row.transaction_type else '',
                getattr(row.asset, 'name', '') if row.asset else '',
                getattr(row.contract, 'name', '') if row.contract else '',
                row.remarks or ''
            ])
        return response
