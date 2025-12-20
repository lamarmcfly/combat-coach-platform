import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth/next";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}
