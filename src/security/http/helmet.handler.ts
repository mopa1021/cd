/**
 * Das Modul besteht aus Security-Funktionen für z.B. CSP, XSS, Click-Jacking,
 * HSTS und MIME-Sniffing, die durch Helmet bereitgestellt werden.
 * @packageDocumentation
 */

import {
    contentSecurityPolicy,
    frameguard,
    hidePoweredBy,
    hsts,
    noSniff,
    xssFilter,
} from 'helmet';

/**
 * Security-Funktionen für z.B. CSP, XSS, Click-Jacking, HSTS und MIME-Sniffing.
 */
export const helmetHandlers = [
    contentSecurityPolicy({
        useDefaults: true,
        directives: {
            defaultSrc: ["https: 'self'"],
            scriptSrc: ["https: 'unsafe-inline' 'unsafe-eval'"],
            imgSrc: ["data: 'self'"],
        },
        reportOnly: false,
    }),

    xssFilter(),
    frameguard(),
    hsts(),
    noSniff(),
    hidePoweredBy(),
];
