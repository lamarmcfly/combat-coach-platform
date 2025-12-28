import { prisma } from '@/db/client';
import { ContentType, ContentStatus, Prisma } from '@prisma/client';

export class ContentService {
  // ============================================
  // Content Sections
  // ============================================

  static async createSection(params: {
    slug: string;
    name: string;
    description?: string;
    page: string;
    orderIndex?: number;
  }) {
    return prisma.contentSection.create({
      data: {
        slug: params.slug,
        name: params.name,
        description: params.description,
        page: params.page,
        orderIndex: params.orderIndex ?? 0,
      },
      include: {
        contents: true,
      },
    });
  }

  static async getSections(page?: string) {
    return prisma.contentSection.findMany({
      where: page ? { page, isActive: true } : { isActive: true },
      include: {
        contents: {
          where: { status: 'PUBLISHED' },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  static async getSectionBySlug(slug: string) {
    return prisma.contentSection.findUnique({
      where: { slug },
      include: {
        contents: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  static async updateSection(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      page: string;
      orderIndex: number;
      isActive: boolean;
    }>
  ) {
    return prisma.contentSection.update({
      where: { id },
      data,
      include: {
        contents: true,
      },
    });
  }

  static async deleteSection(id: string) {
    return prisma.contentSection.delete({
      where: { id },
    });
  }

  // ============================================
  // Site Content
  // ============================================

  static async createContent(params: {
    sectionId: string;
    key: string;
    type: ContentType;
    label?: string;
    helpText?: string;
    placeholder?: string;
    isRequired?: boolean;
    orderIndex?: number;
    textValue?: string;
    richText?: string;
    mediaUrl?: string;
    mediaAlt?: string;
    linkUrl?: string;
    linkText?: string;
    jsonValue?: Prisma.InputJsonValue;
  }) {
    return prisma.siteContent.create({
      data: {
        sectionId: params.sectionId,
        key: params.key,
        type: params.type,
        label: params.label,
        helpText: params.helpText,
        placeholder: params.placeholder,
        isRequired: params.isRequired ?? false,
        orderIndex: params.orderIndex ?? 0,
        textValue: params.textValue,
        richText: params.richText,
        mediaUrl: params.mediaUrl,
        mediaAlt: params.mediaAlt,
        linkUrl: params.linkUrl,
        linkText: params.linkText,
        jsonValue: params.jsonValue,
        status: 'DRAFT',
      },
    });
  }

  static async getContent(sectionSlug: string, key: string) {
    const section = await prisma.contentSection.findUnique({
      where: { slug: sectionSlug },
    });

    if (!section) return null;

    return prisma.siteContent.findUnique({
      where: {
        sectionId_key: {
          sectionId: section.id,
          key,
        },
      },
      include: {
        media: true,
      },
    });
  }

  static async getContentById(id: string) {
    return prisma.siteContent.findUnique({
      where: { id },
      include: {
        section: true,
        media: true,
        history: {
          orderBy: { version: 'desc' },
          take: 10,
        },
      },
    });
  }

  static async getAllContent(filters?: {
    page?: string;
    sectionId?: string;
    status?: ContentStatus;
    type?: ContentType;
  }) {
    const where: Prisma.SiteContentWhereInput = {};

    if (filters?.sectionId) {
      where.sectionId = filters.sectionId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.page) {
      where.section = { page: filters.page };
    }

    return prisma.siteContent.findMany({
      where,
      include: {
        section: true,
        media: true,
      },
      orderBy: [{ section: { page: 'asc' } }, { orderIndex: 'asc' }],
    });
  }

  static async updateContent(
    id: string,
    data: Partial<{
      textValue: string;
      richText: string;
      mediaUrl: string;
      mediaAlt: string;
      linkUrl: string;
      linkText: string;
      jsonValue: Prisma.InputJsonValue;
      label: string;
      helpText: string;
      placeholder: string;
      isRequired: boolean;
      orderIndex: number;
    }>,
    adminId: string,
    changeNote?: string
  ) {
    // Get current content for history
    const current = await prisma.siteContent.findUnique({
      where: { id },
    });

    if (!current) {
      throw new Error('Content not found');
    }

    // Create history entry
    await prisma.contentHistory.create({
      data: {
        contentId: id,
        version: current.version,
        textValue: current.textValue,
        richText: current.richText,
        mediaUrl: current.mediaUrl,
        jsonValue: current.jsonValue ?? undefined,
        changedBy: adminId,
        changeNote,
      },
    });

    // Update content with new version
    return prisma.siteContent.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
      include: {
        section: true,
        media: true,
      },
    });
  }

  static async publishContent(id: string, adminId: string) {
    return prisma.siteContent.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy: adminId,
      },
    });
  }

  static async unpublishContent(id: string) {
    return prisma.siteContent.update({
      where: { id },
      data: {
        status: 'DRAFT',
        publishedAt: null,
        publishedBy: null,
      },
    });
  }

  static async archiveContent(id: string) {
    return prisma.siteContent.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });
  }

  static async deleteContent(id: string) {
    return prisma.siteContent.delete({
      where: { id },
    });
  }

  // Rollback to previous version
  static async rollbackContent(contentId: string, version: number, adminId: string) {
    const historyEntry = await prisma.contentHistory.findFirst({
      where: {
        contentId,
        version,
      },
    });

    if (!historyEntry) {
      throw new Error('Version not found');
    }

    return this.updateContent(
      contentId,
      {
        textValue: historyEntry.textValue ?? undefined,
        richText: historyEntry.richText ?? undefined,
        mediaUrl: historyEntry.mediaUrl ?? undefined,
        jsonValue: historyEntry.jsonValue ?? undefined,
      },
      adminId,
      `Rolled back to version ${version}`
    );
  }

  // ============================================
  // Media Assets
  // ============================================

  static async uploadMedia(params: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
    alt?: string;
    caption?: string;
    tags?: string[];
    folder?: string;
    uploadedBy: string;
    contentId?: string;
  }) {
    return prisma.mediaAsset.create({
      data: {
        filename: params.filename,
        originalName: params.originalName,
        mimeType: params.mimeType,
        size: params.size,
        url: params.url,
        thumbnailUrl: params.thumbnailUrl,
        width: params.width,
        height: params.height,
        duration: params.duration,
        alt: params.alt,
        caption: params.caption,
        tags: params.tags ?? [],
        folder: params.folder ?? 'general',
        uploadedBy: params.uploadedBy,
        contentId: params.contentId,
      },
    });
  }

