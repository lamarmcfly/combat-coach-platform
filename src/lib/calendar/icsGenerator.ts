/**
 * ICS Calendar File Generator
 * Generates .ics files for training schedules
 */

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  uid: string;
  reminder?: number; // minutes before
}

/**
 * Format date to ICS format: YYYYMMDDTHHMMSSZ
 */
function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Escape special characters in ICS text fields
 */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Fold long lines per ICS spec (max 75 chars per line)
 */
function foldLine(line: string): string {
  const maxLength = 75;
  if (line.length <= maxLength) return line;

  const result: string[] = [];
  let remaining = line;

  while (remaining.length > maxLength) {
    result.push(remaining.slice(0, maxLength));
    remaining = ' ' + remaining.slice(maxLength);
  }
  result.push(remaining);

  return result.join('\r\n');
}

/**
 * Generate a single VEVENT block
 */
function generateEvent(event: CalendarEvent): string {
  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${formatDateToICS(new Date())}`,
    `DTSTART:${formatDateToICS(event.startDate)}`,
    `DTEND:${formatDateToICS(event.endDate)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }

  if (event.reminder) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(event.title)} reminder`,
      `TRIGGER:-PT${event.reminder}M`,
      'END:VALARM'
    );
  }

  lines.push('END:VEVENT');

  return lines.map(foldLine).join('\r\n');
}

/**
 * Generate a complete ICS calendar file
 */
export function generateICS(events: CalendarEvent[], calendarName: string = 'Training Schedule'): string {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Combat Coach Platform//Training Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    'X-WR-TIMEZONE:UTC',
  ].join('\r\n');

  const footer = 'END:VCALENDAR';

  const eventBlocks = events.map(generateEvent).join('\r\n');

  return `${header}\r\n${eventBlocks}\r\n${footer}`;
}

/**
 * Create a download link for an ICS file
 */
export function downloadICS(content: string, filename: string = 'training-schedule.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Helper to generate UID for calendar events
 */
export function generateEventUID(scheduleId: string, date: Date): string {
  const timestamp = date.getTime();
  return `${scheduleId}-${timestamp}@combatcoach.app`;
}

/**
 * Convert training schedule to calendar events
 */
export interface TrainingScheduleInput {
  id: string;
  title: string;
  description?: string;
  daysOfWeek: number[]; // 0-6, Sunday = 0
  timeOfDay: string; // HH:MM format
  durationMinutes: number;
  startDate: Date;
  endDate?: Date;
  reminderMinutes?: number;
  courseName?: string;
  disciplineName?: string;
}

export function scheduleToEvents(
  schedule: TrainingScheduleInput,
  weeksAhead: number = 4
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();
  const startFrom = schedule.startDate > now ? schedule.startDate : now;
  const endDate = schedule.endDate || new Date(now.getTime() + weeksAhead * 7 * 24 * 60 * 60 * 1000);

  // Parse time
  const [hours, minutes] = schedule.timeOfDay.split(':').map(Number);

  // Generate events for each matching day
  const current = new Date(startFrom);
  current.setHours(hours, minutes, 0, 0);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();

    if (schedule.daysOfWeek.includes(dayOfWeek)) {
      const eventStart = new Date(current);
      const eventEnd = new Date(current.getTime() + schedule.durationMinutes * 60 * 1000);

      let description = schedule.description || '';
      if (schedule.courseName) {
        description = `Course: ${schedule.courseName}\n${description}`;
      }
      if (schedule.disciplineName) {
        description = `${schedule.disciplineName}\n${description}`;
      }

      events.push({
        uid: generateEventUID(schedule.id, eventStart),
        title: schedule.title,
        description: description.trim() || undefined,
        startDate: eventStart,
        endDate: eventEnd,
        reminder: schedule.reminderMinutes,
      });
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  return events;
}

/**
 * Generate ICS for multiple training schedules
 */
export function generateScheduleICS(
  schedules: TrainingScheduleInput[],
  weeksAhead: number = 4
): string {
  const allEvents: CalendarEvent[] = [];

  for (const schedule of schedules) {
    const events = scheduleToEvents(schedule, weeksAhead);
    allEvents.push(...events);
  }

  // Sort by start date
  allEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return generateICS(allEvents, 'Combat Coach Training Schedule');
}
