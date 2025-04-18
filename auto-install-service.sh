#!/bin/bash

# 自动安装服务脚本
# 为Mr Stone个人网站创建系统服务，确保重启后自动启动

echo "======================================"
echo "  安装Mr Stone个人网站自启动服务"
echo "======================================"

# 确保在正确的目录
cd "$(dirname "$0")"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
  echo "错误: 请使用root用户运行此脚本"
  echo "使用 sudo bash auto-install-service.sh"
  exit 1
fi

# 停止正在运行的服务
echo "停止正在运行的网站服务..."
pkill -f "docusaurus serve" || true
sleep 2

# 构建网站（如果需要）
if [ ! -d "build" ]; then
  echo "构建网站..."
  npm run build
fi

# 复制服务文件
echo "安装系统服务..."
cp mrstone-website.service /etc/systemd/system/

# 重新加载systemd配置
systemctl daemon-reload

# 启用并启动服务
systemctl enable mrstone-website.service
systemctl start mrstone-website.service

# 检查服务状态
echo "服务状态:"
systemctl status mrstone-website.service --no-pager

echo "======================================"
echo "      安装完成！"
echo "      网站地址: http://localhost:9000"
echo "      服务已设置为开机自动启动"
echo "======================================"
echo ""
echo "管理命令:"
echo "  - 查看状态: systemctl status mrstone-website.service"
echo "  - 重新启动: systemctl restart mrstone-website.service"
echo "  - 停止服务: systemctl stop mrstone-website.service"
echo "  - 查看日志: journalctl -u mrstone-website.service"
echo "======================================" 