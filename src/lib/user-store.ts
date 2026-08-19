export interface UserData {
  id: string;
  email: string;
  passwordHash: string;
  name?: string | null;
  plan: string;
  apiKey: string;
  createdAt?: Date;
}

export interface UserStore {
  findUserByEmail(email: string): Promise<UserData | null>;
  findUserById(id: string): Promise<UserData | null>;
  createUser(data: UserData): Promise<UserData>;
}

class MemoryUserStore implements UserStore {
  private users = new Map<string, UserData>();
  private byEmail = new Map<string, UserData>();

  async findUserByEmail(email: string): Promise<UserData | null> {
    return this.byEmail.get(email) ?? null;
  }

  async findUserById(id: string): Promise<UserData | null> {
    return this.users.get(id) ?? null;
  }

  async createUser(data: UserData): Promise<UserData> {
    this.users.set(data.id, data);
    this.byEmail.set(data.email, data);
    return data;
  }
}

let userStore: UserStore | null = null;
let dbAvailable = true;

async function tryCreatePrismaStore(): Promise<UserStore | null> {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;

    const memory = new MemoryUserStore();

    return {
      async findUserByEmail(email) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name,
          plan: user.plan,
          apiKey: user.apiKey,
          createdAt: user.createdAt,
        };
      },
      async findUserById(id) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name,
          plan: user.plan,
          apiKey: user.apiKey,
          createdAt: user.createdAt,
        };
      },
      async createUser(data) {
        await prisma.user.create({
          data: {
            id: data.id,
            email: data.email,
            passwordHash: data.passwordHash,
            name: data.name ?? null,
            plan: data.plan as "FREE" | "PERSONAL" | "COMMERCIAL" | "ENTERPRISE",
            apiKey: data.apiKey,
          },
        });
        return data;
      },
    };
  } catch (err) {
    console.warn("[user-store] PostgreSQL unavailable, using in-memory store:", (err as Error).message?.slice(0, 120));
    return null;
  }
}

export async function getUserStore(): Promise<UserStore> {
  if (userStore) return userStore;

  if (dbAvailable) {
    const prismaStore = await tryCreatePrismaStore();
    if (prismaStore) {
      userStore = prismaStore;
      console.log("[user-store] Using PostgreSQL via Prisma");
      return userStore;
    }
    dbAvailable = false;
  }

  userStore = new MemoryUserStore();
  console.log("[user-store] Using in-memory store (DB unavailable)");
  return userStore;
}
