import { prisma } from '@/db/client';
import {
  ScheduleFrequency,
  ScheduleStatus,
  ReminderType,
  type TrainingSchedule,
  type ScheduleOccurrence,
} from '@prisma/client';

export class ScheduleService {
  /**
   * Create a new training schedule with automatic occurrence generation
   */
  static async createSchedule(params: {
    userId: string;
    title: string;
    description?: string;
    frequency: ScheduleFrequency;
    startDate: Date;
    endDate?: Date;
    daysOfWeek: number[];
    timeOfDay: string;
    durationMinutes: number;
    reminderMinutes?: number;
    courseId?: string;
    disciplineId?: number;
    notes?: string;
  }): Promise<TrainingSchedule> {
    const schedule = await prisma.trainingSchedule.create({
      data: {
        userId: params.userId,
        title: params.title,
        description: params.description,
        frequency: params.frequency,
        startDate: params.startDate,
        endDate: params.endDate,
        daysOfWeek: params.daysOfWeek,
        timeOfDay: params.timeOfDay,
        durationMinutes: params.durationMinutes,
        reminderMinutes: params.reminderMinutes ?? 30,
        courseId: params.courseId,
        disciplineId: params.disciplineId,
        notes: params.notes,
      },
    });

    // Generate occurrences for the next 30 days
    await this.generateOccurrences(schedule.id, schedule, 30);

    // Schedule reminders
    await this.scheduleReminders(schedule.id);

    return schedule;
  }

  /**
   * Generate schedule occurrences based on frequency and days of week
   */
  static async generateOccurrences(
    scheduleId: string,
    schedule: TrainingSchedule,
    daysAhead: number = 30
  ): Promise<void> {
    const occurrences: Date[] = [];
    const startDate = new Date(schedule.startDate);
    const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + daysAhead);

    const [hours, minutes] = schedule.timeOfDay.split(':').map(Number);

    let currentDate = new Date(startDate);
    currentDate.setHours(hours, minutes, 0, 0);

    while (currentDate <= maxDate && (!endDate || currentDate <= endDate)) {
      // Check if this day of week matches
      if (schedule.daysOfWeek.includes(currentDate.getDay())) {
        occurrences.push(new Date(currentDate));
      }

      // Increment based on frequency
      switch (schedule.frequency) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'BIWEEKLY':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'ONCE':
          break; // Only one occurrence
        default:
          currentDate.setDate(currentDate.getDate() + 1);
      }

      if (schedule.frequency === 'ONCE') break;
    }

    // Batch create occurrences
    if (occurrences.length > 0) {
      await prisma.scheduleOccurrence.createMany({
        data: occurrences.map((date) => ({
          scheduleId,
          scheduledFor: date,
          status: 'ACTIVE' as ScheduleStatus,
        })),
        skipDuplicates: true,
      });
    }
  }

  /**
   * Schedule reminders for upcoming occurrences
   */
  static async scheduleReminders(scheduleId: string): Promise<void> {
    const schedule = await prisma.trainingSchedule.findUnique({
      where: { id: scheduleId },
      include: { occurrences: { where: { status: 'ACTIVE' } } },
    });

    if (!schedule) return;

    const reminders = schedule.occurrences.map((occurrence) => {
      const reminderTime = new Date(occurrence.scheduledFor);
      reminderTime.setMinutes(reminderTime.getMinutes() - schedule.reminderMinutes);

      return {
        scheduleId,
        type: 'PUSH' as ReminderType,
        sendAt: reminderTime,
      };
    });

    if (reminders.length > 0) {
      await prisma.scheduleReminder.createMany({
        data: reminders,
        skipDuplicates: true,
      });
    }
  }

  /**
   * Mark an occurrence as completed
   */
  static async completeOccurrence(
    occurrenceId: string,
    durationActual?: number,
    notes?: string
  ): Promise<ScheduleOccurrence> {
    const occurrence = await prisma.scheduleOccurrence.update({
      where: { id: occurrenceId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        durationActual,
        notes,
      },
      include: { schedule: true },
    });

    // Update adherence stats
    await this.updateAdherenceStats(occurrence.schedule.userId);

    return occurrence;
  }

  /**
   * Skip an occurrence
   */
  static async skipOccurrence(occurrenceId: string): Promise<ScheduleOccurrence> {
    const occurrence = await prisma.scheduleOccurrence.update({
      where: { id: occurrenceId },
      data: { status: 'SKIPPED' },
      include: { schedule: true },
    });

    // Update adherence stats
    await this.updateAdherenceStats(occurrence.schedule.userId);

    return occurrence;
  }

  /**
   * Update weekly adherence statistics
   */
  static async updateAdherenceStats(userId: string): Promise<void> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get all occurrences for this week
    const occurrences = await prisma.scheduleOccurrence.findMany({
      where: {
        schedule: { userId },
        scheduledFor: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    const scheduledSessions = occurrences.length;
    const completedSessions = occurrences.filter((o) => o.status === 'COMPLETED').length;
    const skippedSessions = occurrences.filter((o) => o.status === 'SKIPPED').length;
    const adherenceRate =
      scheduledSessions > 0 ? (completedSessions / scheduledSessions) * 100 : 0;

    const totalMinutesTrained = occurrences
      .filter((o) => o.status === 'COMPLETED' && o.durationActual)
      .reduce((sum, o) => sum + (o.durationActual || 0), 0);

    // Calculate streak (consecutive weeks with >80% adherence)
    const previousWeeks = await prisma.adherenceStats.findMany({
      where: { userId, weekStart: { lt: weekStart } },
      orderBy: { weekStart: 'desc' },
      take: 10,
    });

    let streak = adherenceRate >= 80 ? 1 : 0;
    for (const week of previousWeeks) {
      if (week.adherenceRate >= 80) {
        streak++;
      } else {
        break;
      }
    }

    // Upsert adherence stats
    await prisma.adherenceStats.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
      create: {
        userId,
        weekStart,
        weekEnd,
        scheduledSessions,
        completedSessions,
        skippedSessions,
        adherenceRate,
        totalMinutesTrained,
        streak,
      },
      update: {
        scheduledSessions,
        completedSessions,
        skippedSessions,
        adherenceRate,
        totalMinutesTrained,
        streak,
      },
    });
  }

  /**
   * Get upcoming occurrences for a user
   */
  static async getUpcomingOccurrences(
    userId: string,
    limit: number = 10
  ): Promise<ScheduleOccurrence[]> {
    return prisma.scheduleOccurrence.findMany({
      where: {
        schedule: { userId, isActive: true },
        scheduledFor: { gte: new Date() },
        status: 'ACTIVE',
      },
      include: {
        schedule: {
          include: {
            course: true,
            discipline: true,
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
      take: limit,
    });
  }

  /**
   * Get adherence statistics for a user
   */
  static async getAdherenceStats(userId: string, weeks: number = 12) {
    const stats = await prisma.adherenceStats.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      take: weeks,
    });

    const currentStreak =
      stats.length > 0 && stats[0].adherenceRate >= 80 ? stats[0].streak : 0;
    const averageAdherence =
      stats.length > 0
        ? stats.reduce((sum, s) => sum + s.adherenceRate, 0) / stats.length
        : 0;
    const totalMinutesTrained = stats.reduce((sum, s) => sum + s.totalMinutesTrained, 0);

    return {
      stats,
      summary: {
        currentStreak,
        averageAdherence: Math.round(averageAdherence),
        totalMinutesTrained,
        totalSessions: stats.reduce((sum, s) => sum + s.completedSessions, 0),
      },
    };
  }
}
