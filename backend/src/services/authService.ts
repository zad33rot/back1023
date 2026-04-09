import { prisma } from '../db';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { hashPass } from '../utils/hash';

const SECRET_KEY = `${process.env.SECRET_KEY}`;

export async function registerUser(username: string, email: string, password: string) {
    const existingEmail = await prisma.user.findUnique({ 
        where: { email: email } 
    });

    if (existingEmail) {
        throw new Error("Такой email уже занят");
    }

    const existingUsername = await prisma.user.findUnique({ 
        where: { username: username } 
    });

    if (existingUsername) {
        throw new Error("Такой никнейм уже занят");
    }

    const hashedPassword = await hashPass(password);

    const newUser = await prisma.user.create({
        data: {
            username: username,
            email: email,
            password: hashedPassword,
        },
    });

    return newUser;
}

export async function loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ 
        where: { email: email } 
    });

    if (!user) {
        throw new Error("Неверный email или пароль");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Неверный email или пароль");
    }

    const refreshToken = jwt.sign({ 
        data: { id: user.id } }, 
        SECRET_KEY, 
        { expiresIn: "30d" });

    const accessToken = jwt.sign({ 
        data: { id: user.id, username: user.username } }, 
        refreshToken, 
        { expiresIn: "10s" 
            
        });

    await prisma.session.create({
        data: {
            userId: user.id,
            refreshToken: refreshToken
        }
    });

    return {
        accessToken: accessToken,
        refreshToken: refreshToken
    };
}

export async function logOutUser(refreshToken: string) {
    await prisma.session.deleteMany({
        where: {refreshToken}
    })
}

export async function refresh(refreshToken: string) {
    const session = await prisma.session.findUnique({
        where: { refreshToken }
    })

    if (!session) {
        throw new Error('Сессия не найдена')
    }

    jwt.verify(refreshToken, SECRET_KEY);
    const newAccessToken = jwt.sign({ 
        data: 
        {id: session.userId }},
        SECRET_KEY,
        { expiresIn: "15s"}
    )

    return newAccessToken;
}