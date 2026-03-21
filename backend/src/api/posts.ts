import express, { Router } from "express"
import type { Request, Response } from "express"
import {prisma} from "../db";
import { myMiddleware } from '../middleware/authenticationGuard';
import { AuthorizedRequest } from "../types/AuthRequest.types";

interface CreatePostBody {
    title?: string,
    content?: string,
}

const router = express.Router();

router.get('/getPost', async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось загрузить посты' });
  }
});

router.post('/post', myMiddleware, async (req: Request<{}, {}, CreatePostBody>, res: Response) => {
  try {
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Нет заголовка' });
    }


    const authorId = (req as AuthorizedRequest).user_id;
        if (!authorId) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        const newPost = await prisma.post.create({
            data: { title, content, authorId: Number(authorId) },
            include: {
                author: { select: { id: true, username: true, email: true } }
            }
        });
        res.status(201).json(newPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Не удалось создать пост' });
    }
});

router.put('/post/:id', myMiddleware, async (req: Request<{ id: string }, {}, CreatePostBody>, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Нет заголовка' });
    }

    const authorId = (req as AuthorizedRequest).user_id;
    if (!authorId) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Пост не найден' });
    }

    if (existingPost.authorId !== Number(authorId)) {
      return res.status(403).json({ error: 'Нет прав на редактирование этого поста' });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { title, content },
      include: {
        author: { select: { id: true, username: true, email: true } },
      },
    });

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось обновить пост' });
  }
});

router.delete('/post/:id', myMiddleware, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const authorId = (req as AuthorizedRequest).user_id;

    if (!authorId) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Пост не найден' });
    }

    if (existingPost.authorId !== Number(authorId)) {
      return res.status(403).json({ error: 'Нет прав на удаление этого поста' });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    res.json({ message: 'Пост успешно удалён' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось удалить пост' });
  }
});

export default router;