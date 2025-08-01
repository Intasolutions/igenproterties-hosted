from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User
from companies.models import Company


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name']


class UserSerializer(serializers.ModelSerializer):
    companies = CompanySerializer(many=True, read_only=True)
    company_ids = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        many=True,
        write_only=True,
        source='companies',
        required=False,
    )
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'id', 'user_id', 'full_name', 'password', 'role',
            'companies', 'company_ids', 'is_active', 'is_staff', 'is_superuser'
        ]

    def create(self, validated_data):
        companies = validated_data.pop('companies', [])
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        if companies:
            user.companies.set(companies)
        return user

    def update(self, instance, validated_data):
        companies = validated_data.pop('companies', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if companies is not None:
            instance.companies.set(companies)

        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'user_id'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['user_id'] = user.user_id

        # 🔐 If SUPER_USER, skip company enforcement
        if user.role == 'SUPER_USER':
            token['company_id'] = None
        else:
            companies = user.companies.all()
            token['company_id'] = companies[0].id if companies.exists() else None

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user_id'] = self.user.user_id
        data['role'] = self.user.role

        # 🔐 If SUPER_USER, no company is required
        if self.user.role == 'SUPER_USER':
            data['company_id'] = None
        else:
            companies = self.user.companies.all()
            data['company_id'] = companies[0].id if companies.exists() else None

        return data