  static async getMediaAssets(filters?: {
    folder?: string;
    mimeType?: string;
    uploadedBy?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.MediaAssetWhereInput = {};

    if (filters?.folder) {
      where.folder = filters.folder;
    }
    if (filters?.mimeType) {
      where.mimeType = { startsWith: filters.mimeType };
    }
    if (filters?.uploadedBy) {
      where.uploadedBy = filters.uploadedBy;
    }
    if (filters?.search) {
      where.OR = [
        { filename: { contains: filters.search, mode: 'insensitive' } },
        { originalName: { contains: filters.search, mode: 'insensitive' } },
        { alt: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit ?? 50,
        skip: filters?.offset ?? 0,
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    return { assets, total };
  }

  static async getMediaById(id: string) {
    return prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        content: true,
      },
    });
  }

  static async updateMedia(
    id: string,
    data: Partial<{
      alt: string;
      caption: string;
      tags: string[];
      folder: string;
      isPublic: boolean;
    }>
  ) {
    return prisma.mediaAsset.update({
      where: { id },
      data,
    });
  }

  static async deleteMedia(id: string) {
    return prisma.mediaAsset.delete({
      where: { id },
    });
  }

  // ============================================
  // Platform Settings
  // ============================================

  static async getSetting(key: string) {
    const setting = await prisma.platformSettings.findUnique({
      where: { key },
    });

    if (!setting) return null;

    // Parse value based on type
    switch (setting.type) {
      case 'number':
        return parseFloat(setting.value);
      case 'boolean':
        return setting.value === 'true';
      case 'json':
        return JSON.parse(setting.value);
      default:
        return setting.value;
    }
  }

  static async getSettings(category?: string, publicOnly = false) {
    const where: Prisma.PlatformSettingsWhereInput = {};

    if (category) {
      where.category = category;
    }
    if (publicOnly) {
      where.isPublic = true;
    }

    return prisma.platformSettings.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  static async setSetting(
    key: string,
    value: string | number | boolean | object,
    options?: {
      type?: string;
      category?: string;
      label?: string;
      description?: string;
      isPublic?: boolean;
      updatedBy?: string;
    }
  ) {
    // Determine type and stringify value
    let type = options?.type ?? 'string';
    let stringValue: string;

    if (typeof value === 'number') {
      type = 'number';
      stringValue = String(value);
    } else if (typeof value === 'boolean') {
      type = 'boolean';
      stringValue = String(value);
    } else if (typeof value === 'object') {
      type = 'json';
      stringValue = JSON.stringify(value);
    } else {
      stringValue = value;
    }

    return prisma.platformSettings.upsert({
      where: { key },
      update: {
        value: stringValue,
        type,
        category: options?.category,
        label: options?.label,
        description: options?.description,
        isPublic: options?.isPublic,
        updatedBy: options?.updatedBy,
      },
      create: {
        key,
        value: stringValue,
        type,
        category: options?.category ?? 'general',
        label: options?.label,
        description: options?.description,
        isPublic: options?.isPublic ?? false,
      },
    });
  }

  static async deleteSetting(key: string) {
    return prisma.platformSettings.delete({
      where: { key },
    });
  }

  // ============================================
  // Bulk Operations
  // ============================================

  // Get all content for a page (for frontend rendering)
  static async getPageContent(page: string) {
    const sections = await prisma.contentSection.findMany({
      where: {
        page,
        isActive: true,
      },
      include: {
        contents: {
          where: { status: 'PUBLISHED' },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    // Transform into a more usable format
    const content: Record<string, Record<string, unknown>> = {};

    for (const section of sections) {
      content[section.slug] = {};
      for (const item of section.contents) {
        // Return the appropriate value based on content type
        let value: unknown;
        switch (item.type) {
          case 'TEXT':
            value = item.textValue ?? item.placeholder;
            break;
          case 'RICH_TEXT':
          case 'HTML':
            value = item.richText ?? item.placeholder;
            break;
          case 'IMAGE':
          case 'VIDEO':
            value = {
              url: item.mediaUrl,
              alt: item.mediaAlt,
            };
            break;
          case 'LINK':
            value = {
              url: item.linkUrl,
              text: item.linkText,
            };
            break;
          case 'JSON':
            value = item.jsonValue;
            break;
          default:
            value = item.textValue;
        }
        content[section.slug][item.key] = value;
      }
    }

    return content;
  }

  // Seed default content for a page
  static async seedPageContent(
    page: string,
    sections: Array<{
      slug: string;
      name: string;
      description?: string;
      contents: Array<{
        key: string;
        type: ContentType;
        label: string;
        helpText?: string;
        placeholder?: string;
        textValue?: string;
        mediaUrl?: string;
        mediaAlt?: string;
      }>;
    }>
  ) {
    const results = [];

    for (let i = 0; i < sections.length; i++) {
      const sectionData = sections[i];

      // Create or update section
      const section = await prisma.contentSection.upsert({
        where: { slug: sectionData.slug },
        update: {
          name: sectionData.name,
          description: sectionData.description,
          page,
          orderIndex: i,
        },
        create: {
          slug: sectionData.slug,
          name: sectionData.name,
          description: sectionData.description,
          page,
          orderIndex: i,
        },
      });

      // Create contents
      for (let j = 0; j < sectionData.contents.length; j++) {
        const contentData = sectionData.contents[j];

        await prisma.siteContent.upsert({
          where: {
            sectionId_key: {
              sectionId: section.id,
              key: contentData.key,
            },
          },
          update: {
            type: contentData.type,
            label: contentData.label,
            helpText: contentData.helpText,
            placeholder: contentData.placeholder,
            orderIndex: j,
          },
          create: {
            sectionId: section.id,
            key: contentData.key,
            type: contentData.type,
            label: contentData.label,
            helpText: contentData.helpText,
            placeholder: contentData.placeholder,
            textValue: contentData.textValue,
            mediaUrl: contentData.mediaUrl,
            mediaAlt: contentData.mediaAlt,
            orderIndex: j,
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });
      }

      results.push(section);
    }

    return results;
  }
}
