import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';

export function notFound(req: Request, res: Response) {
  res.status(404).json(error('页面不存在', 404));
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  res.status(500).json(error('服务器内部错误'));
}
