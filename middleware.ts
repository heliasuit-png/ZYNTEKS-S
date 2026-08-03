import type { NextRequest } from "next/server";

import { handleRequest } from "@/middleware/index";

export async function middleware(request: NextRequest) {
  return handleRequest(request);
}

// Next.js requires `config.matcher` to be a statically analyzable literal.
// Keep this in sync with `middlewareMatcher` in `middleware/index.ts`.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
