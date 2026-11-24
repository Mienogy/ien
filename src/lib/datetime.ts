/** Date helpers for reminders — shared by the dialog, chip, and list. */

/** "Overdue · Nov 24, 3:00 PM" / "Today, 5:00 PM" / "Tomorrow, 9:00 AM" / "Nov 28, 9:00 AM" */
export function formatDue(iso: string): string {
  const due = new Date(iso)
  const now = new Date()
  const time = due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const datePart = due.toLocaleDateString([], { month: 'short', day: 'numeric' })

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const dayDiff = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86_400_000)

  if (due.getTime() < now.getTime()) return `Overdue · ${datePart}, ${time}`
  if (dayDiff === 0) return `Today, ${time}`
  if (dayDiff === 1) return `Tomorrow, ${time}`
  return `${datePart}, ${time}`
}

/** True when the due date is in the past. */
export function isOverdue(iso: string): boolean {
  return new Date(iso).getTime() < Date.now()
}

/** Default slot for a new reminder: tomorrow at 09:00, local time. */
export function defaultDueValue(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return toLocalInputValue(d)
}

/** Format a Date for <input type="datetime-local"> (local time, no Z). */
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}
