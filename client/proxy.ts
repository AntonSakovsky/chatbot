import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED = ['/chat'];
// Routes only for unauthenticated users (redirect to /chat if already logged in)
const AUTH_ONLY = ['/login'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  

  // Read Supabase session token from cookies
  // Supabase stores the session in a cookie named sb-<projectRef>-auth-token
  const hasCookie = req.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  console.log(isAuthOnly, isProtected);
  

  if (isProtected && !hasCookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && hasCookie) {
    const chatUrl = req.nextUrl.clone();
    chatUrl.pathname = '/chat';
    return NextResponse.redirect(chatUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/chat/:path*', '/login'],
};
