import { prisma } from '@/db/client';
import {
  CoachingRequestStatus,
  CoachingRequestType,
  CoachingPriority,
  AttachmentType
} from '@prisma/client';

export class CoachingService {
  /**
   * Create a new coaching request
   */
  static async createRequest(params: {
    userId: string;
    coachId: string;
    title: string;
    description: string;
    type: CoachingRequestType;
    priority?: CoachingPriority;
    courseId?: string;
    lessonId?: string;
    tags?: string[];
    attachments?: {
      url: string;
      filename: string;
      type: AttachmentType;
      fileSize: number;
      mimeType?: string;
      duration?: number;
    }[];
  }) {
    const { attachments, ...requestData } = params;

    const request = await prisma.coachingRequest.create({
      data: {
        ...requestData,
        priority: params.priority || 'NORMAL',
        tags: params.tags || [],
        attachments: attachments ? {
          create: attachments.map(att => ({
            ...att,
            uploaderId: params.userId,
          })),
        } : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        coach: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachments: true,
        messages: {
          include: {
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return request;
  }

  /**
   * Add a message to a coaching request
   */
  static async addMessage(params: {
    requestId: string;
    senderId: string;
    content: string;
    isCoachResponse: boolean;
    attachments?: {
      url: string;
      filename: string;
      type: AttachmentType;
      fileSize: number;
      mimeType?: string;
      duration?: number;
    }[];
  }) {
    const { attachments, ...messageData } = params;

    const message = await prisma.coachingMessage.create({
      data: {
        ...messageData,
        attachments: attachments ? {
          create: attachments.map(att => ({
            ...att,
            uploaderId: params.senderId,
          })),
        } : undefined,
      },
      include: {
        attachments: true,
      },
    });

    // Update request status based on who responded
    const updateData: any = { updatedAt: new Date() };

    if (params.isCoachResponse) {
      updateData.status = 'RESPONDED';
      updateData.reviewedAt = new Date();
    }

    await prisma.coachingRequest.update({
      where: { id: params.requestId },
      data: updateData,
    });

    return message;
  }

  /**
   * Update coaching request status
   */
  static async updateRequestStatus(
    requestId: string,
    status: CoachingRequestStatus
  ) {
    const updateData: any = { status };

    if (status === 'IN_REVIEW') {
      updateData.reviewedAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    return prisma.coachingRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        coach: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get coaching requests for a student
   */
  static async getStudentRequests(
    userId: string,
    filters?: {
      status?: CoachingRequestStatus;
      type?: CoachingRequestType;
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

    const [requests, total] = await Promise.all([
      prisma.coachingRequest.findMany({
        where,
        include: {
          coach: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: true,
              attachments: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.coachingRequest.count({ where }),
    ]);

    return { requests, total };
  }

  /**
   * Get coaching requests for a coach
   */
  static async getCoachRequests(
    coachId: string,
    filters?: {
      status?: CoachingRequestStatus;
      priority?: CoachingPriority;
      type?: CoachingRequestType;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = { coachId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.type) {
      where.type = filters.type;
    }

    const [requests, total] = await Promise.all([
      prisma.coachingRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: true,
              attachments: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { submittedAt: 'desc' },
        ],
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.coachingRequest.count({ where }),
    ]);

    return { requests, total };
  }

  /**
   * Get detailed coaching request with all messages and attachments
   */
  static async getRequestDetails(requestId: string) {
    const request = await prisma.coachingRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        coach: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            tagline: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        attachments: true,
        messages: {
          include: {
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return request;
  }

  /**
   * Get coaching statistics for a coach
   */
  static async getCoachStats(coachId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      totalRequests,
      pendingRequests,
      completedRequests,
      averageResponseTime,
    ] = await Promise.all([
      prisma.coachingRequest.count({
        where: { coachId, submittedAt: { gte: since } },
      }),
      prisma.coachingRequest.count({
        where: { coachId, status: 'PENDING' },
      }),
      prisma.coachingRequest.count({
        where: { coachId, status: 'COMPLETED', completedAt: { gte: since } },
      }),
      // Calculate average response time
      prisma.coachingRequest.findMany({
        where: {
          coachId,
          reviewedAt: { not: null },
          submittedAt: { gte: since },
        },
        select: {
          submittedAt: true,
          reviewedAt: true,
        },
      }).then((requests) => {
        if (requests.length === 0) return null;
        const totalMinutes = requests.reduce((sum, req) => {
          const diff = req.reviewedAt!.getTime() - req.submittedAt.getTime();
          return sum + Math.floor(diff / 1000 / 60);
        }, 0);
        return Math.floor(totalMinutes / requests.length);
      }),
    ]);

    return {
      totalRequests,
      pendingRequests,
      completedRequests,
      averageResponseTimeMinutes: averageResponseTime,
    };
  }

  /**
   * Search coaching requests
   */
  static async searchRequests(params: {
    query: string;
    userId?: string;
    coachId?: string;
    limit?: number;
  }) {
    const where: any = {
      OR: [
        { title: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
        { tags: { has: params.query.toLowerCase() } },
      ],
    };

    if (params.userId) {
      where.userId = params.userId;
    }
    if (params.coachId) {
      where.coachId = params.coachId;
    }

    const requests = await prisma.coachingRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        coach: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: params.limit || 20,
    });

    return requests;
  }
}
