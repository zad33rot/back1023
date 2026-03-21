import type { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface TokenPayload extends JwtPayload{
    data: {
        id: string;
    }
}


export interface LoginBody extends Request{
    user_id?: string;
}

export interface AuthorizedRequest extends Request {
    user_id?: string;
}