class BaseService:
    model = None
    serializer_class = None

    @classmethod
    def get_all(cls, filters=None, order_by=None):
        queryset = cls.model.objects.all()
        if filters:
            queryset = queryset.filter(**filters)
        if order_by:
            queryset = queryset.order_by(*order_by)
        return queryset

    @classmethod
    def get_by_id(cls, id):
        return cls.model.objects.filter(id=id).first()

    @classmethod
    def create(cls, **kwargs):
        return cls.model.objects.create(**kwargs)

    @classmethod
    def update(cls, instance, **kwargs):
        for attr, value in kwargs.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    @classmethod
    def delete(cls, instance):
        instance.delete()
        return True

    @classmethod
    def exists(cls, **kwargs):
        return cls.model.objects.filter(**kwargs).exists()

    @classmethod
    def count(cls, filters=None):
        queryset = cls.model.objects.all()
        if filters:
            queryset = queryset.filter(**filters)
        return queryset.count()
