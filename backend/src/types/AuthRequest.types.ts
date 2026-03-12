import type { Request } from "express";

export interface LoginBody extends Request{
    user_id?: string
}