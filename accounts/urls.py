from django.contrib.auth import views as auth_views
from django.urls import path
from . import views

urlpatterns = [
    path("login/", auth_views.LoginView.as_view(template_name="registration/login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),

    path("dashboard/", views.dashboard, name="dashboard"),

    # Messages
    path("dashboard/messages/", views.dashboard_messages, name="dashboard_messages"),
    path("dashboard/messages/<int:pk>/", views.dashboard_message_detail, name="dashboard_message_detail"),
    path("dashboard/messages/<int:pk>/delete/", views.dashboard_message_delete, name="dashboard_message_delete"),

    # Newsletter
    path("dashboard/newsletter/", views.dashboard_newsletter, name="dashboard_newsletter"),
    path("dashboard/newsletter/export/", views.dashboard_newsletter_export_csv, name="dashboard_newsletter_export_csv"),
    path("dashboard/newsletter/<int:pk>/delete/", views.dashboard_newsletter_delete, name="dashboard_newsletter_delete"),
]