import { MemberRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
      projectMember?: {
        id: string;
        role: MemberRole;
        projectId: string;
      };
    }
  }
}

export {};
