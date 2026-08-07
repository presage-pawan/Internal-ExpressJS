import { SERVER_DETAILS } from "../configDB.js";

export class CookiesService {

    static isProduction = SERVER_DETAILS.environment === 'production';

    static DEFAULT_COOKIE_OPTIONS = {
        httpOnly: true,
        secure: CookiesService.isProduction,
        sameSite: 'strict',
        path: '/',
    };

    static setAuthTokenCookie = (res, token, options = {}) => {
        return res.cookie('access_token', token, { ...CookiesService.DEFAULT_COOKIE_OPTIONS, maxAge: 3 * 24 * 60 * 60 * 1000, ...options });
    };

    static getAuthTokenFromCookie = (req) => {
        return req?.cookies?.access_token || null;
    };

    static clearAuthTokenCookie = (res) => {
        return res.clearCookie('access_token', { ...CookiesService.DEFAULT_COOKIE_OPTIONS });
    };
}