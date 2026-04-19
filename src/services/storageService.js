/**
 * STORAGE SERVICE - Supabase only
 * Fonte única de dados: Supabase (sem IndexedDB/localStorage)
 */

import supabase, { assertSupabaseConfigured } from './supabaseClient'
import { recordAudit } from './auditService'

const STORES = {
  shoppingList: 'shopping_list',
  products: 'products',
  pricing: 'pricing',
  budgets: 'budgets',
  financialData: 'financial_data',
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function withMetadata(data, userId) {
  const now = new Date().toISOString()
  return {
    ...data,
    id: data.id || generateId(),
    createdAt: data.createdAt || now,
    updatedAt: now,
    createdBy: data.createdBy || userId,
    lastModifiedBy: userId,
  }
}

export async function addDocument(collection, data, userId = 'system') {
  assertSupabaseConfigured()
  const document = withMetadata(data, userId)

  const { data: inserted, error } = await supabase
    .from(collection)
    .insert(document)
    .select('*')
    .single()

  if (error) throw error

  await recordAudit('CREATE', collection, document.id, null, inserted, userId)
  return inserted
}

export async function getDocument(collection, id) {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from(collection)
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function listDocuments(collection, filters = {}) {
  assertSupabaseConfigured()

  let query = supabase.from(collection).select('*').order('createdAt', { ascending: false })

  if (filters.createdAfter) {
    query = query.gte('createdAt', filters.createdAfter)
  }
  if (filters.createdBefore) {
    query = query.lte('createdAt', filters.createdBefore)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function updateDocument(collection, id, updates, userId = 'system') {
  assertSupabaseConfigured()

  const oldData = await getDocument(collection, id)
  if (!oldData) {
    throw new Error(`Documento ${id} não encontrado em ${collection}`)
  }

  const nextData = {
    ...updates,
    updatedAt: new Date().toISOString(),
    lastModifiedBy: userId,
  }

  const { data: updated, error } = await supabase
    .from(collection)
    .update(nextData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  await recordAudit('UPDATE', collection, id, oldData, updated, userId)
  return updated
}

export async function deleteDocument(collection, id, userId = 'system') {
  assertSupabaseConfigured()

  const oldData = await getDocument(collection, id)
  if (!oldData) {
    throw new Error(`Documento ${id} não encontrado em ${collection}`)
  }

  const { error } = await supabase.from(collection).delete().eq('id', id)
  if (error) throw error

  await recordAudit('DELETE', collection, id, oldData, null, userId)
  return true
}

export async function replaceCollection(collection, documents, userId = 'system') {
  assertSupabaseConfigured()

  const { error: deleteError } = await supabase.from(collection).delete().neq('id', '')
  if (deleteError) throw deleteError

  const enriched = documents.map((doc) => withMetadata(doc, userId))
  if (enriched.length > 0) {
    const { error: insertError } = await supabase.from(collection).insert(enriched)
    if (insertError) throw insertError
  }

  await recordAudit('REPLACE_COLLECTION', collection, null, null, { count: enriched.length }, userId)
  return enriched
}

export async function exportCollection(collection) {
  const documents = await listDocuments(collection)
  return JSON.stringify(documents, null, 2)
}

export async function exportAll() {
  const backup = {}
  for (const [key, storeName] of Object.entries(STORES)) {
    backup[key] = await listDocuments(storeName)
  }
  return JSON.stringify(backup, null, 2)
}

export async function importData(jsonData, userId = 'system') {
  const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData

  if (data.shoppingList) {
    await replaceCollection(STORES.shoppingList, data.shoppingList, userId)
  }
  if (data.products) {
    await replaceCollection(STORES.products, data.products, userId)
  }
  if (data.pricing) {
    await replaceCollection(STORES.pricing, data.pricing, userId)
  }
  if (data.budgets) {
    await replaceCollection(STORES.budgets, data.budgets, userId)
  }
  if (data.financialData) {
    await replaceCollection(STORES.financialData, data.financialData, userId)
  }

  await recordAudit('IMPORT_DATA', 'system', null, null, { imported: Object.keys(data) }, userId)
  return true
}

export { STORES }
