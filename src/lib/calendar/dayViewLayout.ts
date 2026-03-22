import type { CalendarEvent } from '../../types'

export type TimedBlock = {
  e: CalendarEvent
  startM: number
  endM: number
}

export type LaidOutBlock = TimedBlock & {
  column: number
  numCols: number
}

function overlaps(a: TimedBlock, b: TimedBlock): boolean {
  return a.startM < b.endM && b.startM < a.endM
}

/** Connected components: events that overlap directly or through a chain share one layout group. */
function clusterBlocks(blocks: TimedBlock[]): TimedBlock[][] {
  const visited = new Set<string>()
  const clusters: TimedBlock[][] = []

  for (const start of blocks) {
    if (visited.has(start.e.id)) continue
    const group: TimedBlock[] = []
    const queue = [start]
    visited.add(start.e.id)

    while (queue.length) {
      const cur = queue.pop()!
      group.push(cur)
      for (const other of blocks) {
        if (visited.has(other.e.id)) continue
        if (overlaps(cur, other)) {
          visited.add(other.e.id)
          queue.push(other)
        }
      }
    }
    clusters.push(group)
  }

  return clusters
}

/**
 * Greedy column assignment within a cluster (like Google Calendar).
 * `numCols` is the number of columns used so every block gets a fair horizontal slice.
 */
function assignColumns(cluster: TimedBlock[]): Map<string, { column: number; numCols: number }> {
  if (cluster.length === 0) return new Map()

  const sorted = [...cluster].sort((a, b) => a.startM - b.startM || b.endM - a.endM)
  /** Last occupied end minute per column. */
  const colEnds: number[] = []
  const columnById = new Map<string, number>()

  for (const b of sorted) {
    let col = -1
    for (let i = 0; i < colEnds.length; i++) {
      if (colEnds[i] <= b.startM) {
        col = i
        colEnds[i] = b.endM
        break
      }
    }
    if (col === -1) {
      col = colEnds.length
      colEnds.push(b.endM)
    }
    columnById.set(b.e.id, col)
  }

  const numCols = Math.max(colEnds.length, 1)
  const out = new Map<string, { column: number; numCols: number }>()
  for (const b of cluster) {
    out.set(b.e.id, { column: columnById.get(b.e.id)!, numCols })
  }
  return out
}

export function layoutTimedBlocks(blocks: TimedBlock[]): LaidOutBlock[] {
  if (blocks.length === 0) return []

  const clusters = clusterBlocks(blocks)
  const result: LaidOutBlock[] = []

  for (const cluster of clusters) {
    const placement = assignColumns(cluster)
    for (const b of cluster) {
      const { column, numCols } = placement.get(b.e.id)!
      result.push({ ...b, column, numCols })
    }
  }

  return result
}
