import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export function proxy(request: NextRequest) {
  if (isAuthorized(request.headers.get("authorization"))) {
    return NextResponse.next();
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="myblog admin", charset="UTF-8"' },
  });
}
