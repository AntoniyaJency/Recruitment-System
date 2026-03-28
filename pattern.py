# Simple class-based singleton (thread-safe)
import threading

class Singleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
        return cls._instance

# Module-level singleton (idiomatic and simple)
# myconfig.py
config = {"db_url": "sqlite:///recruitment.db"}