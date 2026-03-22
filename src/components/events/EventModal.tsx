import { useEffect, useState, type FormEvent } from 'react'
import type { CalendarEvent, EventColor } from '../../types'
import { pad2 } from '../../lib/calendar/dateUtils'
import { EVENT_COLOR_OPTIONS, eventDotColor } from '../calendar/eventColors'
import { useEventAttachmentsQuery } from '../../hooks/useEventAttachments'
import {
  useCreateEventMutation,
  useDeleteAttachmentMutation,
  useDeleteEventMutation,
  useUpdateEventMutation,
  useUploadAttachmentMutation,
} from '../../hooks/useEventMutations'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormLabel,
  Link,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

type ScheduleMode = 'single_day' | 'range'

function todayLocalISO(): string {
  const t = new Date()
  return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`
}

/** Local wall clock → ISO UTC string */
function localDateTimeToISO(dateStr: string, timeStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  if ([y, mo, d, hh, mm].some((n) => Number.isNaN(n))) {
    return new Date().toISOString()
  }
  const dt = new Date(y, mo - 1, d, hh, mm, 0, 0)
  return Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString()
}

function fromISOToLocalDateAndTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  }
}

function sameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

type Props = {
  open: boolean
  onClose: () => void
  accessToken: string
  initial?: CalendarEvent | null
  defaultRange?: { start: Date; end: Date }
  /** YYYY-MM-DD from calendar store when opening create from a day cell. */
  selectedDate?: string | null
}

export function EventModal({
  open,
  onClose,
  accessToken,
  initial,
  defaultRange,
  selectedDate,
}: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('single_day')
  const [dayDate, setDayDate] = useState('')
  const [dayStartTime, setDayStartTime] = useState('09:00')
  const [dayEndTime, setDayEndTime] = useState('10:00')
  const [rangeStartDate, setRangeStartDate] = useState('')
  const [rangeStartTime, setRangeStartTime] = useState('09:00')
  const [rangeEndDate, setRangeEndDate] = useState('')
  const [rangeEndTime, setRangeEndTime] = useState('10:00')
  const [color, setColor] = useState<EventColor>('sky')
  const [location, setLocation] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const createMut = useCreateEventMutation(accessToken)
  const updateMut = useUpdateEventMutation(accessToken)
  const deleteMut = useDeleteEventMutation(accessToken)
  const uploadMut = useUploadAttachmentMutation(accessToken)
  const deleteAttMut = useDeleteAttachmentMutation(accessToken)

  const attachmentsQuery = useEventAttachmentsQuery({
    eventId: initial?.id ?? null,
    accessToken,
    enabled: open && Boolean(initial?.id),
  })

  useEffect(() => {
    if (!open) return
    setError(null)
    setConfirmDelete(false)
    setFiles([])

    if (initial) {
      setTitle(initial.title)
      setDescription(initial.description ?? '')
      setColor(initial.color)
      setLocation(initial.location ?? '')
      setIsPublic(initial.is_public)

      const s = new Date(initial.start_time)
      const e = new Date(initial.end_time)

      if (initial.is_all_day) {
        setScheduleMode('single_day')
        const d = fromISOToLocalDateAndTime(initial.start_time)
        setDayDate(d.date)
        setDayStartTime('00:00')
        setDayEndTime('23:59')
      } else if (sameLocalCalendarDay(s, e)) {
        setScheduleMode('single_day')
        const ds = fromISOToLocalDateAndTime(initial.start_time)
        const de = fromISOToLocalDateAndTime(initial.end_time)
        setDayDate(ds.date)
        setDayStartTime(ds.time)
        setDayEndTime(de.time)
      } else {
        setScheduleMode('range')
        const ds = fromISOToLocalDateAndTime(initial.start_time)
        const de = fromISOToLocalDateAndTime(initial.end_time)
        setRangeStartDate(ds.date)
        setRangeStartTime(ds.time)
        setRangeEndDate(de.date)
        setRangeEndTime(de.time)
      }
    } else {
      setTitle('')
      setDescription('')
      setColor('sky')
      setLocation('')
      setIsPublic(false)

      if (defaultRange) {
        setScheduleMode('range')
        const ds = fromISOToLocalDateAndTime(defaultRange.start.toISOString())
        const de = fromISOToLocalDateAndTime(defaultRange.end.toISOString())
        setRangeStartDate(ds.date)
        setRangeStartTime(ds.time)
        setRangeEndDate(de.date)
        setRangeEndTime(de.time)
        setDayDate(ds.date)
        setDayStartTime(ds.time)
        setDayEndTime(de.date === ds.date ? de.time : '10:00')
      } else {
        setScheduleMode('single_day')
        const anchor =
          selectedDate != null && selectedDate !== '' ? selectedDate : todayLocalISO()
        setDayDate(anchor)
        const s = new Date(`${anchor}T09:00:00`)
        const e = new Date(s.getTime() + 60 * 60 * 1000)
        setDayStartTime(fromISOToLocalDateAndTime(s.toISOString()).time)
        setDayEndTime(fromISOToLocalDateAndTime(e.toISOString()).time)
        setRangeStartDate(anchor)
        setRangeStartTime('09:00')
        setRangeEndDate(anchor)
        setRangeEndTime('10:00')
      }
    }
  }, [open, initial, defaultRange, selectedDate])

  const loading =
    createMut.isPending ||
    updateMut.isPending ||
    deleteMut.isPending ||
    uploadMut.isPending ||
    deleteAttMut.isPending

  function computeStartEndISO(): { start_time: string; end_time: string } | null {
    if (scheduleMode === 'single_day') {
      if (!dayDate) {
        setError('Pick a date')
        return null
      }
      const start_time = localDateTimeToISO(dayDate, dayStartTime)
      const end_time = localDateTimeToISO(dayDate, dayEndTime)
      if (new Date(end_time) < new Date(start_time)) {
        setError('End time must be after start time on the same day')
        return null
      }
      return { start_time, end_time }
    }

    if (!rangeStartDate || !rangeEndDate) {
      setError('Start and end dates are required')
      return null
    }
    const start_time = localDateTimeToISO(rangeStartDate, rangeStartTime)
    const end_time = localDateTimeToISO(rangeEndDate, rangeEndTime)
    if (new Date(end_time) < new Date(start_time)) {
      setError('End must be after start')
      return null
    }
    return { start_time, end_time }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const t = title.trim()
    if (!t) {
      setError('Title is required')
      return
    }

    const times = computeStartEndISO()
    if (!times) return

    const body = {
      title: t,
      description: description.trim() || null,
      start_time: times.start_time,
      end_time: times.end_time,
      is_all_day: false,
      color,
      location: location.trim() || null,
      is_public: isPublic,
    }

    try {
      let eventId: string
      if (initial) {
        await updateMut.mutateAsync({ id: initial.id, body })
        eventId = initial.id
      } else {
        const row = await createMut.mutateAsync(body)
        eventId = row.id
      }

      for (const f of files) {
        await uploadMut.mutateAsync({ eventId, file: f })
      }

      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function onDelete() {
    if (!initial) return
    setError(null)
    try {
      await deleteMut.mutateAsync(initial.id)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setConfirmDelete(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="body">
      <DialogTitle>{initial ? 'Edit event' : 'New event'}</DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Title"
              required
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Box component="fieldset" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, m: 0 }}>
              <FormLabel component="legend" sx={{ px: 0.5, fontWeight: 600 }}>
                When
              </FormLabel>
              <RadioGroup
                row
                value={scheduleMode}
                onChange={(_, v) => setScheduleMode(v as ScheduleMode)}
                sx={{ mt: 1 }}
              >
                <FormControlLabel value="single_day" control={<Radio />} label="One day" />
                <FormControlLabel value="range" control={<Radio />} label="Date range" />
              </RadioGroup>

              {scheduleMode === 'single_day' ? (
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    One calendar day — set start and end time (defaults to today if you open “New event” from the
                    header).
                  </Typography>
                  <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    value={dayDate}
                    onChange={(e) => setDayDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      label="Start time"
                      type="time"
                      fullWidth
                      value={dayStartTime}
                      onChange={(e) => setDayStartTime(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="End time"
                      type="time"
                      fullWidth
                      value={dayEndTime}
                      onChange={(e) => setDayEndTime(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Start and end can be on different days — each has its own date and time.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      label="Start date"
                      type="date"
                      fullWidth
                      value={rangeStartDate}
                      onChange={(e) => setRangeStartDate(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="Start time"
                      type="time"
                      fullWidth
                      value={rangeStartTime}
                      onChange={(e) => setRangeStartTime(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      label="End date"
                      type="date"
                      fullWidth
                      value={rangeEndDate}
                      onChange={(e) => setRangeEndDate(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="End time"
                      type="time"
                      fullWidth
                      value={rangeEndTime}
                      onChange={(e) => setRangeEndTime(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Stack>
                </Stack>
              )}
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Color
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {EVENT_COLOR_OPTIONS.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={c}
                    sx={{
                      minWidth: 0,
                      width: 32,
                      height: 32,
                      p: 0,
                      borderRadius: '50%',
                      bgcolor: eventDotColor(c),
                      border: color === c ? 3 : 0,
                      borderColor: 'primary.main',
                      boxSizing: 'content-box',
                    }}
                  />
                ))}
              </Stack>
            </Box>

            <TextField
              label="Location"
              fullWidth
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <FormControlLabel
              control={<Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
              label="Show on my public profile"
            />

            {initial ? (
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover', p: 1.5 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  ATTACHMENTS
                </Typography>
                {attachmentsQuery.isLoading ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading…
                  </Typography>
                ) : attachmentsQuery.isError ? (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Could not load attachments.
                  </Typography>
                ) : attachmentsQuery.data?.length ? (
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {attachmentsQuery.data.map((a) => (
                      <Stack
                        key={a.id}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={1}
                      >
                        <Link href={a.signed_url ?? '#'} target="_blank" rel="noreferrer" variant="body2" noWrap>
                          {a.file_name}
                        </Link>
                        <Button
                          type="button"
                          size="small"
                          color="error"
                          onClick={() => deleteAttMut.mutate({ attachmentId: a.id, eventId: initial.id })}
                        >
                          Remove
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No files yet.
                  </Typography>
                )}
              </Box>
            ) : null}

            <Button variant="outlined" component="label">
              Add attachments
              <input
                type="file"
                hidden
                multiple
                accept="image/*,.pdf,application/pdf"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
            </Button>
            {files.length > 0 ? (
              <Typography variant="caption" color="text.secondary">
                {files.length} file(s) selected
              </Typography>
            ) : null}

            {error ? (
              <Typography color="error" role="alert">
                {error}
              </Typography>
            ) : null}

            {confirmDelete && initial ? (
              <>
                <Divider />
                <Typography variant="body2">Delete this event permanently?</Typography>
                <Stack direction="row" spacing={1}>
                  <Button type="button" variant="contained" color="error" disabled={loading} onClick={onDelete}>
                    Confirm delete
                  </Button>
                  <Button type="button" variant="outlined" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </Stack>
              </>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, py: 2 }}>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          {initial && !confirmDelete ? (
            <Button type="button" color="error" sx={{ ml: 'auto' }} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          ) : null}
        </DialogActions>
      </form>
    </Dialog>
  )
}
