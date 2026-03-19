import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: string;
      permissions?: string[];
      isCorporate?: boolean;
      corporateId?: string;
      corporateRole?: string;
      corporateTier?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    permissions?: string[];
    isCorporate?: boolean;
    corporateId?: string;
    corporateRole?: string;
    corporateTier?: string;
  }
}
