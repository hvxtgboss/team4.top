export function success<T = any>(data?: T, message: string = '操作成功') {
  return {
    code: 200,
    message,
    data,
  };
}

export function error(message: string = '操作失败', code: number = 500) {
  return {
    code,
    message,
    data: null,
  };
}

export function notFound(message: string = '资源不存在') {
  return error(message, 404);
}

export function unauthorized(message: string = '未授权') {
  return error(message, 401);
}

export function forbidden(message: string = '无权限') {
  return error(message, 403);
}

export function pagination<T = any>(data: T[], total: number, page: number, page_size: number) {
  return {
    list: data,
    total,
    page,
    page_size,
  };
}
