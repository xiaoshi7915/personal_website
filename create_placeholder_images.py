#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 创建占位图片脚本

from PIL import Image, ImageDraw, ImageFont
import os

# 确保目录存在
os.makedirs('static/img/langchain', exist_ok=True)
os.makedirs('static/img/multimodal', exist_ok=True)

# 字体设置 - 使用系统默认
try:
    # 尝试使用系统字体
    font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    if not os.path.exists(font_path):
        font_path = '/usr/share/fonts/dejavu/DejaVuSans.ttf'
    if not os.path.exists(font_path):
        # 如果找不到特定字体，使用默认
        font = ImageFont.load_default()
    else:
        font = ImageFont.truetype(font_path, 24)
except:
    # 如果加载失败，使用默认
    font = ImageFont.load_default()

# 图片尺寸
width, height = 800, 400

# LangChain图片
langchain_images = [
    "langchain-overview.png", 
    "langchain-chains.png",
    "langchain-agents.png", 
    "langchain-rag.png",
    "langchain-ecosystem.png"
]

# 多模态图片
multimodal_images = [
    "multimodal-overview.png",
    "gpt4v-example.png",
    "gemini-example.png",
    "medical-multimodal.png",
    "customer-service.png",
    "fusion-architecture.png"
]

# 创建LangChain图片
for img_name in langchain_images:
    img = Image.new('RGB', (width, height), color = (73, 109, 137))
    d = ImageDraw.Draw(img)
    title = img_name.replace('.png', '').replace('-', ' ').title()
    d.text((width/2-150, height/2), f"{title}\n占位图片", font=font, fill=(255, 255, 255))
    img.save(f"static/img/langchain/{img_name}")
    print(f"Created: static/img/langchain/{img_name}")

# 创建多模态图片
for img_name in multimodal_images:
    img = Image.new('RGB', (width, height), color = (120, 80, 140))
    d = ImageDraw.Draw(img)
    title = img_name.replace('.png', '').replace('-', ' ').title()
    d.text((width/2-150, height/2), f"{title}\n占位图片", font=font, fill=(255, 255, 255))
    img.save(f"static/img/multimodal/{img_name}")
    print(f"Created: static/img/multimodal/{img_name}")

print("所有占位图片已创建完成！") 