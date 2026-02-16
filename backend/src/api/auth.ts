import express, { Router } from "express"
import type { Request, Response } from "express"
import prisma from "../db";
import { hashPass } from "../utils/hash"

interface RegisterBody {
    username?: string;
    email?: string;
    password?: string;
}


const router = express.Router();

router.post("/login", async function(params) {});
router.post("/logout", async function(params) {});

router.post(
    "/register",
    async function (req: Request<{}, {}, RegisterBody>, res: Response) {
        try {
            const { username, email, password } = req.body;
            if (!email || !password || !username)
                throw new Error("Email or password error1");

            const existingUser = await prisma.user.findFirst({
                where: {
                email: email,
                },
            })

            if (existingUser) {
                throw new Error("This email address is already registered.")
            }
            const hashedPass = await hashPass(password);


            const newUser = prisma.user.create({
                data: { username, email, password: hashedPass },
            })
        }
    }
)