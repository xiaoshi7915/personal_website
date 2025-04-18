#!/bin/bash

# Docker部署脚本
# 用于在生产环境中通过Docker部署个人网站服务

echo "======================================"
echo "    通过Docker部署mr stone的个人网站"
echo "======================================"

# 确保在正确的目录
cd "$(dirname "$0")"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: 未找到Docker，请先安装Docker"
    exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: 未找到docker-compose，请先安装docker-compose"
    exit 1
fi

# 检查网络连接
echo "检查网络连接..."
if ! ping -c 1 -W 2 8.8.8.8 &> /dev/null; then
    echo "警告: 网络连接可能有问题，构建可能会失败"
fi

# 停止并移除旧容器（如果存在）
echo "清理旧容器..."
docker-compose down || true

# 构建并启动新容器
echo "构建并启动网站容器..."
# 直接构建Docker镜像
docker build -t mr-stone-website .

# 如果构建成功，运行容器
if [ $? -eq 0 ]; then
    echo "镜像构建成功，启动容器..."
    docker run -d --name mr-stone-website -p 9000:9000 -v $(pwd)/static:/app/static mr-stone-website
else
    echo "镜像构建失败，请检查错误信息"
    exit 1
fi

# 等待容器启动
echo "等待容器启动..."
sleep 5

# 检查容器状态
echo "容器状态:"
docker ps | grep mr-stone-website

echo "======================================"
echo "      部署完成！"
echo "      网站地址: http://localhost:9000"
echo "======================================" 