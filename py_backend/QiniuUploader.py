#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
七牛云对象存储（Kodo）文件上传工具
===================================

功能说明：
    本脚本提供将本地文件（如 MP3 音频）上传到七牛云对象存储的功能，支持：
    1. 上传单个文件
    2. 批量上传整个目录（保留目录结构）
    3. 自动处理大文件分片上传（SDK 内部自动切换）

依赖说明：
    1. qiniu - 七牛云官方 Python SDK
    2. os - Python 标准库（文件路径操作）
    3. pathlib - Python 标准库（路径处理）

环境准备步骤：
=============

【步骤一：注册七牛云账号并获取密钥】
1. 访问 https://portal.qiniu.com/signup 注册账号
2. 完成实名认证（个人/企业）
3. 创建存储空间（Bucket）：
   - 登录控制台 → 对象存储 → 新建空间
   - 填写空间名称（全局唯一）
   - 选择存储区域（华东、华北、华南等，创建后不可更改）
   - 设置访问控制（公开读/私有）
4. 获取密钥：
   - 控制台 → 个人中心 → 密钥管理
   - 复制 Access Key 和 Secret Key

【步骤二：安装 Python 依赖】
在激活虚拟环境后执行：

安装七牛云 SDK：
    pip install qiniu

如果需要处理文件路径中的中文，建议安装：
    pip install pathlib2   # Python 3.4 以下版本需要

【步骤三：配置密钥】
方式一：在代码中直接填写（不推荐，存在安全风险）
方式二：使用环境变量（推荐）

设置环境变量（macOS/Linux）：
    export QINIU_ACCESS_KEY="你的AccessKey"
    export QINIU_SECRET_KEY="你的SecretKey"

设置环境变量（Windows PowerShell）：
    $env:QINIU_ACCESS_KEY="你的AccessKey"
    $env:QINIU_SECRET_KEY="你的SecretKey"

使用示例：
=========

上传单个文件：
    from QiniuUploader import QiniuUploader
    uploader = QiniuUploader(bucket_name="my-bucket")
    uploader.upload_file("/path/to/audio.mp3", "music/audio.mp3")

批量上传目录：
    uploader.upload_directory("/path/to/music/", "backup/")

获取文件访问 URL：
    url = uploader.get_file_url("music/audio.mp3")
    print(url)

配置说明：
=========

存储空间（Bucket）配置：
    - bucket_name: 存储空间名称（必填）
    - domain: 自定义域名或测试域名（选填，用于生成访问 URL）
              测试域名在空间创建后自动生成，有效期 30 天
              长期使用需绑定已备案的自定义域名

上传配置：
    - token_expire: 上传 token 过期时间，单位秒（默认 3600 秒 = 1 小时）
    - version: 分片上传版本，推荐 'v2'（支持断点续传）

注意事项：
=========

1. 密钥安全：不要将 Access Key 和 Secret Key 硬编码在代码中
   建议使用环境变量或配置文件管理

2. 存储空间区域：上传时 SDK 会自动选择最近的区域，但首次上传
   建议确认区域配置是否正确

3. 文件大小限制：
   - 表单上传：最大 100MB
   - 分片上传：最大 10GB
   - SDK 会根据文件大小自动选择上传方式

4. 网络问题：上传大文件时建议在稳定的网络环境下进行，
   分片上传 v2 支持断点续传

5. 测试域名：测试域名仅用于开发调试，上线前务必绑定自定义域名

6. 访问控制：
   - 公开读：任何人都可以访问文件（适合网站素材、CDN 加速）
   - 私有：需要通过 SDK 生成临时访问链接才能访问（适合敏感数据）

7. 存储类型：
   - 标准存储：适合频繁访问的数据（如热数据）
   - 低频存储：适合不频繁访问的数据（访问成本低，但检索费用高）
   - 归档存储：适合长期备份的数据（检索速度慢，费用最低）
