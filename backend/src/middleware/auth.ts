import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { unauthorized, forbidden } from '../utils/response';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json(unauthorized('请先登录'));
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.json(unauthorized('登录已过期，请重新登录'));
  }

  (req as any).user = payload;
  next();
}

/** 有 Token 则解析用户，无 Token 也放行（用于公开详情页判断是否已购/已入群） */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const payload = verifyToken(authHeader.slice(7));
    if (payload) {
      (req as any).user = payload;
    }
  }
  next();
}

/** 要求 JWT 中的 role 属于给定列表 */
export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user?.role || !roles.includes(user.role)) {
      return res.json(forbidden(`需要角色: ${roles.join(' / ')}`));
    }
    next();
  };
}
