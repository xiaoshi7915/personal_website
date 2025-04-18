#!/bin/bash

# 网站启动脚本
# 用于在生产环境中启动个人网站服务

echo "======================================"
echo "      启动mr stone的个人网站服务"
echo "======================================"

# 确保在正确的目录
cd "$(dirname "$0")"

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查yarn
if ! command -v yarn &> /dev/null; then
    echo "警告: 未找到yarn，将使用npm"
    USE_NPM=true
else
    USE_NPM=false
fi

# 安装依赖
echo "正在安装依赖..."
if [ "$USE_NPM" = true ]; then
    npm install
else
    yarn install
fi

# 构建项目
echo "正在构建项目..."
if [ "$USE_NPM" = true ]; then
    npm run build
else
    yarn build
fi

# 启动服务
echo "正在启动服务器(端口9000)..."
if [ "$USE_NPM" = true ]; then
    npm run serve
else
    yarn serve
fi 