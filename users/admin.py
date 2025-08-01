from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

class UserAdmin(BaseUserAdmin):
    ordering = ['id']
    list_display = ['user_id', 'full_name', 'role', 'is_active', 'is_staff']
    search_fields = ['user_id', 'full_name']

    fieldsets = (
        (None, {'fields': ('user_id', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'role', 'companies')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('user_id', 'password1', 'password2', 'full_name', 'role', 'companies', 'is_active', 'is_staff', 'is_superuser')}
        ),
    )

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

admin.site.register(User, UserAdmin)
