import logging
import os
import time

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建临时目录
TEMP_DIR = "temp_images"
os.makedirs(TEMP_DIR, exist_ok=True)

# 文件过期时间（秒）
FILE_EXPIRE_TIME = 120

def cleanup_temp_files():
    now = time.time()
    for filename in os.listdir(TEMP_DIR):
        filepath = os.path.join(TEMP_DIR, filename)
        if os.path.isfile(filepath):
            file_creation_time = os.path.getctime(filepath)
            if now - file_creation_time > FILE_EXPIRE_TIME:
                try:
                    os.remove(filepath)
                    logger.info(f"Deleted expired file: {filename}")
                except Exception as e:
                    logger.error(f"Failed to delete file {filename}: {e}")