from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class CustomPagination(PageNumberPagination):
    def get_paginated_response(self, data):
        return Response({
            'pages_count': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'links': {
                'next': self.get_next_link(),
                'previous': self.get_previous_link()
            },
            'result': data
        })


class CustomPageNumberPagination(PageNumberPagination):
    page_size = 10000
    def get_paginated_response(self, data):
        result = data
        return Response({
            'count': self.page.paginator.count,
            'result': result
        })
