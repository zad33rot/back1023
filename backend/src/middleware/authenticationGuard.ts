import { NextFunction, Request, Response } from 'express';
import jwt from "jsonwebtoken"
import { AuthorizedRequest, TokenPayload } from '../types/AuthRequest.types';
import "dotenv/config";

const SECRET_KEY = `${process.env.SECRET_KEY}`;

export function myMiddleware(req: AuthorizedRequest, res: Response, next: NextFunction){

    const token = req.headers["authorization"]?.split(" ")[1]; // bearer fdrfu6figtf57rfi
    if (!token) {
        return res.status(403).json({error: "token missing"})
    }
    try {
        const decoded = jwt.verify(token, SECRET_KEY) as TokenPayload;
        // console.log(decoded);
        
        req.user_id = decoded.data.id;
        next()
    }
    catch(error) {
        return res.status(403).json({ error: "Invalid token" })
    }
}