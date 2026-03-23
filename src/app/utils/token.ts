import { Response } from "express";
import ms from "ms";
import { CookieUtils } from "./cookie";
import { envVars } from "../config/env";
import { jwtUtils } from "./jwt";
import type { JwtPayload } from "jsonwebtoken";

const parseMsValue = (value: string) => ms(value as unknown as ms.StringValue);

// const setCookieOptions = (maxAgeMs: number) => ({
//     httpOnly: true,
//     secure: true,
//     sameSite: "none" as const,
//     path: "/",
//     maxAge: maxAgeMs,
// });
const setCookieOptions = (maxAgeMs: number) => ({
    maxAge: maxAgeMs,
});

const setAccessTokenCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, "accessToken", token, setCookieOptions(parseMsValue(envVars.ACCESS_TOKEN_EXPIRES_IN)));
};

const setRefreshTokenCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, "refreshToken", token, setCookieOptions(parseMsValue(envVars.REFRESH_TOKEN_EXPIRES_IN)));
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, "better-auth.session_token", token, setCookieOptions(parseMsValue(envVars.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN)));
};

const getAccessToken = (payload: JwtPayload) => {
    return jwtUtils.createToken(payload, envVars.ACCESS_TOKEN_SECRET, {
        expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN as unknown as ms.StringValue,
    });
};

const getRefreshToken = (payload: JwtPayload) => {
    return jwtUtils.createToken(payload, envVars.REFRESH_TOKEN_SECRET, {
        expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN as unknown as ms.StringValue,
    });
};

export const tokenUtils = {
    setAccessTokenCookie,
    setRefreshTokenCookie,
    setBetterAuthSessionCookie,
    getAccessToken,
    getRefreshToken,
};