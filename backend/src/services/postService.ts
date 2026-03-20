import { prisma } from '../db';

export const postService = {
  async getAllPosts() {
    return await prisma.post.findMany({
      include: { author: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getPostById(id: number) {
    return await prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, username: true, email: true } } }
    });
  },

  async createPost(title: string, content: string | undefined, authorId: number) {
    return await prisma.post.create({
      data: { title, content, authorId },
      include: { author: { select: { id: true, username: true, email: true } } }
    });
  },

  async updatePost(id: number, title: string, content: string | undefined) {
    return await prisma.post.update({
      where: { id },
      data: { title, content },
      include: { author: { select: { id: true, username: true, email: true } } }
    });
  },

  async deletePost(id: number) {
    return await prisma.post.delete({ where: { id } });
  }
};