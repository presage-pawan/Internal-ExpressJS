import { SERVER_DETAILS } from "../configDB.js";

export class CookiesService {
    // Host-only cookies permit the CMMS and Internal applications to coexist
    // under the same origin without sharing their authenticated sessions.
    static isSecure = ['production', 'staging'].includes(SERVER_DETAILS.environment)
        || SERVER_DETAILS.protocol === 'https';

    static AUTH_COOKIE_NAME = CookiesService.isSecure ? '__Host-internal_access' : 'internal_access';

    static DEFAULT_COOKIE_OPTIONS = {
        httpOnly: true,
        secure: CookiesService.isSecure,
        sameSite: 'lax',
        path: '/',
    };

    static setAuthTokenCookie = (res, token) => {
        return res.cookie(CookiesService.AUTH_COOKIE_NAME, token, {
            ...CookiesService.DEFAULT_COOKIE_OPTIONS,
            maxAge: 3 * 24 * 60 * 60 * 1000
        });
    };

    static getAuthTokenFromCookie = (req) => {
        // Do not accept the generic access_token cookie also historically
        // used by CMMS. Old browser clients can use a bearer token during rollout.
        return req?.cookies?.[CookiesService.AUTH_COOKIE_NAME] || null;
    };

    static clearAuthTokenCookie = (res) => {
        return res.clearCookie(CookiesService.AUTH_COOKIE_NAME, { ...CookiesService.DEFAULT_COOKIE_OPTIONS });
    };
}
