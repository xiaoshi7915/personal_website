FROM node:16-alpine

# 创建应用目录
WORKDIR /app

# 首先复制依赖文件
COPY package.json ./

# 安装依赖
RUN npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露9000端口
EXPOSE 9000

# 启动服务
CMD ["npm", "run", "serve"] 