from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import (IsAuthenticatedOrReadOnly,
                                        IsAuthenticated)
from rest_framework.response import Response
from rest_framework.status import (HTTP_400_BAD_REQUEST, HTTP_201_CREATED,
                                   HTTP_204_NO_CONTENT)
from djoser.views import UserViewSet
from django_filters.rest_framework import DjangoFilterBackend

from .models import User, Post, Follow, Favorite
from .serializers import (PostListSerializer, FollowSerializer,
                          FollowerSerializer, CustomUserSerializer,
                          FollowingPageSerializer, FavoriteSerializer)
from .pagination import CustomPagination, CustomPageNumberPagination


def index(request):
    return render(request, "network/index.html")


class CustomUserViewSet(UserViewSet):
    queryset = User.objects.all()
    serializer_class = CustomUserSerializer


class PostListViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ('author',)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class FavoriteViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = CustomPageNumberPagination

    @action(detail=False, methods=['post'], url_path='like')
    def like(self, request, post_id):
        user = request.user
        post = get_object_or_404(Post, id=post_id)
        if Favorite.objects.filter(user=user, post=post).exists():
            return Response({'errors': 'You already liked this post'},
                            status=HTTP_400_BAD_REQUEST)
        like = Favorite.objects.create(user=user, post=post)
        serializer = FavoriteSerializer(like, context={'request': request})
        return Response(serializer.data, status=HTTP_201_CREATED)

    @action(detail=False, methods=['delete'], url_path='unlike')
    def unlike(self, request, post_id):
        user = request.user
        post = get_object_or_404(Post, id=post_id)
        like = Favorite.objects.filter(user=user, post=post)
        if like.exists():
            like.delete()
        else:
            return Response({'error': 'Like does not exist'},
                            status=HTTP_400_BAD_REQUEST)
        return Response(status=HTTP_204_NO_CONTENT)

class FollowingPageViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = FollowingPageSerializer
    permission_classes = (IsAuthenticated, )
    pagination_class = CustomPagination

    @action(detail=False, methods=['get'], url_path='following')
    def list(self, request):
        user = request.user
        context = {'request': request}
        followed_authors = User.objects.filter(
            pk__in=[f.author.pk for f in Follow.objects.filter(user=user)]
        )
        posts = Post.objects.filter(author__in=followed_authors)
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = FollowingPageSerializer(page, many=True,
                                                 context=context)
            return self.get_paginated_response(serializer.data)
        FollowingPageSerializer(posts, many=True, context=context)
        return Response(serializer.data)


class FollowViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = FollowSerializer
    permission_classes = (IsAuthenticatedOrReadOnly,)
    pagination_class = CustomPageNumberPagination

    @action(detail=False, methods=['get'], url_path='follows')
    def follows(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        follows = Follow.objects.filter(user=user)
        context = {'request': request}
        page = self.paginate_queryset(follows)
        if page is not None:
            serializer = FollowSerializer(page, many=True, context=context)
            return self.get_paginated_response(serializer.data)
        serializer = FollowSerializer(follows, many=True,
                                      context=context)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='followers')
    def followers(self, request, user_id):
        author = get_object_or_404(User, id=user_id)
        followers = Follow.objects.filter(author=author)
        context = {'request': request}
        page = self.paginate_queryset(followers)
        if page is not None:
            serializer = FollowerSerializer(page, many=True, context=context)
            return self.get_paginated_response(serializer.data)
        serializer = FollowerSerializer(followers, many=True,
                                        context=context)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='follow')
    def follow(self, request, user_id):
        user = request.user
        to_user = get_object_or_404(User, id=user_id)
        if user == to_user:
            return Response({'errors': 'You cannot follow yourself'},
                            status=HTTP_400_BAD_REQUEST)
        if Follow.objects.filter(user=user, author=to_user).exists():
            return Response({'errors': 'You already followed this user'},
                            status=HTTP_400_BAD_REQUEST)
        follow = Follow.objects.create(user=user, author=to_user)
        serializer = FollowSerializer(follow,
                                      context={'request': request})
        return Response(serializer.data, status=HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='follow')
    def unfollow(self, request, user_id):
        user = request.user
        to_user = get_object_or_404(User, id=user_id)
        follow = Follow.objects.filter(user=user, author=to_user)
        if follow.exists():
            follow.delete()
        else:
            return Response({'error': 'Follow does not exist'},
                            status=HTTP_400_BAD_REQUEST)
        return Response(status=HTTP_204_NO_CONTENT)