"""

from qiniu import Auth, put_file_v2, etag
import os
from pathlib import Path


class QiniuUploader:
    """
    七牛云文件上传器

    封装了七牛云对象存储的文件上传功能，提供简洁的 API 接口。

    :param access_key: 七牛云 Access Key（可选，默认从环境变量读取）
    :param secret_key: 七牛云 Secret Key（可选，默认从环境变量读取）
    :param bucket_name: 存储空间名称（必填）
    :param domain: 自定义域名（可选，用于生成访问 URL）
    :param token_expire: 上传 token 过期时间（秒），默认 3600
    """

    def __init__(self, access_key=None, secret_key=None, bucket_name=None, domain=None, token_expire=3600):
        """
        初始化七牛云上传器

        优先从环境变量读取密钥，避免硬编码。

        :param access_key: 七牛云 Access Key，若为 None 则从环境变量 QINIU_ACCESS_KEY 读取
        :param secret_key: 七牛云 Secret Key，若为 None 则从环境变量 QINIU_SECRET_KEY 读取
        :param bucket_name: 存储空间名称
        :param domain: 访问域名，如 'http://xxx.bkt.clouddn.com'
        :param token_expire: Token 过期时间（秒），默认 3600 秒（1 小时）
        """
        # 从环境变量获取密钥（优先）
        self.access_key = access_key or os.environ.get('QINIU_ACCESS_KEY')
        self.secret_key = secret_key or os.environ.get('QINIU_SECRET_KEY')

        # 验证密钥是否存在
        if not self.access_key or not self.secret_key:
            raise ValueError(
                "Access Key 或 Secret Key 未配置！\n"
                "请通过以下方式之一配置：\n"
                "1. 在代码中传入参数\n"
                "2. 设置环境变量：\n"
                "   export QINIU_ACCESS_KEY='your_key'\n"
                "   export QINIU_SECRET_KEY='your_key'"
            )

        # 验证存储空间名称
        if not bucket_name:
            raise ValueError("bucket_name 不能为空！")

        self.bucket_name = bucket_name
        self.domain = domain
        self.token_expire = token_expire

        # 构建鉴权对象
        self.auth = Auth(self.access_key, self.secret_key)

        print(f"七牛云上传器初始化完成\n"
              f"存储空间: {self.bucket_name}\n"
              f"域名: {self.domain if self.domain else '未配置'}\n"
              f"Token有效期: {self.token_expire}秒")

    def _generate_upload_token(self, key=None):
        """
        生成上传 Token

        Token 是七牛云上传的凭证，包含了上传权限和过期时间。

        :param key: 上传后的文件名（可选），如果为 None，七牛云会自动生成唯一文件名
        :return: 上传 Token 字符串
        """
        # 生成上传 Token，有效期为 self.token_expire 秒
        # key 参数用于指定上传后的文件名，若为 None 则由七牛云自动生成
        token = self.auth.upload_token(self.bucket_name, key, self.token_expire)
        return token

    def upload_file(self, local_path, key=None):
        """
        上传单个文件到七牛云

        :param local_path: 本地文件路径（绝对路径或相对路径）
        :param key: 上传后的文件名（可选），如果为 None，七牛云会自动生成唯一文件名
                    支持路径，如 'music/song.mp3'
        :return: 上传结果字典，包含 'key'（文件名）和 'hash'（文件哈希值）
        :raises FileNotFoundError: 如果本地文件不存在
        :raises RuntimeError: 如果上传失败
        """
        # 验证本地文件是否存在
        local_path = Path(local_path)
        if not local_path.exists():
            raise FileNotFoundError(f"文件不存在: {local_path}")

        if not local_path.is_file():
            raise ValueError(f"路径不是文件: {local_path}")

        # 获取文件大小
        file_size = local_path.stat().st_size
        print(f"\n准备上传文件: {local_path}")
        print(f"文件大小: {self._format_size(file_size)}")

        # 生成上传 Token
        token = self._generate_upload_token(key)

        # 如果未指定 key，使用文件名作为 key
        if key is None:
            key = local_path.name
            print(f"未指定上传文件名，使用原文件名: {key}")

        try:
            # 调用七牛云 SDK 上传文件
            # version='v2' 表示使用分片上传 v2 版本（支持断点续传）
            ret, info = put_file_v2(token, key, str(local_path), version='v2')

            # 检查上传结果
            if info.status_code == 200:
                # 验证上传结果
                assert ret['key'] == key, "上传文件名不匹配"
                assert ret['hash'] == etag(str(local_path)), "文件哈希值不匹配"

                print(f"上传成功！")
                print(f"文件名: {ret['key']}")
                print(f"文件哈希: {ret['hash']}")

                # 如果配置了域名，生成访问 URL
                if self.domain:
                    url = self.get_file_url(key)
                    print(f"访问链接: {url}")

                return ret
            else:
                raise RuntimeError(f"上传失败，状态码: {info.status_code}, 错误信息: {info.error}")

        except Exception as e:
            raise RuntimeError(f"上传过程中发生错误: {e}")

    def upload_directory(self, local_dir, prefix=''):
        """
        批量上传本地目录到七牛云，保留目录结构

        :param local_dir: 本地目录路径
        :param prefix: 七牛云中的路径前缀（可选），如 'backup/'
        :return: 上传结果列表，每个元素包含文件路径和上传状态
        :raises FileNotFoundError: 如果本地目录不存在
        """
        # 验证本地目录是否存在
        local_dir = Path(local_dir)
        if not local_dir.exists():
            raise FileNotFoundError(f"目录不存在: {local_dir}")

        if not local_dir.is_dir():
            raise ValueError(f"路径不是目录: {local_dir}")

        print(f"\n准备上传目录: {local_dir}")
        print(f"七牛云前缀: {prefix if prefix else '无'}")

        # 存储上传结果
        results = []

        # 遍历目录
        for root, dirs, files in os.walk(local_dir):
            for file in files:
                # 获取本地文件完整路径
                local_path = Path(root) / file

                # 计算相对路径（相对于 local_dir）
                relative_path = local_path.relative_to(local_dir)

                # 转换为七牛云的 key（使用 / 分隔符）
                key = str(relative_path).replace(os.sep, '/')

                # 如果指定了前缀，添加前缀
                if prefix:
                    key = prefix.rstrip('/') + '/' + key

                try:
                    print(f"\n上传中: {local_path} -> {key}")
                    ret = self.upload_file(str(local_path), key)
                    results.append({
                        'local_path': str(local_path),
                        'key': ret['key'],
                        'status': 'success',
                        'hash': ret['hash']
                    })
                except Exception as e:
                    print(f"上传失败 {local_path}: {e}")
                    results.append({
                        'local_path': str(local_path),
                        'key': key,
                        'status': 'failed',
                        'error': str(e)
                    })

        # 统计上传结果
        success_count = sum(1 for r in results if r['status'] == 'success')
        failed_count = len(results) - success_count

        print(f"\n{'='*60}")
        print(f"批量上传完成")
        print(f"总文件数: {len(results)}")
        print(f"成功: {success_count}")
        print(f"失败: {failed_count}")

        return results

    def get_file_url(self, key):
        """
        生成文件的访问 URL

        :param key: 文件在七牛云中的文件名（包含路径）
        :return: 文件访问 URL
        :raises ValueError: 如果未配置域名
        """
        if not self.domain:
            raise ValueError(
                "未配置域名！\n"
                "请在初始化时传入 domain 参数，或在七牛云控制台绑定自定义域名。\n"
                "测试域名可在空间概览中查看（有效期 30 天）。"
            )

        # 确保域名以 http:// 或 https:// 开头
        if not self.domain.startswith(('http://', 'https://')):
            domain = 'http://' + self.domain
        else:
            domain = self.domain

        # 确保域名不以 / 结尾
        domain = domain.rstrip('/')

        # 生成完整 URL
        url = f"{domain}/{key}"

        return url

    @staticmethod
    def _format_size(bytes_size):
        """
        格式化文件大小为可读格式

        :param bytes_size: 文件大小（字节）
        :return: 格式化后的字符串，如 '1.5 MB', '256 KB'
        """
        if bytes_size < 1024:
            return f"{bytes_size} B"
        elif bytes_size < 1024 * 1024:
            return f"{bytes_size / 1024:.2f} KB"
        elif bytes_size < 1024 * 1024 * 1024:
            return f"{bytes_size / (1024 * 1024):.2f} MB"
        else:
            return f"{bytes_size / (1024 * 1024 * 1024):.2f} GB"


if __name__ == "__main__":
    """
    主函数：示例用法

    以下提供了几种常见的上传场景示例，
    请根据实际情况修改配置并取消注释使用。
    """

    # ========== 配置信息 ==========
    # 请替换为你的实际配置
    BUCKET_NAME = "qiqisummer"  # 你的存储空间名称
    DOMAIN = "http://ti9qsm43f.hd-bkt.clouddn.com"  # 你的域名（测试域名或自定义域名）

    # ========== 示例 1：上传单个 MP3 文件 ==========
    print("示例 1：上传单个 MP3 文件")
    try:

        # 每一个不同的同学要改的就是下面 4 个!大家的都不一样,都不一样
        # 初始化上传器（从环境变量读取密钥）
        uploader = QiniuUploader(
            access_key="", 
            secret_key="mHkK8dQIAl2MffWl2raLlc1JXDH2AGjuB8M7jwCo",
            bucket_name=BUCKET_NAME,
            domain=DOMAIN
        )

        # 上传单个文件
        # local_path: 本地文件路径
        # key: 七牛云中的文件名，支持路径
        ret = uploader.upload_file(
            local_path="/Users/luosen/Downloads/《高等数学》全程教学视频 2.0版【宋浩老师】（下册增加了黑板版）/P3-2 函数_compressed.mp3",
            key="audio/math/P3-2 函数压缩版.mp3"  # 在七牛云中的存储路径
        )

        # 获取访问链接
        if DOMAIN:
            url = uploader.get_file_url(ret['key'])
            print(f"文件访问链接: {url}")

    except Exception as e:
        print(f"上传失败: {e}")

    # ========== 示例 2：批量上传目录 ==========
    # print("\n示例 2：批量上传目录")
    # try:
    #     uploader = QiniuUploader(
    #         bucket_name=BUCKET_NAME,
    #         domain=DOMAIN
    #     )
    #
    #     # 上传整个目录，保留目录结构
    #     # local_dir: 本地目录路径
    #     # prefix: 七牛云中的前缀路径
    #     results = uploader.upload_directory(
    #         local_dir="/path/to/your/audio/folder",
    #         prefix="backup/audio/"
    #     )
    #
    #     # 输出失败的文件
    #     failed_files = [r for r in results if r['status'] == 'failed']
    #     if failed_files:
    #         print("\n失败的文件:")
    #         for f in failed_files:
    #             print(f"  {f['local_path']}: {f['error']}")
    #
    # except Exception as e:
    #     print(f"批量上传失败: {e}")

    # ========== 示例 3：使用自定义密钥（不推荐） ==========
    # print("\n示例 3：使用自定义密钥")
    # try:
    #     uploader = QiniuUploader(
    #         access_key="your_access_key",
    #         secret_key="your_secret_key",
    #         bucket_name=BUCKET_NAME,
    #         domain=DOMAIN
    #     )
    #     uploader.upload_file("/path/to/file.mp3", "music/file.mp3")
    # except Exception as e:
    #     print(f"上传失败: {e}")
