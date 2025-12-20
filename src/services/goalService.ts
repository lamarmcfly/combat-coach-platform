import { prisma } from '@/db/client';
import {
  GoalType,
  GoalStatus,
  MilestoneStatus,
  RecommendationType,
} from '@prisma/client';

export class GoalService {
  /**
   * Create a new goal
   */
  static async createGoal(params: {
    userId: string;
    type: GoalType;
    title: string;
    description?: string;
    targetDate?: Date;
    targetValue?: number;
    unit?: string;
    disciplineId?: number;
    courseId?: string;
    tags?: string[];
    milestones?: Array<{
      title: string;
      description?: string;
      targetDate?: Date;
      orderIndex: number;
    }>;
  }) {
    const { milestones, ...goalData } = params;

    const goal = await prisma.goal.create({
      data: {
        ...goalData,
        tags: params.tags || [],
        milestones: milestones
          ? {
              create: milestones,
            }
          : undefined,
      },
      include: {
        discipline: true,
        course: true,
        milestones: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    // Generate initial recommendations
    await this.generateRecommendations(goal.id);

    return goal;
  }

  /**
   * Update goal details
   */
  static async updateGoal(
    goalId: string,
    data: {
      title?: string;
      description?: string;
      status?: GoalStatus;
      targetDate?: Date;
      targetValue?: number;
      currentValue?: number;
      progressPercent?: number;
      tags?: string[];
      notes?: string;
    }
  ) {
    const updateData: any = { ...data };

    // Auto-set timestamps based on status changes
    if (data.status === 'IN_PROGRESS' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    } else if (data.status === 'COMPLETED' && !updateData.completedAt) {
      updateData.completedAt = new Date();
      updateData.progressPercent = 100;
    }

    // Auto-calculate progress if currentValue and targetValue exist
    if (data.currentValue !== undefined || data.targetValue !== undefined) {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        select: { targetValue: true, currentValue: true },
      });

      const newCurrent = data.currentValue ?? goal?.currentValue ?? 0;
      const newTarget = data.targetValue ?? goal?.targetValue ?? 0;

      if (newTarget > 0) {
        updateData.progressPercent = Math.min(
          100,
          Math.round((newCurrent / newTarget) * 100)
        );
        updateData.currentValue = newCurrent;
      }
    }

    return prisma.goal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        discipline: true,
        course: true,
        milestones: {
          orderBy: { orderIndex: 'asc' },
        },
        progressLogs: {
          orderBy: { logDate: 'desc' },
          take: 5,
        },
      },
    });
  }

  /**
   * Add a progress log entry
   */
  static async logProgress(params: {
    goalId: string;
    value?: number;
    notes?: string;
    mood?: number;
    difficulty?: number;
    attachments?: any;
  }) {
    const log = await prisma.goalProgressLog.create({
      data: params,
    });

    // Update goal's current value if provided
    if (params.value !== undefined) {
      const goal = await prisma.goal.findUnique({
        where: { id: params.goalId },
        select: { targetValue: true },
      });

      await this.updateGoal(params.goalId, {
        currentValue: params.value,
        targetValue: goal?.targetValue ?? undefined,
      });
    }

    return log;
  }

  /**
   * Create or update a milestone
   */
  static async createMilestone(params: {
    goalId: string;
    title: string;
    description?: string;
    orderIndex: number;
    targetDate?: Date;
  }) {
    return prisma.goalMilestone.create({
      data: params,
    });
  }

  /**
   * Update milestone status
   */
  static async updateMilestone(
    milestoneId: string,
    data: {
      title?: string;
      description?: string;
      status?: MilestoneStatus;
      targetDate?: Date;
      notes?: string;
    }
  ) {
    const updateData: any = { ...data };

    if (data.status === 'COMPLETED' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const milestone = await prisma.goalMilestone.update({
      where: { id: milestoneId },
      data: updateData,
      include: {
        goal: true,
      },
    });

    // Recalculate goal progress based on completed milestones
    await this.recalculateGoalProgress(milestone.goalId);

    return milestone;
  }

  /**
   * Recalculate goal progress based on milestones
   */
  static async recalculateGoalProgress(goalId: string) {
    const milestones = await prisma.goalMilestone.findMany({
      where: { goalId },
    });

    if (milestones.length === 0) return;

    const completedCount = milestones.filter(
      (m) => m.status === 'COMPLETED'
    ).length;
    const progressPercent = Math.round(
      (completedCount / milestones.length) * 100
    );

    await prisma.goal.update({
      where: { id: goalId },
      data: { progressPercent },
    });
  }

  /**
   * Get user's goals with filtering
   */
  static async getUserGoals(
    userId: string,
    filters?: {
      status?: GoalStatus;
      type?: GoalType;
      disciplineId?: number;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.disciplineId) {
      where.disciplineId = filters.disciplineId;
    }

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        include: {
          discipline: {
            select: { name: true, slug: true },
          },
          course: {
            select: { title: true, slug: true },
          },
          _count: {
            select: {
              milestones: true,
              progressLogs: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { targetDate: 'asc' }, { createdAt: 'desc' }],
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.goal.count({ where }),
    ]);

    return { goals, total };
  }

  /**
   * Get detailed goal with all related data
   */
  static async getGoalDetails(goalId: string) {
    return prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        discipline: true,
        course: true,
        milestones: {
          orderBy: { orderIndex: 'asc' },
        },
        progressLogs: {
          orderBy: { logDate: 'desc' },
          take: 20,
        },
        recommendations: {
          where: {
            isActive: true,
            isDismissed: false,
          },
          orderBy: { priority: 'desc' },
        },
      },
    });
  }

  /**
   * Generate personalized recommendations for a goal
   */
  static async generateRecommendations(goalId: string) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        discipline: true,
        course: true,
        user: {
          include: {
            coursePurchases: true,
            trainingSchedules: true,
          },
        },
      },
    });

    if (!goal) return;

    const recommendations: Array<{
      userId: string;
      goalId: string;
      type: RecommendationType;
      title: string;
      description: string;
      reason?: string;
      priority: number;
      courseId?: string;
    }> = [];

    // Recommend course if goal has one and user hasn't purchased it
    if (goal.courseId && !goal.user.coursePurchases.some((p) => p.courseId === goal.courseId)) {
      recommendations.push({
        userId: goal.userId,
        goalId: goal.id,
        type: 'COURSE',
        title: `Complete ${goal.course?.title}`,
        description: `This course will help you achieve your "${goal.title}" goal`,
        reason: 'Direct path to your goal',
        priority: 90,
        courseId: goal.courseId,
      });
    }

    // Recommend training schedule if none exists
    if (goal.user.trainingSchedules.length === 0) {
      recommendations.push({
        userId: goal.userId,
        goalId: goal.id,
        type: 'TRAINING_SCHEDULE',
        title: 'Create a Training Schedule',
        description: 'Consistent training is key to achieving your goals',
        reason: 'Build a structured routine',
        priority: 85,
      });
    }

    // Type-specific recommendations
    switch (goal.type) {
      case 'COMPETITION_PREP':
        recommendations.push({
          userId: goal.userId,
          goalId: goal.id,
          type: 'COACH_CONSULTATION',
          title: 'Schedule Coach Consultation',
          description: 'Get personalized competition prep advice',
          reason: 'Expert guidance for competition',
          priority: 95,
        });
        break;

      case 'TECHNIQUE_MASTERY':
        recommendations.push({
          userId: goal.userId,
          goalId: goal.id,
          type: 'TECHNIQUE_FOCUS',
          title: 'Focus on Technique Drills',
          description: 'Dedicate sessions to repetition and refinement',
          reason: 'Master fundamentals first',
          priority: 80,
        });
        break;

      case 'FITNESS_IMPROVEMENT':
        recommendations.push({
          userId: goal.userId,
          goalId: goal.id,
          type: 'TRAINING_SCHEDULE',
          title: 'Increase Training Frequency',
          description: 'Add 2 more sessions per week',
          reason: 'Progressive overload for fitness',
          priority: 75,
        });
        break;
    }

    // Create recommendations in database
    await prisma.recommendation.createMany({
      data: recommendations,
      skipDuplicates: true,
    });

    return recommendations;
  }

  /**
   * Get active recommendations for user
   */
  static async getRecommendations(
    userId: string,
    filters?: {
      goalId?: string;
      type?: RecommendationType;
      limit?: number;
    }
  ) {
    const where: any = {
      userId,
      isActive: true,
      isDismissed: false,
      isCompleted: false,
    };

    if (filters?.goalId) {
      where.goalId = filters.goalId;
    }
    if (filters?.type) {
      where.type = filters.type;
    }

    return prisma.recommendation.findMany({
      where,
      include: {
        goal: {
          select: {
            title: true,
            type: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: filters?.limit || 10,
    });
  }

  /**
   * Dismiss a recommendation
   */
  static async dismissRecommendation(recommendationId: string) {
    return prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        isDismissed: true,
        dismissedAt: new Date(),
      },
    });
  }

  /**
   * Mark recommendation as completed
   */
  static async completeRecommendation(recommendationId: string) {
    return prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Get goal statistics and insights
   */
  static async getGoalStats(userId: string) {
    const [totalGoals, activeGoals, completedGoals, goals] = await Promise.all([
      prisma.goal.count({ where: { userId } }),
      prisma.goal.count({ where: { userId, status: 'IN_PROGRESS' } }),
      prisma.goal.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.goal.findMany({
        where: { userId, status: 'IN_PROGRESS' },
        select: { progressPercent: true },
      }),
    ]);

    const averageProgress =
      goals.length > 0
        ? Math.round(
            goals.reduce((sum, g) => sum + g.progressPercent, 0) / goals.length
          )
        : 0;

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      averageProgress,
      completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
    };
  }
}
