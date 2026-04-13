import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { tokenUtils } from "../../utils/token";
import { AuthService } from "./auth.service";
import AppError from "../../errorHelpers/AppError";
import { envVars } from "../../config/env";
import { auth } from "../../lib/auth";

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    const result = await AuthService.registerUser(payload);

    const { accessToken, refreshToken, token, ...rest } = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, token as string);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "User registered successfully",
        data: {
            token,
            accessToken,
            refreshToken,
            ...rest,
        },
    });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AuthService.loginUser(payload);
    const { accessToken, refreshToken, token, ...rest } = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, token);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User logged in successfully",
        data: {
            token,
            accessToken,
            refreshToken,
            ...rest,
        },
    });
});

const getNewToken = catchAsync(
    async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        const betterAuthSessionToken = req.cookies["better-auth.session_token"];
        if (!refreshToken) {
            throw new AppError(status.UNAUTHORIZED, "Refresh token is missing");
        }
        const result = await AuthService.getNewToken(refreshToken, betterAuthSessionToken);

        const { accessToken, refreshToken: newRefreshToken, sessionToken, user } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, sessionToken);

        // Update the user cookie for frontend state hydration
        res.cookie("user", JSON.stringify(user), {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "New tokens generated successfully",
            data: {
                accessToken,
                refreshToken: newRefreshToken,
                sessionToken,
                user,
            },
        });
    }
)

const googleLogin = catchAsync((req: Request, res: Response) => {
    const redirectPath = req.query.redirect || "/dashboard";
    const role = (req.query.role as string) || "USER";

    const encodedRedirectPath = encodeURIComponent(redirectPath as string);
    const encodedRole = encodeURIComponent(role);

    const callbackURL = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}&role=${encodedRole}`;

    res.render("googleRedirect", {
        callbackURL: callbackURL,
        betterAuthUrl: envVars.BETTER_AUTH_URL,
    })
})

const changePassword = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const { userId } = req.user!;

    const result = await AuthService.changePassword(payload, userId);

    const { accessToken, refreshToken, token } = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, token as string);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Password changed successfully",
        data: result,
    });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
    // Best-effort: clean up server-side sessions (never block cookie clearing on failure)
    try {
        const { userId } = req.user!;
        await AuthService.logoutUser(userId);
    } catch {
        // Ignore service errors — cookies must always be cleared
    }

    // Clear all auth cookies — try both sameSite variants to cover Google & email login
    const clearOptions = { path: "/" };
    const clearOptionsNone = { path: "/", sameSite: "none" as const, secure: true };

    res.clearCookie("accessToken", clearOptions);
    res.clearCookie("refreshToken", clearOptions);
    res.clearCookie("better-auth.session_token", clearOptions);
    res.clearCookie("better-auth.session_token", clearOptionsNone);
    res.clearCookie("user", clearOptions);
    res.clearCookie("user", clearOptionsNone);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User logged out successfully",
        data: { success: true },
    });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    await AuthService.verifyEmail(email, otp);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Email verified successfully",
    });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    await AuthService.forgetPassword(email);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Password reset OTP sent to email successfully",
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    await AuthService.resetPassword(email, otp, newPassword);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Password reset successfully",
    });
});

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
    const redirectPath = (req.query.redirect as string) || "/dashboard";

    const sessionToken = req.cookies["better-auth.session_token"];

    if (!sessionToken) {
        return res.redirect(
            `${envVars.FRONTEND_URL}/login?error=oauth_failed`,
        );
    }

    const session = await auth.api.getSession({
        headers: {
            Cookie: `better-auth.session_token=${sessionToken}`,
        },
    });

    if (!session) {
        return res.redirect(
            `${envVars.FRONTEND_URL}/login?error=no_session_found`,
        );
    }

    if (session && !session.user) {
        return res.redirect(
            `${envVars.FRONTEND_URL}/login?error=no_user_found`,
        );
    }

    try {
        const result = await AuthService.googleLoginSuccess(session);
        const { accessToken, refreshToken, user } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, refreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, sessionToken);

        // Set the user cookie for frontend state hydration
        res.cookie("user", JSON.stringify(user), {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        const isValidRedirectPath =
            redirectPath.startsWith("/") && !redirectPath.startsWith("//");
        const finalRedirectPath = isValidRedirectPath
            ? redirectPath
            : "/dashboard";

        res.redirect(`${envVars.FRONTEND_URL}${finalRedirectPath}`);
    } catch (error: any) {
        console.error("Google Login Success Error:", error);
        const errorMessage = error.message || "oauth_callback_failed";
        res.redirect(
            `${envVars.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`,
        );
    }
});

const handleOAuthError = catchAsync(async (req: Request, res: Response) => {
    const error = (req.query.error as string) || "oauth_failed";
    console.error("OAuth Error Catch:", error);
    res.redirect(
        `${envVars.FRONTEND_URL}/login?error=${encodeURIComponent(error)}`,
    );
});

const resendOTP = catchAsync(async (req: Request, res: Response) => {
    const { email, type } = req.body;
    await AuthService.resendOTP(email, type);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "OTP resent successfully",
    });
});

export const AuthController = {
    registerUser,
    loginUser,
    getNewToken,
    changePassword,
    logoutUser,
    verifyEmail,
    forgetPassword,
    resetPassword,
    googleLogin,
    googleLoginSuccess,
    handleOAuthError,
    resendOTP,
};
