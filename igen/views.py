from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from transactions.models import Transaction
from companies.models import Company
from banks.models import BankAccount
from cost_centres.models import CostCentre
from transaction_types.models import TransactionType
from users.models import User
from projects.models import Project
from assets.models import Asset
from contacts.models import Contact
from vendors.models import Vendor
from properties.models import Property

from users.serializers import UserSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Returns dashboard summary counts for authorized roles.
    """
    allowed_roles = ['SUPER_USER', 'CENTER_HEAD', 'PROPERTY_MANAGER']

    if not hasattr(request.user, 'role') or request.user.role not in allowed_roles:
        return Response(
            {'detail': '403 Forbidden – You are not authorized to view this dashboard.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # 📊 Summary Counts Only (NO transaction trends)
    total_users = User.objects.count()
    total_companies = Company.objects.count()
    total_projects = Project.objects.count()
    total_properties = Property.objects.count()
    total_assets = Asset.objects.count()
    total_contacts = Contact.objects.count()
    total_cost_centres = CostCentre.objects.count()
    total_banks = BankAccount.objects.count()
    total_vendors = Vendor.objects.count()
    total_transaction_types = TransactionType.objects.count()

    return Response({
        'total_users': total_users,
        'total_companies': total_companies,
        'total_projects': total_projects,
        'total_properties': total_properties,
        'total_assets': total_assets,
        'total_contacts': total_contacts,
        'total_cost_centres': total_cost_centres,
        'total_banks': total_banks,
        'total_vendors': total_vendors,
        'total_transaction_types': total_transaction_types,
         'total_transactions': Transaction.objects.count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    """
    Returns a list of all users.
    """
    try:
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    """
    Creates a new user with proper password handling.
    """
    data = request.data.copy()
    password = data.pop('password', None)
    serializer = UserSerializer(data=data)

    if serializer.is_valid():
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    print("❌ User creation failed:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, pk):
    """
    Deletes a user by ID.
    """
    try:
        user = User.objects.get(pk=pk)
        user.delete()
        return Response({'message': 'User deleted'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
