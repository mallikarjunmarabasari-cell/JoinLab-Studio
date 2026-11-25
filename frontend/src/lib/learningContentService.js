import { supabase } from './supabase.js'

const DATASET_TABLE = 'learning_datasets'
const PRACTICE_ITEMS_TABLE = 'practice_items'
const PRACTICE_PROGRESS_TABLE = 'user_practice_progress'

export async function getPublishedDatasets() {
  const { data, error } = await supabase
    .from(DATASET_TABLE)
    .select('id, slug, name, description, expected_tables, version')
    .eq('is_published', true)
    .order('name')

  if (error) throw new Error(error.message)

  return data ?? []
}

export async function getPublishedDataset(slug) {
  const { data, error } = await supabase
    .from(DATASET_TABLE)
    .select('id, slug, name, description, dataset_sql, expected_tables, version')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('This dataset is unavailable or unpublished.')

  return data
}

export async function getPublishedPracticeItems(datasetId) {
  const { data, error } = await supabase
    .from(PRACTICE_ITEMS_TABLE)
    .select(
      'id, dataset_id, slug, title, prompt, topic, difficulty, starter_sql, hints, points, sort_order'
    )
    .eq('dataset_id', datasetId)
    .eq('is_published', true)
    .order('sort_order')

  if (error) throw new Error(error.message)

  return data ?? []
}

export async function getUserPracticeProgress(datasetVersion, practiceIds) {
  if (!practiceIds.length) return []

  const { data, error } = await supabase
    .from(PRACTICE_PROGRESS_TABLE)
    .select('practice_item_id, dataset_version, status, attempts, completed_at')
    .eq('dataset_version', datasetVersion)
    .in('practice_item_id', practiceIds)

  if (error) throw new Error(error.message)

  return data ?? []
}

export async function markPracticeCompleted(practiceId, datasetVersion) {
  const timestamp = new Date().toISOString()

  const { data, error } = await supabase
    .from(PRACTICE_PROGRESS_TABLE)
    .upsert(
      {
        practice_item_id: practiceId,
        dataset_version: datasetVersion,
        status: 'completed',
        completed_at: timestamp,
        updated_at: timestamp,
      },
      {
        onConflict: 'user_id,practice_item_id,dataset_version',
      }
    )
    .select('practice_item_id, dataset_version, status, completed_at')
    .single()

  if (error) throw new Error(error.message)

  return data
}
