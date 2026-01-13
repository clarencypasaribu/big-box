import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

// Add matchers for protected routes once auth is wired.
export const config = {
  matcher: ["/pm/:path*", "/member/:path*", "/dashboard"],
};
