import os
import threading
from typing import List, Optional


class KeyPool:
    """Round-robin API key pool with automatic rotation on rate limits."""

    def __init__(self, keys: Optional[List[str]] = None):
        if keys:
            self._keys = [k.strip() for k in keys if k.strip()]
        else:
            pool = os.getenv("GOOGLE_API_KEYS", "")
            single = os.getenv("GOOGLE_API_KEY", "")
            if pool:
                self._keys = [k.strip() for k in pool.split(",") if k.strip()]
            elif single:
                self._keys = [single.strip()]
            else:
                self._keys = []
        self._index = 0
        self._lock = threading.Lock()

    @property
    def keys(self) -> List[str]:
        return list(self._keys)

    def has_keys(self) -> bool:
        return len(self._keys) > 0

    def primary(self) -> str:
        if not self._keys:
            raise ValueError("No API keys configured")
        return self._keys[0]

    def next_key(self) -> str:
        if not self._keys:
            raise ValueError("No API keys configured")
        with self._lock:
            key = self._keys[self._index % len(self._keys)]
            self._index += 1
            return key

    def resolve(self, user_key: Optional[str] = None) -> str:
        if user_key and user_key.strip():
            return user_key.strip()
        return self.next_key()


def is_rate_limit_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "429" in msg or "quota" in msg or "rate" in msg or "resource_exhausted" in msg


def is_quota_exhausted(exc: Exception) -> bool:
    """True when the daily quota is exhausted - retrying the same key won't help soon."""
    msg = str(exc).lower()
    return "resource_exhausted" in msg or (
        "429" in msg and "quota exceeded" in msg
    ) or "generatecontent_free_tier_requests" in msg


KEY_POOL = KeyPool()
