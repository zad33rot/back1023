import { NextFunction, Request, Response } from 'express';
import jwt from "jsonwebtoken"
import { LoginBody } from '../types/AuthRequest.types';


export function myMiddleware(req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction){

    const token = req.headers["authorization"]?.split(" ")[1]; // bearer fdrfu6figtf57rfi
    if (!token) throw new Error()
    try {
        const decoded = jwt.verify(token, 'secret');
        console.log(decoded);
        
        req.body.user_id = decoded as string;
        next()
    }
    catch(error) {
        return res.status(403).json(error)
    }
}