import { supabase } from './supabase.js'

const TABLE_NAME = 'saved_sql_scripts'
const SCRIPT_COLUMNS = 'id, name, sql_text, created_at, updated_at'

function validateScriptInput(name, sqlText) {
  const normalizedName = typeof name === 'string' ? name.trim() : ''

  if (!normalizedName) {
    throw new Error('Enter a name for the SQL script.')
  }

  if (normalizedName.length > 100) {
    throw new Error('Script name cannot exceed 100 characters.')
  }

  if (typeof sqlText !== 'string' || !sqlText.trim()) {
    throw new Error('SQL script cannot be empty.')
  }

  if (sqlText.length > 100000) {
    throw new Error('SQL script cannot exceed 100,000 characters.')
  }

  return {
    name: normalizedName,
    sql_text: sqlText,
  }
}

function validateScriptId(scriptId) {
  if (typeof scriptId !== 'string' || !scriptId.trim()) {
    throw new Error('A valid saved script ID is required.')
  }

  return scriptId
}

// Retrieve scripts belonging to the authenticated user.
export async function getSavedScripts() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(SCRIPT_COLUMNS)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

// Create a new script. The database assigns user_id through auth.uid().
export async function createSavedScript(name, sqlText) {
  const scriptInput = validateScriptInput(name, sqlText)

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(scriptInput)
    .select(SCRIPT_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Update an existing script owned by the authenticated user.
export async function updateSavedScript(scriptId, name, sqlText) {
  const validId = validateScriptId(scriptId)
  const scriptInput = validateScriptInput(name, sqlText)

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      ...scriptInput,
      updated_at: new Date().toISOString(),
    })
    .eq('id', validId)
    .select(SCRIPT_COLUMNS)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Script not found or access denied.')
  }

  return data
}

// Delete a script owned by the authenticated user.
export async function deleteSavedScript(scriptId) {
  const validId = validateScriptId(scriptId)

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', validId)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Script not found or access denied.')
  }

  return data.id
}
