import logging
import json
from datetime import datetime, timezone

from redis.exceptions import RedisError

from app.cache.redis_client import redis_client


logger = logging.getLogger(__name__)


class CacheService:
    @staticmethod
    def get_json(key: str):
        try:
            value = redis_client.get(key)
            if not value:
                return None
            return json.loads(value)
        except RedisError as exc:
            logger.warning("Redis get_json failed for key '%s': %s", key, exc)
            return None

    @staticmethod
    def set_json(key: str, data, ttl: int) -> None:
        try:
            redis_client.setex(key, ttl, json.dumps(data, default=str))
        except RedisError as exc:
            logger.warning("Redis set_json failed for key '%s': %s", key, exc)

    @staticmethod
    def delete_key(key: str) -> None:
        try:
            redis_client.delete(key)
        except RedisError as exc:
            logger.warning("Redis delete_key failed for key '%s': %s", key, exc)

    @staticmethod
    def delete_pattern(pattern: str) -> None:
        try:
            keys = redis_client.keys(pattern)
            if keys:
                redis_client.delete(*keys)
        except RedisError as exc:
            logger.warning("Redis delete_pattern failed for pattern '%s': %s", pattern, exc)

    @staticmethod
    def track_user_activity(user_id: str) -> None:
        now_ts = int(datetime.now(timezone.utc).timestamp())
        try:
            redis_client.zadd("active_users", {user_id: now_ts})
        except RedisError as exc:
            logger.warning("Redis track_user_activity failed for user '%s': %s", user_id, exc)

    @staticmethod
    def get_active_users(window_seconds: int) -> int:
        now_ts = int(datetime.now(timezone.utc).timestamp())
        threshold = now_ts - window_seconds
        try:
            redis_client.zremrangebyscore("active_users", 0, threshold)
            return redis_client.zcard("active_users")
        except RedisError as exc:
            logger.warning("Redis get_active_users failed: %s", exc)
            return 0
