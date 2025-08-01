from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from rest_framework.permissions import IsAuthenticated
from .models import Transaction, ClassifiedTransaction
from companies.models import Company
from banks.models import BankAccount
from cost_centres.models import CostCentre
from transaction_types.models import TransactionType
from .serializers import TransactionSerializer, ClassifiedTransactionSerializer
import csv
from io import TextIOWrapper
from django.db.models import Sum, DecimalField, Exists, OuterRef
from django.db.models.functions import Coalesce


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        """
        By default, return only unclassified transactions.
        If ?show_all=true, return all.
        """
        queryset = Transaction.objects.all()

        if self.request.query_params.get('show_all') == 'true':
            return queryset

        classified_subquery = ClassifiedTransaction.objects.filter(transaction=OuterRef('pk'))
        return queryset.annotate(
            has_classification=Exists(classified_subquery)
        ).filter(has_classification=False)

    @action(detail=True, methods=["get"])
    def classified_entries(self, request, pk=None):
        try:
            transaction = self.get_object()
        except Transaction.DoesNotExist:
            return Response({"error": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)

        classified = ClassifiedTransaction.objects.filter(transaction=transaction)
        serializer = ClassifiedTransactionSerializer(classified, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def classification_status(self, request, pk=None):
        """
        Returns classification status and summary.
        """
        try:
            transaction = self.get_object()
        except Transaction.DoesNotExist:
            return Response({"error": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)

        splits = ClassifiedTransaction.objects.filter(transaction=transaction)
        total_split = splits.aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            "is_classified": splits.exists(),
            "split_matches": float(total_split) == float(transaction.amount),
            "total_split": total_split,
            "original_amount": transaction.amount
        })


class ClassifiedTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = ClassifiedTransactionSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        queryset = ClassifiedTransaction.objects.all()
        transaction_id = self.request.query_params.get('transaction')
        if transaction_id:
            queryset = queryset.filter(transaction__id=transaction_id)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data

        if not isinstance(data, list) or len(data) == 0:
            return Response({"error": "Expected a non-empty list of split entries."},
                            status=status.HTTP_400_BAD_REQUEST)

        transaction_id = data[0].get("transaction")
        try:
            transaction = Transaction.objects.get(id=transaction_id)
        except Transaction.DoesNotExist:
            return Response({"error": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)

        if ClassifiedTransaction.objects.filter(transaction=transaction).exists():
            if request.query_params.get('force') != 'true':
                return Response({"error": "Transaction already classified. Use ?force=true to overwrite."},
                                status=status.HTTP_400_BAD_REQUEST)
            # Overwrite mode
            ClassifiedTransaction.objects.filter(transaction=transaction).delete()

        total_split_amount = 0
        for entry in data:
            try:
                total_split_amount += float(entry.get("amount", 0))
            except Exception:
                return Response({"error": "Invalid amount in one of the split entries."},
                                status=status.HTTP_400_BAD_REQUEST)

        if float(transaction.amount) != total_split_amount:
            return Response(
                {"error": f"Split amount ({total_split_amount}) must equal the transaction amount ({transaction.amount})."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST", "OPTIONS"])
def bulk_upload_transactions(request):
    if "file" not in request.FILES:
        return Response({"error": "CSV file is required."}, status=status.HTTP_400_BAD_REQUEST)

    csv_file = request.FILES["file"]

    try:
        decoded_file = TextIOWrapper(csv_file.file, encoding="utf-8")
        reader = csv.DictReader(decoded_file)

        transactions = []
        errors = []

        for row_number, row in enumerate(reader, start=1):
            row_errors = {}

            try:
                company = Company.objects.get(name__iexact=row["company"])
                row["company"] = company.pk
            except Company.DoesNotExist:
                row_errors["company"] = f"Company '{row['company']}' not found."

            try:
                bank = BankAccount.objects.get(account_name__iexact=row["bank_account"])
                row["bank_account"] = bank.pk
            except BankAccount.DoesNotExist:
                row_errors["bank_account"] = f"BankAccount '{row['bank_account']}' not found."

            try:
                cost_centre = CostCentre.objects.get(name__iexact=row["cost_centre"])
                row["cost_centre"] = cost_centre.pk
            except CostCentre.DoesNotExist:
                row_errors["cost_centre"] = f"CostCentre '{row['cost_centre']}' not found."

            try:
                transaction_type = TransactionType.objects.get(name__iexact=row["transaction_type"])
                row["transaction_type"] = transaction_type.pk
            except TransactionType.DoesNotExist:
                row_errors["transaction_type"] = f"TransactionType '{row['transaction_type']}' not found."

            if row_errors:
                errors.append({
                    "row": row_number,
                    "data": row,
                    "errors": row_errors
                })
                continue

            serializer = TransactionSerializer(data=row)
            if serializer.is_valid():
                transactions.append(serializer)
            else:
                errors.append({
                    "row": row_number,
                    "data": row,
                    "errors": serializer.errors
                })

        if errors:
            return Response({
                "message": "Validation failed for some rows.",
                "errors": errors
            }, status=status.HTTP_400_BAD_REQUEST)

        for serializer in transactions:
            serializer.save()

        return Response({
            "message": f"{len(transactions)} transactions uploaded successfully."
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def spend_by_cost_centre(request):
    start = request.query_params.get("start")
    end = request.query_params.get("end")

    filters = {}
    if start:
        filters["date__gte"] = start
    if end:
        filters["date__lte"] = end

    data = (
        Transaction.objects
        .filter(**filters)
        .values("cost_centre__name")
        .annotate(
            total_spent=Coalesce(Sum("amount"), 0, output_field=DecimalField())
        )
        .order_by("-total_spent")
    )
    result = [
        {"cost_centre": item["cost_centre__name"], "total": item["total_spent"]}
        for item in data if item["cost_centre__name"]
    ]

    return Response(result)

