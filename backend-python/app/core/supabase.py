from functools import lru_cache

from supabase import Client, create_client # initializes the Supabase Python SDK.

from app.core.config import settings


@lru_cache(maxsize=1) # ensures we reuse one client rather than recreating it on every request.
def get_supabase_client() -> Client:
    return create_client(
        settings.supabase_url,
        settings.supabase_publishable_key,
    )