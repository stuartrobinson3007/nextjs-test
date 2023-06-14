import { NextRequest, NextResponse } from 'next/server.js';
import { v4 as uuidv4 } from 'uuid';

const contentSecurityPolicy = {
    'default-src': "'self'",
    'img-src': "'self' data: https://*.cloudinary.com",
    'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src': "'self' https://fonts.gstatic.com",
    'script-src': "'self' *.google.com *.googleapis.com *.gstatic.com https://vercel.live",
    'connect-src': "'self' https://*.vercel-insights.com https://*.cloudinary.com",
    'frame-src': "'self' https://*.google.com",
}

export function middleware(request: NextRequest) {
    const nonce = uuidv4();

    // Clone the request headers
    const requestHeaders = new Headers(request.headers);



    // Set `x-nonce` request header to read in pages with headers()
    requestHeaders.set('x-nonce', nonce);


    // Add the nonce as `nonce-${nonce}` to the script-src
    const cspHeader = Object.entries(contentSecurityPolicy).reduce(
        (acc, [key, value]) => {
            if (key === 'script-src') {
                return `${acc}${key} ${value} 'nonce-${nonce}';`;
            } else {
                return `${acc}${key} ${value};`;
            }
        },
        ""
    );

    // Set the CSP header
    requestHeaders.set("Content-Security-Policy", cspHeader);

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