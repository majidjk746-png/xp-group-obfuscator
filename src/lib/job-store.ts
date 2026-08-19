export interface JobData {
  id: string;
  userId: string;
  status: string;
  originalName: string;
  originalSize: number;
  protectionTier: string;
  preset: string;
  stringEncryption: boolean;
  fieldEncryption: boolean;
  controlFlow: boolean;
  nativeStub: boolean;
  antiDebug: boolean;
  antiDump: boolean;
  antiApiHooks: boolean;
  vmBytecode: boolean;
  selfRefKey: boolean;
  originalPath?: string | null;
  protectedPath?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  errorMessage?: string | null;
  processingMs?: number | null;
  protectedSize?: number | null;
  expiresAt?: Date | null;
  completedAt?: Date | null;
  createdAt?: Date;
  protectedBytes?: Uint8Array | null;
}

export interface JobStore {
  createJob(data: JobData): Promise<void>;
  getJob(id: string): Promise<JobData | null>;
  updateJob(id: string, data: Partial<JobData>): Promise<void>;
  deleteJob(id: string): Promise<void>;
  getJobFile(id: string): Promise<Uint8Array | null>;
  setJobFile(id: string, bytes: Uint8Array): Promise<void>;
  deleteJobFile(id: string): Promise<void>;
}

class MemoryJobStore implements JobStore {
  private jobs = new Map<string, JobData>();
  private files = new Map<string, Uint8Array>();

  async createJob(data: JobData): Promise<void> {
    this.jobs.set(data.id, { ...data, createdAt: new Date() });
  }

  async getJob(id: string): Promise<JobData | null> {
    return this.jobs.get(id) ?? null;
  }

  async updateJob(id: string, data: Partial<JobData>): Promise<void> {
    const job = this.jobs.get(id);
    if (job) {
      if (data.protectedBytes) {
        this.files.set(id + "_protected", data.protectedBytes);
      }
      const { protectedBytes, ...rest } = data;
      Object.assign(job, rest);
    }
  }

  async deleteJob(id: string): Promise<void> {
    this.jobs.delete(id);
    this.files.delete(id);
    this.files.delete(id + "_protected");
  }

  async getJobFile(id: string): Promise<Uint8Array | null> {
    return this.files.get(id) ?? null;
  }

  async setJobFile(id: string, bytes: Uint8Array): Promise<void> {
    this.files.set(id, bytes);
  }

  async deleteJobFile(id: string): Promise<void> {
    this.files.delete(id);
  }
}

let jobStore: JobStore | null = null;
let dbAvailable = true;

async function tryCreatePrismaStore(): Promise<JobStore | null> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { ensureMigration } = await import("@/lib/migration");
    await ensureMigration();
    await prisma.$queryRaw`SELECT 1`;
    return {
      async createJob(data) {
        await prisma.processedJob.create({
          data: {
            id: data.id,
            userId: data.userId,
            status: data.status as "UPLOADING" | "VALIDATING" | "QUEUED" | "PROTECTING" | "COMPLETED" | "FAILED",
            originalName: data.originalName,
            originalSize: data.originalSize,
            protectionTier: data.protectionTier as "BASIC" | "ADVANCED" | "ENTERPRISE",
            preset: data.preset,
            stringEncryption: data.stringEncryption,
            fieldEncryption: data.fieldEncryption,
            controlFlow: data.controlFlow,
            nativeStub: data.nativeStub,
            antiDebug: data.antiDebug,
            antiDump: data.antiDump,
            antiApiHooks: data.antiApiHooks,
            vmBytecode: data.vmBytecode,
            selfRefKey: data.selfRefKey,
            originalPath: data.originalPath ?? null,
            protectedPath: data.protectedPath ?? null,
            ipHash: data.ipHash ?? null,
            userAgent: data.userAgent ?? null,
            expiresAt: data.expiresAt ?? new Date(Date.now() + 10 * 60 * 1000),
          },
        });
      },
      async getJob(id) {
        const job = await prisma.processedJob.findUnique({ where: { id } });
        if (!job) return null;
        return {
          id: job.id,
          userId: job.userId,
          status: job.status,
          originalName: job.originalName,
          originalSize: job.originalSize,
          protectionTier: job.protectionTier,
          preset: job.preset,
          stringEncryption: job.stringEncryption,
          fieldEncryption: job.fieldEncryption,
          controlFlow: job.controlFlow,
          nativeStub: job.nativeStub,
          antiDebug: job.antiDebug,
          antiDump: job.antiDump,
          antiApiHooks: job.antiApiHooks,
          vmBytecode: job.vmBytecode,
          selfRefKey: job.selfRefKey,
          originalPath: job.originalPath,
          protectedPath: job.protectedPath,
          ipHash: job.ipHash,
          userAgent: job.userAgent,
          errorMessage: job.errorMessage,
          processingMs: job.processingMs,
          protectedSize: job.protectedSize,
          expiresAt: job.expiresAt,
          completedAt: job.completedAt,
          createdAt: job.createdAt,
        };
      },
      async updateJob(id, data) {
        const updateData: Record<string, unknown> = {};
        if (data.status !== undefined) updateData.status = data.status;
        if (data.errorMessage !== undefined) updateData.errorMessage = data.errorMessage;
        if (data.processingMs !== undefined) updateData.processingMs = data.processingMs;
        if (data.protectedSize !== undefined) updateData.protectedSize = data.protectedSize;
        if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
        if (data.protectedPath !== undefined) updateData.protectedPath = data.protectedPath;
        await prisma.processedJob.update({ where: { id }, data: updateData });
      },
      async deleteJob(id) {
        await prisma.processedJob.delete({ where: { id } }).catch(() => {});
      },
      async getJobFile() {
        return null;
      },
      async setJobFile() {},
      async deleteJobFile() {},
    };
  } catch (err) {
    console.warn("[job-store] PostgreSQL unavailable, using in-memory store:", (err as Error).message?.slice(0, 120));
    return null;
  }
}

export async function getJobStore(): Promise<JobStore> {
  if (jobStore) return jobStore;

  if (dbAvailable) {
    const prismaStore = await tryCreatePrismaStore();
    if (prismaStore) {
      jobStore = prismaStore;
      console.log("[job-store] Using PostgreSQL via Prisma");
      return jobStore;
    }
    dbAvailable = false;
  }

  jobStore = new MemoryJobStore();
  console.log("[job-store] Using in-memory store (DB unavailable)");
  return jobStore;
}
