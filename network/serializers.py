from djoser.serializers import UserSerializer
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed

from .models import User, Post, Follow, Favorite


def get_is_followed(obj, serializer_field):
    request = serializer_field.context.get('request')
    if request is None or not request.user.is_authenticated:
        return False
    result = Follow.objects.filter(user=request.user, author=obj).exists()
    return result


def get_is_liked(obj, serializer_field):
    request = serializer_field.context.get('request')
    if request is None or not request.user.is_authenticated:
        return False
    result = Favorite.objects.filter(user=request.user, post=obj).exists()
    return result


class CustomUserSerializer(UserSerializer):
    is_followed = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'is_followed')


    def get_is_followed(self, obj):
        return get_is_followed(obj, self)


class PostListSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ('id', 'text', 'pub_date', 'author', 'is_liked', 'likes_count')

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['author'] = CustomUserSerializer(instance.author).data
        representation['author']['is_followed'] = get_is_followed(
            instance.author, self)
        return representation

    def get_is_liked(self, obj):
        return get_is_liked(obj, self)

    def get_likes_count(self, obj):
        result = Favorite.objects.filter(post=obj)
        return result.count()


class FavoriteSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Favorite
        fields = ('user',)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['user'] = CustomUserSerializer(instance.user).data
        representation['user']['is_followed'] = get_is_followed(
            instance.user, self)
        return representation


class FollowingPageSerializer(PostListSerializer):

    class Meta:
        model = Post
        fields = PostListSerializer.Meta.fields


class FollowSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='author.id')
    username = serializers.ReadOnlyField(source='author.username')
    email = serializers.ReadOnlyField(source='author.email')
    is_followed = serializers.SerializerMethodField()
    posts = serializers.SerializerMethodField()

    class Meta:
        model = Follow
        fields = CustomUserSerializer.Meta.fields + ('posts',)

    def get_is_followed(self, obj):
        return get_is_followed(obj.author, self)

    def get_posts(self, obj):
        posts = Post.objects.filter(author=obj.author)
        return PostListSerializer(posts, many=True).data


class FollowerSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='user.id')
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Follow
        fields = ('id', 'username', 'email')
