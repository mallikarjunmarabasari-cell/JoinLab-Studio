-- Create slug-based learner progress storage.
-- Existing progress and curriculum tables remain untouched.

-- 1. Validate that every existing record can be mapped to stable slugs.
DO $$
DECLARE
    unmapped_count BIGINT;
    duplicate_count BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO unmapped_count
    FROM public.user_practice_progress AS pr
    LEFT JOIN public.practice_items AS p
        ON p.id = pr.practice_item_id
    LEFT JOIN public.learning_datasets AS d
        ON d.id = p.dataset_id
    WHERE p.id IS NULL
       OR d.id IS NULL
       OR d.slug IS NULL
       OR p.slug IS NULL
       OR d.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
       OR p.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';

    IF unmapped_count > 0 THEN
        RAISE EXCEPTION
            'Migration stopped: % existing progress records cannot be mapped to valid dataset and practice slugs.',
            unmapped_count;
    END IF;

    SELECT COUNT(*)
    INTO duplicate_count
    FROM (
        SELECT
            pr.user_id,
            d.slug,
            p.slug,
            pr.dataset_version
        FROM public.user_practice_progress AS pr
        JOIN public.practice_items AS p
            ON p.id = pr.practice_item_id
        JOIN public.learning_datasets AS d
            ON d.id = p.dataset_id
        GROUP BY
            pr.user_id,
            d.slug,
            p.slug,
            pr.dataset_version
        HAVING COUNT(*) > 1
    ) AS duplicates;

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION
            'Migration stopped: % duplicate slug-based progress keys were found.',
            duplicate_count;
    END IF;
END;
$$;

-- 2. Create the new table without curriculum foreign keys.
CREATE TABLE public.user_practice_progress_v2 (
    user_id UUID NOT NULL DEFAULT auth.uid()
        REFERENCES auth.users(id) ON DELETE CASCADE,

    dataset_slug TEXT NOT NULL
        CHECK (dataset_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

    practice_slug TEXT NOT NULL
        CHECK (practice_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

    dataset_version INTEGER NOT NULL
        CHECK (dataset_version > 0),

    status TEXT NOT NULL
        CHECK (status IN ('in_progress', 'completed')),

    attempts INTEGER NOT NULL DEFAULT 0
        CHECK (attempts >= 0),

    first_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT user_practice_progress_v2_completion_check
        CHECK (
            (status = 'completed' AND completed_at IS NOT NULL)
            OR
            (status = 'in_progress' AND completed_at IS NULL)
        ),

    CONSTRAINT user_practice_progress_v2_pkey
        PRIMARY KEY (
            user_id,
            dataset_slug,
            practice_slug,
            dataset_version
        )
);

COMMENT ON TABLE public.user_practice_progress_v2 IS
    'Learner progress keyed by local dataset and practice slugs. Dataset curriculum is stored in the frontend repository.';

-- 3. Copy all existing progress, including in-progress records.
INSERT INTO public.user_practice_progress_v2 (
    user_id,
    dataset_slug,
    practice_slug,
    dataset_version,
    status,
    attempts,
    first_started_at,
    completed_at,
    updated_at
)
SELECT
    pr.user_id,
    d.slug,
    p.slug,
    pr.dataset_version,
    pr.status,
    pr.attempts,
    pr.first_started_at,
    pr.completed_at,
    pr.updated_at
FROM public.user_practice_progress AS pr
JOIN public.practice_items AS p
    ON p.id = pr.practice_item_id
JOIN public.learning_datasets AS d
    ON d.id = p.dataset_id;

-- 4. Index progress lookups for the authenticated user and selected dataset.
CREATE INDEX user_practice_progress_v2_lookup_idx
ON public.user_practice_progress_v2 (
    user_id,
    dataset_slug,
    dataset_version,
    practice_slug
);

-- 5. Enable row-level security.
ALTER TABLE public.user_practice_progress_v2
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own local practice progress"
ON public.user_practice_progress_v2
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own local practice progress"
ON public.user_practice_progress_v2
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own local practice progress"
ON public.user_practice_progress_v2
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own local practice progress"
ON public.user_practice_progress_v2
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 6. Grant authenticated users the operations permitted by RLS.
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.user_practice_progress_v2
TO authenticated;


-- 7. Verify that every original progress record was copied exactly.
DO $$
DECLARE
    old_count BIGINT;
    new_count BIGINT;
    mismatch_count BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO old_count
    FROM public.user_practice_progress;

    SELECT COUNT(*)
    INTO new_count
    FROM public.user_practice_progress_v2;

    IF old_count <> new_count THEN
        RAISE EXCEPTION
            'Progress migration verification failed: old table has % records; new table has % records.',
            old_count,
            new_count;
    END IF;

    SELECT COUNT(*)
    INTO mismatch_count
    FROM public.user_practice_progress AS old_pr
    JOIN public.practice_items AS p
        ON p.id = old_pr.practice_item_id
    JOIN public.learning_datasets AS d
        ON d.id = p.dataset_id
    LEFT JOIN public.user_practice_progress_v2 AS new_pr
        ON new_pr.user_id = old_pr.user_id
        AND new_pr.dataset_slug = d.slug
        AND new_pr.practice_slug = p.slug
        AND new_pr.dataset_version = old_pr.dataset_version
    WHERE new_pr.user_id IS NULL
       OR new_pr.status IS DISTINCT FROM old_pr.status
       OR new_pr.attempts IS DISTINCT FROM old_pr.attempts
       OR new_pr.first_started_at IS DISTINCT FROM old_pr.first_started_at
       OR new_pr.completed_at IS DISTINCT FROM old_pr.completed_at
       OR new_pr.updated_at IS DISTINCT FROM old_pr.updated_at;

    IF mismatch_count > 0 THEN
        RAISE EXCEPTION
            'Progress migration verification failed: % records are missing or differ from the original.',
            mismatch_count;
    END IF;

    RAISE NOTICE
        'Progress migration verified: all % records copied successfully.',
        old_count;
END;
$$;