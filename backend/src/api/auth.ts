import express, { Router } from "express"
import type { Request, Response } from "express"
import {prisma} from "../db";
import bcrypt from "bcrypt"
import { hashPass } from "../utils/hash"
import jwt from "jsonwebtoken"
import { myMiddleware } from "../middleware/authenticationGuard";
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
        
        const { email, password } = req.body;
    
        if(!email || !password) {
            throw new Error("Email, password are required.")
        }
    
        const user = await prisma.user.findFirst({
            where: {
                email: email,
            },
        })
        if(!user) {
            throw new Error("Invalid email or password.")
        }
    
        const isValid = await bcrypt.compare(password, user.password)
        if(!isValid) {
            throw new Error("Invaliv email or password.")
        }

        const refresh_token = jwt.sign({
            data: {id: user.id},
        }, SECRET_KEY, {expiresIn: "1d"})

        const access_token = jwt.sign({
            data: {id: user.id },
        }, refresh_token, {expiresIn: "15s"})

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refresh_token },
        });
        
        res.cookie("refreshToken", refresh_token, {
            httpOnly: true,
            maxAge: 5 * 60 * 60 * 1000,
            secure: false,
            sameSite: "lax"
        })

        res.status(200).json({ accessToken: access_token })
        
    }
    catch(error) {
        console.log(error)
        res.status(400).json({ error })
    }
});

router.post("/logout", async function(req: Request, res: Response) {
    try {
        // const token = req.headers["authorization"]?.split(" ")[1]; // bearer fdrfu6figtf57rfi
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await prisma.user.updateMany({
                where: { refreshToken: refreshToken },
                data: { refreshToken: null },
            });
            }
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

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, SECRET_KEY);
        } catch (err) {
            return res.status(403).json({ error: "Ошибка рефреш токена" });
        }

        const user = await prisma.user.findFirst({
            where: { refreshToken: refreshToken },
        });
        if (!user) {
            return res.status(403).json({ error: "Рефреш токен не найден" });
        }

        const newAccessToken = jwt.sign({ data: {id: user.id} }, SECRET_KEY, { expiresIn: "10s" });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

router.post(
    "/register",
    async function (req: Request<{}, {}, RegisterBody>, res: Response) {
        try {
            // console.log(req.body);
            
            const { username, email, password } = req.body;
            if (!email || !password || !username) {
                throw new Error("Email, password and username are required.");
            }
            const existingUserEmail = await prisma.user.findFirst({
                where: {
                email: email,
                },
            })

            const exictingUserName = await prisma.user.findFirst({
                where: {
                username: username,
                },
            })

            if (existingUserEmail) {
                throw new Error("This email address is already registered.")
            }

            if (exictingUserName) {
                throw new Error("This username is already registered.")
            }
            const hashedPass = await hashPass(password);


            const newUser = await prisma.user.create({
                data: { username, email, password: hashedPass },
            });

            res.status(200).json({ user: newUser })
        }
    catch(error) {
        console.log(error);
        
        res.status(400).json({ error })
    }
})

export default router
// /me