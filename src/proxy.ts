import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { GUEST_COOKIE_NAME } from "@/lib/guest-keys/codec";

function isClerkAuthBypassed() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DISABLE_CLERK_AUTH === "true"
  );
}

function isByokDemoDeployment() {
  return !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
}

function isGuestSession(req: NextRequest) {
  return req.cookies.get(GUEST_COOKIE_NAME)?.value === "1";
}

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/landing(.*)",
]);

const isOrgSelectionRoute = createRouteMatcher(["/org-selection(.*)"]);

function demoGuestMiddleware(req: NextRequest) {
  if (isGuestSession(req) || isPublicRoute(req)) {
    return NextResponse.next();
  }

  const pathname = new URL(req.url).pathname;
  const isApiOrTrpc =
    pathname.startsWith("/api") || pathname.startsWith("/trpc");

  if (isApiOrTrpc) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/landing", req.url));
}

const clerkProtected = clerkMiddleware(async (auth, req) => {
  if (isClerkAuthBypassed() || isGuestSession(req)) {
    return NextResponse.next();
  }

  const { userId, orgId } = await auth();

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (!userId) {
    const pathname = new URL(req.url).pathname;
    const isApiOrTrpc =
      pathname.startsWith("/api") || pathname.startsWith("/trpc");
    if (isApiOrTrpc) {
      await auth.protect();
    } else {
      return NextResponse.redirect(new URL("/landing", req.url));
    }
  }

  if (isOrgSelectionRoute(req)) {
    return NextResponse.next();
  }

  if (userId && !orgId) {
    return NextResponse.redirect(new URL("/org-selection", req.url));
  }

  return NextResponse.next();
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  if (isByokDemoDeployment()) {
    return demoGuestMiddleware(req);
  }
  return clerkProtected(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
