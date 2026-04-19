/**
 * AUDIT SERVICE - Supabase only
 */

import supabase, { assertSupabaseConfigured } from './supabaseClient'

function computeChanges(oldData, newData) {
  if (!oldData || !newData) return null

  const changes = {}
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])

  allKeys.forEach((key) => {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = {
        from: oldData[key],
        to: newData[key],
      }
    }
  })

  return Object.keys(changes).length > 0 ? changes : null
}

function sanitizeForStorage(data) {
  if (!data) return null

  const sanitized = { ...data }
  delete sanitized.password
  delete sanitized.token
  delete sanitized.secret

  if (sanitized.description && sanitized.description.length > 500) {
    sanitized.description = `${sanitized.description.substring(0, 500)}...`
  }

  return sanitized
}

function baseQuery(filters = {}) {
  let query = supabase.from('audit_log').select('*').order('timestamp', { ascending: false })

  if (filters.userId) {
    query = query.eq('userId', filters.userId)
  }
  if (filters.collection) {
    query = query.eq('collection', filters.collection)
  }
  if (filters.action) {
    query = query.eq('action', filters.action)
  }
  if (filters.documentId) {
    query = query.eq('documentId', filters.documentId)
  }
  if (filters.fromDate) {
    query = query.gte('timestamp', filters.fromDate)
  }
  if (filters.toDate) {
    query = query.lte('timestamp', filters.toDate)
  }

  return query
}

export async function recordAudit(action, collection, documentId, oldData, newData, userId = 'system') {
  assertSupabaseConfigured()

  const entry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    action,
    collection,
    documentId,
    userId,
    changes: computeChanges(oldData, newData),
    oldData: sanitizeForStorage(oldData),
    newData: sanitizeForStorage(newData),
  }

  const { error } = await supabase.from('audit_log').insert(entry)
  if (error) {
    console.error('Erro salvando auditoria no Supabase:', error)
  }

  return entry
}

export async function getAuditLog(filters = {}) {
  assertSupabaseConfigured()

  const { data, error } = await baseQuery(filters)
  if (error) throw error
  return data || []
}

export async function getDocumentHistory(documentId) {
  return getAuditLog({ documentId })
}

export async function getCollectionHistory(collection, limit = 100) {
  const data = await getAuditLog({ collection })
  return data.slice(0, limit)
}

export async function getUserActivity(userId, limit = 100) {
  const data = await getAuditLog({ userId })
  return data.slice(0, limit)
}

export async function getActivitySummary(fromDate, toDate) {
  const entries = await getAuditLog({ fromDate, toDate })

  const summary = {
    totalActions: entries.length,
    byAction: {},
    byCollection: {},
    byUser: {},
    timeRange: { from: fromDate, to: toDate },
  }

  entries.forEach((entry) => {
    summary.byAction[entry.action] = (summary.byAction[entry.action] || 0) + 1
    summary.byCollection[entry.collection] = (summary.byCollection[entry.collection] || 0) + 1
    summary.byUser[entry.userId] = (summary.byUser[entry.userId] || 0) + 1
  })

  return summary
}

export async function exportAuditLog() {
  const entries = await getAuditLog()
  return JSON.stringify(entries, null, 2)
}

export async function clearAuditLog(userId = 'system') {
  assertSupabaseConfigured()

  const oldEntries = await getAuditLog()
  const { error } = await supabase.from('audit_log').delete().neq('id', '')
  if (error) throw error

  await recordAudit('CLEAR_AUDIT_LOG', 'system', null, { count: oldEntries.length }, null, userId)
}

export async function getAuditStats() {
  const entries = await getAuditLog()
  return {
    totalEntries: entries.length,
    firstEntry: entries[entries.length - 1]?.timestamp,
    lastEntry: entries[0]?.timestamp,
    uniqueUsers: new Set(entries.map((e) => e.userId)).size,
    uniqueCollections: new Set(entries.map((e) => e.collection)).size,
    actionCounts: {
      CREATE: entries.filter((e) => e.action === 'CREATE').length,
      UPDATE: entries.filter((e) => e.action === 'UPDATE').length,
      DELETE: entries.filter((e) => e.action === 'DELETE').length,
    },
  }
}
