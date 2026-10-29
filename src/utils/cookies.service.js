import crypto from 'node:crypto';
import { SERVER_DETAILS } from "../configDB.js";

export class CookiesService {
    // Host-only cookies permit the CMMS and Internal applications to coexist
    // under the same origin without sharing their authenticated sessions.
    static isSecure = ['production', 'staging'].includes(SERVER_DETAILS.environment)
        || SERVER_DETAILS.protocol === 'https';

    static AUTH_COOKIE_NAME = CookiesService.isSecure ? '__Host-internal_access' : 'internal_access';
    static CSRF_COOKIE_NAME = CookiesService.isSecure ? '__Host-internal_csrf' : 'internal_csrf';

    static DEFAULT_COOKIE_OPTIONS = {
        httpOnly: true,
        secure: CookiesService.isSecure,
        sameSite: 'lax',
        path: '/',
    };

    static signCsrf = (sessionToken, nonce) => crypto
        .createHmac('sha256', sessionToken).update(nonce).digest('base64url');

    static setAuthTokenCookie = (res, token) => {
        const ttl = 3 * 24 * 60 * 60 * 1000;
        const nonce = crypto.randomBytes(18).toString('base64url');
        const csrf = nonce + '.' + CookiesService.signCsrf(token, nonce);
        res.cookie(CookiesService.AUTH_COOKIE_NAME, token, {
            ...CookiesService.DEFAULT_COOKIE_OPTIONS, maxAge: ttl
        });
        res.cookie(CookiesService.CSRF_COOKIE_NAME, csrf, {
            ...CookiesService.DEFAULT_COOKIE_OPTIONS, httpOnly: false, maxAge: ttl
        });
        return res;
    };

    static verifyCsrfRequest = (req) => {
        const proof = String(req.cookies?.[CookiesService.CSRF_COOKIE_NAME] || '');
        const header = String(req.get?.('X-Internal-CSRF') || '');
        const token = CookiesService.getAuthTokenFromCookie(req);
        if (!token || token !== req.token || !proof || proof !== header) return false;
        const [nonce, signature, extra] = proof.split('.');
        if (!nonce || !signature || extra !== undefined) return false;
        const expected = Buffer.from(CookiesService.signCsrf(token, nonce));
        const supplied = Buffer.from(signature);
        return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
    };

    static getAuthTokenFromCookie = (req) => {
        // Do not accept the generic access_token cookie also historically
        // used by CMMS. Old browser clients can use a bearer token during rollout.
        return req?.cookies?.[CookiesService.AUTH_COOKIE_NAME] || null;
    };

    static clearAuthTokenCookie = (res) => {
        res.clearCookie(CookiesService.AUTH_COOKIE_NAME, { ...CookiesService.DEFAULT_COOKIE_OPTIONS });
        return res.clearCookie(CookiesService.CSRF_COOKIE_NAME, { ...CookiesService.DEFAULT_COOKIE_OPTIONS, httpOnly: false });
    };
}
