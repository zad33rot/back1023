import express, { Router } from "express"
import type { Request, Response } from "express"
import {prisma} from "../db";
import bcrypt from "bcrypt"
import { hashPass } from "../utils/hash"
import jwt from "jsonwebtoken"
import { text } from "node:stream/consumers";
import { myMiddleware } from "../middleware/authenticationGuard";

interface RegisterBody {
    username?: string;
    email?: string;
    password?: string;
}

interface LoginBody {
    email?: string,
    password?: string,
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
        const token = jwt.sign({
            exp: "3d",
            data: user,
        }, 'secret')

        // const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({ text: token })
    }
    catch(error) {
        res.status(400).json({ error })
    }
});

router.post("/logout", myMiddleware, async function(req: Request, res: Response) {
    try {
        // const token = req.headers["authorization"]?.split(" ")[1]; // bearer fdrfu6figtf57rfi
        res.status(200).json({ text: "Done!" })
    }
    catch(error) {
        res.status(400).json({ error })
    }
});

router.post(
    "/register",
    async function (req: Request<{}, {}, RegisterBody>, res: Response) {
        try {
            console.log(req.body);
            
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


            const newUser = prisma.user.create({
                data: { username, email, password: hashedPass },
            });

            res.status(200).json({ user: newUser })
        }
    catch(error) {
        res.status(400).json({ error })
    }
})

export default router
// /me