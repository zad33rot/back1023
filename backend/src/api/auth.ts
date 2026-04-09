import express, { Router } from "express"
import type { Request, Response } from "express"
import { registerUser, loginUser, logOutUser, refresh } from "../services/authService";
import {prisma} from "../db";
import jwt from "jsonwebtoken"
import { myMiddleware } from "../middleware/authenticationGuard";
import { AuthorizedRequest } from "../types/AuthRequest.types";
import "dotenv/config";

const SECRET_KEY = `${process.env.SECRET_KEY}`;

interface RegisterBody {
    username?: string;
    email?: string;
    password?: string;
}

interface LoginBody {
    email?: string,
    password?: string,
    refreshToken: string
}


const router = express.Router();

router.post("/login", async function(req: Request<{}, {}, LoginBody>, res: Response) {
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({ error: "Заполните email и пароль" });
        }

        const result = await loginUser(email, password);

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            secure: false,
            sameSite: "lax",
        });

        res.status(200).json({ accessToken: result.accessToken });
    } catch (error) {
        res.status(400).json({ error });
    }
});

router.post("/logout", async function(req: Request, res: Response) {
    try {
        // const token = req.headers["authorization"]?.split(" ")[1]; // bearer fdrfu6figtf57rfi
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) { await logOutUser(refreshToken)}
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 0
        });
        res.status(200).json({ text: "Пока!" });
    }
    catch(error) {
        res.status(400).json({ error })
    }
});

router.post("/refresh", async function(req: Request<{}, {}, LoginBody>, res: Response) {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: "Нет рефреш токена" });
        }



        const newAccessToken = await refresh(refreshToken)

        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(500).json({ error });
    }
});

router.post("/register", async function (req: Request<{}, {}, RegisterBody>, res: Response) {
        try {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Заполните все поля" });
        }

        const newUser = await registerUser(username, email, password);

        res.status(201).json({ message: "Успешно зарегистрировались!", user: newUser });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
})


router.get("/me", myMiddleware, async function(req: AuthorizedRequest, res: Response) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(req.user_id) },
            select: { id: true, username: true, email: true }
        });

        if (!user) return res.status(404).json({ error: "Пользователь не найден" });
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error });
    }
});
export default router