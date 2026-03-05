import { Request, Response } from 'express';
import jwt from "jsonwebtoken"

export function myMiddleware(req: Request, res: Response, next: Function){

    const token = req.headers["authorization"]?.split(" ")[1]; // bearer fdrfu6figtf57rfi

    try {
        const decoded = jwt.verify(token as string, 'secret')
        req.user = decoded
        next()
    }
    catch(error) {
        return res.status(403).json(error)
    }
}