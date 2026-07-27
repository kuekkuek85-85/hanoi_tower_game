import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const isTrainingSubdomain = host.startsWith('training.');

  if (isTrainingSubdomain) {
    const { pathname, search } = request.nextUrl;

    // 이미 /training 하위 경로거나 API/정적 파일은 통과
    if (
      pathname.startsWith('/training') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon')
    ) {
      return NextResponse.next();
    }

    // 루트 및 나머지 경로를 /training 하위로 리라이트
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/training${pathname === '/' ? '' : pathname}`;
    rewriteUrl.search = search;
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
