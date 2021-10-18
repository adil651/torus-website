import jsonDiffer from 'fast-json-patch'
import { cloneDeep } from 'lodash-es'

/** @module */

/**
  converts non-initial history entries into diffs
  @param {array} longHistory
  @returns {array}
*/
function migrateFromSnapshotsToDiffs(longHistory) {
  return (
    longHistory
      // convert non-initial history entries into diffs
      .map((entry, index) => {
        if (index === 0) {
          return entry
        }
        return generateHistoryEntry(longHistory[index - 1], entry)
      })
  )
}

/**
  Generates an array of history objects sense the previous state.
  The object has the keys
    op (the operation performed),
    path (the key and if a nested object then each key will be seperated with a `/`)
    value
  with the first entry having the note and a timestamp when the change took place
  @param {Object} previousState - the previous state of the object
  @param {Object} newState - the update object
  @param {string} [note] - a optional note for the state change
  @returns {array}
*/
function generateHistoryEntry(previousState, newState, note) {
  const entry = jsonDiffer.compare(previousState, newState)
  // Add a note to the first op, since it breaks if we append it to the entry
  if (entry[0]) {
    if (note) {
      entry[0].note = note
    }

    entry[0].timestamp = Date.now()
  }
  return entry
}

/**
  Recovers previous txMeta state obj
  @returns {Object}
*/
function replayHistory(_shortHistory) {
  const shortHistory = cloneDeep(_shortHistory)
  return shortHistory.reduce((val, entry) => jsonDiffer.applyPatch(val, entry).newDocument)
}

/**
  @param {Object} txMeta
  @returns {Object} - a clone object of the txMeta with out history
*/
function snapshotFromTxMeta(txMeta) {
  const shallow = { ...txMeta }
  delete shallow.history
  return cloneDeep(shallow)
}

export { generateHistoryEntry, migrateFromSnapshotsToDiffs, replayHistory, snapshotFromTxMeta }
