from django.urls import re_path, path, include
from rest_framework.routers import DefaultRouter

from .views import (index, PostListViewSet, FollowViewSet,
                    FollowingPageViewSet, FavoriteViewSet)

router = DefaultRouter()
router.register(r'posts', PostListViewSet)

urlpatterns = [
    path("", index, name="index"),
    path('api/', include(router.urls)),
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.authtoken')),
    path('api/following/', FollowingPageViewSet.as_view({'get': 'list'})),
    re_path(r'^api/posts/(?P<post_id>\d+)/like/$',
            FavoriteViewSet.as_view({
                'post': 'like',
                'delete': 'unlike'
            })),
    re_path(r'^api/users/(?P<user_id>\d+)/follows/$',
            FollowViewSet.as_view({'get': 'follows'})),
    re_path(r'^api/users/(?P<user_id>\d+)/follow/$',
            FollowViewSet.as_view({
                'post': 'follow',
                'delete': 'unfollow'
            })),
    re_path(r'^api/users/(?P<user_id>\d+)/followers/$',
            FollowViewSet.as_view({'get': 'followers'})),
]
