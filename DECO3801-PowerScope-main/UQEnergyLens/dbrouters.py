class AuthRouter:
    """
    Routes Django's built-in auth models to the 'users' database.
    Everything else stays on the default timescaleDB database.
    """

    route_app_labels = {"auth", "contenttypes", "sessions", "admin"}

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.route_app_labels:
            return "users"
        return None
    
    def db_for_write(self, model, **hints):
        if model._meta_app_label in self.route_app_labels:
            return "users"
        return None
    
    def allow_relations(self, obj1, obj2, **hints):
        db_list = ("users", "default")
        if obj1._state.db in db_list and obj2._state.db in db_list:
            return True
        return None
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label in self.route_app_labels:
            return db == "users"
        return db == "default"