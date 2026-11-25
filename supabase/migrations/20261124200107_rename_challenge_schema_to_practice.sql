BEGIN;

-- Ensure the migration starts from the expected schema.
DO $preflight$
BEGIN
    IF to_regclass('public.sql_challenges') IS NULL THEN
        RAISE EXCEPTION 'Expected table public.sql_challenges was not found.';
    END IF;

    IF to_regclass('public.user_challenge_progress') IS NULL THEN
        RAISE EXCEPTION 'Expected table public.user_challenge_progress was not found.';
    END IF;

    IF to_regclass('public.practice_items') IS NOT NULL
       OR to_regclass('public.user_practice_progress') IS NOT NULL THEN
        RAISE EXCEPTION 'A target Practice table already exists. Migration stopped.';
    END IF;
END;
$preflight$;

-- Rename existing tables and the progress foreign-key column.
ALTER TABLE public.sql_challenges
    RENAME TO practice_items;

ALTER TABLE public.user_challenge_progress
    RENAME TO user_practice_progress;

ALTER TABLE public.user_practice_progress
    RENAME COLUMN challenge_id TO practice_item_id;

-- Rename Practice item constraints.
ALTER TABLE public.practice_items
    RENAME CONSTRAINT sql_challenges_dataset_id_fkey
    TO practice_items_dataset_id_fkey;

ALTER TABLE public.practice_items
    RENAME CONSTRAINT sql_challenges_dataset_id_slug_key
    TO practice_items_dataset_id_slug_key;

ALTER TABLE public.practice_items
    RENAME CONSTRAINT sql_challenges_dataset_id_sort_order_key
    TO practice_items_dataset_id_sort_order_key;

ALTER TABLE public.practice_items
    RENAME CONSTRAINT sql_challenges_difficulty_check
    TO practice_items_difficulty_check;

ALTER TABLE public.practice_items
    RENAME CONSTRAINT sql_challenges_pkey
    TO practice_items_pkey;

ALTER TABLE public.practice_items
    RENAME CONSTRAINT sql_challenges_points_check
    TO practice_items_points_check;

ALTER TABLE public.practice_items
    RENAME CONSTRAINT sql_challenges_prompt_check
    TO practice_items_prompt_check;

ALTER TABLE public.practice_items
    RENAME CONSTRAINT sql_challenges_slug_check
    TO practice_items_slug_check;

ALTER TABLE public.practice_items
    RENAME CONSTRAINT sql_challenges_sort_order_check
    TO practice_items_sort_order_check;

ALTER TABLE public.practice_items
    RENAME CONSTRAINT sql_challenges_title_check
    TO practice_items_title_check;

ALTER TABLE public.practice_items
    RENAME CONSTRAINT sql_challenges_topic_check
    TO practice_items_topic_check;

-- Rename Practice progress constraints.
ALTER TABLE public.user_practice_progress
    RENAME CONSTRAINT user_challenge_progress_attempts_check
    TO user_practice_progress_attempts_check;

ALTER TABLE public.user_practice_progress
    RENAME CONSTRAINT user_challenge_progress_challenge_id_fkey
    TO user_practice_progress_practice_item_id_fkey;

ALTER TABLE public.user_practice_progress
    RENAME CONSTRAINT user_challenge_progress_check
    TO user_practice_progress_check;

ALTER TABLE public.user_practice_progress
    RENAME CONSTRAINT user_challenge_progress_dataset_version_check
    TO user_practice_progress_dataset_version_check;

ALTER TABLE public.user_practice_progress
    RENAME CONSTRAINT user_challenge_progress_pkey
    TO user_practice_progress_pkey;

ALTER TABLE public.user_practice_progress
    RENAME CONSTRAINT user_challenge_progress_status_check
    TO user_practice_progress_status_check;

ALTER TABLE public.user_practice_progress
    RENAME CONSTRAINT user_challenge_progress_user_id_fkey
    TO user_practice_progress_user_id_fkey;

-- Rename standalone indexes.
ALTER INDEX public.sql_challenges_published_order_idx
    RENAME TO practice_items_published_order_idx;

ALTER INDEX public.user_challenge_progress_user_updated_idx
    RENAME TO user_practice_progress_user_updated_idx;

-- Rename RLS policies without changing their access rules.
ALTER POLICY "Authenticated users can read published challenges"
    ON public.practice_items
    RENAME TO "Authenticated users can read published practice items";

ALTER POLICY "Users can create their own challenge progress"
    ON public.user_practice_progress
    RENAME TO "Users can create their own practice progress";

ALTER POLICY "Users can delete their own challenge progress"
    ON public.user_practice_progress
    RENAME TO "Users can delete their own practice progress";

ALTER POLICY "Users can read their own challenge progress"
    ON public.user_practice_progress
    RENAME TO "Users can read their own practice progress";

ALTER POLICY "Users can update their own challenge progress"
    ON public.user_practice_progress
    RENAME TO "Users can update their own practice progress";

-- Update table comments.
COMMENT ON TABLE public.practice_items IS
    'Administrator-managed ordered SQL practice items; solutions are not stored in this learner-readable table.';

COMMENT ON TABLE public.user_practice_progress IS
    'Private per-user SQL practice progress, scoped to a published dataset version.';

-- Verify the renamed objects and RLS configuration before committing.
DO $verification$
BEGIN
    IF to_regclass('public.sql_challenges') IS NOT NULL
       OR to_regclass('public.user_challenge_progress') IS NOT NULL THEN
        RAISE EXCEPTION 'Old table names still exist.';
    END IF;

    IF to_regclass('public.practice_items') IS NULL
       OR to_regclass('public.user_practice_progress') IS NULL THEN
        RAISE EXCEPTION 'New Practice tables are missing.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_practice_progress'
          AND column_name = 'practice_item_id'
    ) THEN
        RAISE EXCEPTION 'Renamed progress column is missing.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_practice_progress'
          AND column_name = 'challenge_id'
    ) THEN
        RAISE EXCEPTION 'Old progress column still exists.';
    END IF;

    IF NOT (
        SELECT relrowsecurity
        FROM pg_class
        WHERE oid = 'public.practice_items'::regclass
    ) OR NOT (
        SELECT relrowsecurity
        FROM pg_class
        WHERE oid = 'public.user_practice_progress'::regclass
    ) THEN
        RAISE EXCEPTION 'Row-level security is not enabled on both Practice tables.';
    END IF;
END;
$verification$;

COMMIT;