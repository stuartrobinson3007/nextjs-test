import { NextRequest, NextResponse } from 'next/server.js';
import { v4 as uuidv4 } from 'uuid';

export function middleware(request: NextRequest) {
  const nonce = uuidv4();

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);

  // Set `x-nonce` request header to read in pages with headers()
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  console.log('response', response);

  return response;
}

export const config = {
  // Run middleware above on all paths
  matcher: '/:path*',
};