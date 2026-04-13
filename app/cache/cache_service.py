import json
from datetime import datetime, timezone

from app.cache.redis_client import redis_client


class CacheService:
    @staticmethod
    def get_json(key: str):
        value = redis_client.get(key)
        if not value:
            return None
        return json.loads(value)

    @staticmethod
    def set_json(key: str, data, ttl: int) -> None:
        redis_client.setex(key, ttl, json.dumps(data, default=str))

    @staticmethod
    def delete_key(key: str) -> None:
        redis_client.delete(key)

    @staticmethod
    def delete_pattern(pattern: str) -> None:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)

    @staticmethod
    def track_user_activity(user_id: str) -> None:
        now_ts = int(datetime.now(timezone.utc).timestamp())
        redis_client.zadd("active_users", {user_id: now_ts})

    @staticmethod
    def get_active_users(window_seconds: int) -> int:
        now_ts = int(datetime.now(timezone.utc).timestamp())
        threshold = now_ts - window_seconds
        redis_client.zremrangebyscore("active_users", 0, threshold)
        return redis_client.zcard("active_users")
