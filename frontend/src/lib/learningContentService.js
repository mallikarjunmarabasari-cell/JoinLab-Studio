import { supabase } from './supabase.js'

import {
    getLocalDatasets,
    getLocalDataset,
    getLocalPracticeItems,
} from '../content/datasets/index.js'

const PRACTICE_PROGRESS_TABLE = 'user_practice_progress_v2'

// Dataset definitions are bundled with the frontend.
export async function getPublishedDatasets() {
    return getLocalDatasets()
}

export async function getPublishedDataset(slug) {
    const dataset = getLocalDataset(slug)

    if (!dataset) {
        throw new Error('This local dataset is unavailable.')
    }

    return dataset
}

export async function getPublishedPracticeItems(datasetSlug) {
    const dataset = getLocalDataset(datasetSlug)

    if (!dataset) {
        throw new Error('This local dataset is unavailable.')
    }

    return getLocalPracticeItems(datasetSlug)
}

// Learner progress remains synchronized through Supabase.
export async function getUserPracticeProgress(
    datasetSlug,
    datasetVersion,
    practiceSlugs
) {
    if (!practiceSlugs.length) return []

    const { data, error } = await supabase
        .from(PRACTICE_PROGRESS_TABLE)
        .select(
            'dataset_slug, practice_slug, dataset_version, status, attempts, completed_at'
        )
        .eq('dataset_slug', datasetSlug)
        .eq('dataset_version', datasetVersion)
        .in('practice_slug', practiceSlugs)

    if (error) throw new Error(error.message)

    return data ?? []
}

export async function markPracticeCompleted(
    datasetSlug,
    practiceSlug,
    datasetVersion
) {
    const timestamp = new Date().toISOString()

    const { data, error } = await supabase
        .from(PRACTICE_PROGRESS_TABLE)
        .upsert(
            {
                dataset_slug: datasetSlug,
                practice_slug: practiceSlug,
                dataset_version: datasetVersion,
                status: 'completed',
                completed_at: timestamp,
                updated_at: timestamp,
            },
            {
                onConflict:
                    'user_id,dataset_slug,practice_slug,dataset_version',
            }
        )
        .select(
            'dataset_slug, practice_slug, dataset_version, status, attempts, completed_at'
        )
        .single()

    if (error) throw new Error(error.message)

    return data
}