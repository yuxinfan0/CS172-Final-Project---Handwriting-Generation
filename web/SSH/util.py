import paramiko
import logging
import os
from pathlib import Path

# 设置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def create_ssh_client(id = 1):
    """创建SSH客户端"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    if id == 1:
        # 连接参数
        hostname = 'direct.virtaicloud.com'
        username = 'root1911@root@ssh-177918c036b28aa45f07a1109f0fc7ce.n2gc24m6aeeg'
        password = '123456'
        port = 30022
    elif id == 2:
        pass
        # hostname = 'direct.virtaicloud.com'
        # username = 'root1911@root@ssh-177918c036b28aa45f07a1109f0fc7ce.n2gc24m6aeeg'
        # password = '123456'
        # port = 30022
    
    try:
        client.connect(
            hostname=hostname,
            port=port,
            username=username,
            password=password,
            timeout=10,
            allow_agent=False,
            look_for_keys=False
        )
        return client
    except Exception as e:
        logger.error(f"SSH连接错误: {str(e)}")
        return None

def upload_file(local_path, remote_path, id = 1):
    """上传文件到远程服务器"""
    client = create_ssh_client(id)
    if not client:
        return False
    
    try:
        # 创建SFTP会话
        sftp = client.open_sftp()
        
        # 确保远程目录存在
        try:
            sftp.mkdir('/gemini/code/123/SDT/SSH')
        except IOError:
            pass  # 目录已存在
        
        # 上传文件
        remote_full_path = os.path.join('/gemini/code/123/SDT/SSH', os.path.basename(local_path))
        logger.info(f"正在上传文件: {local_path} -> {remote_full_path}")
        sftp.put(local_path, remote_full_path)
        logger.info("文件上传成功")
        return True
        
    except Exception as e:
        logger.error(f"文件上传错误: {str(e)}")
        return False
        
    finally:
        sftp.close()
        client.close()

def download_file(remote_path, local_dir, id = 1):
    """从远程服务器下载文件"""
    client = create_ssh_client(id)
    if not client:
        return False
    
    try:
        # 创建SFTP会话
        sftp = client.open_sftp()
        
        # 确保本地目录存在
        os.makedirs(local_dir, exist_ok=True)
        
        # 下载文件
        local_path = os.path.join(local_dir, os.path.basename(remote_path))
        logger.info(f"正在下载文件: {remote_path} -> {local_path}")
        sftp.get(remote_path, local_path)
        logger.info("文件下载成功")
        return True
        
    except Exception as e:
        logger.error(f"文件下载错误: {str(e)}")
        return False
        
    finally:
        sftp.close()
        client.close()

def list_remote_files(remote_dir, id = 1):
    """列出远程目录中的文件"""
    client = create_ssh_client(id)
    if not client:
        return []
    
    try:
        sftp = client.open_sftp()
        files = sftp.listdir(remote_dir)
        return files
    except Exception as e:
        logger.error(f"列出远程文件错误: {str(e)}")
        return []
    finally:
        sftp.close()
        client.close()

# 使用示例
if __name__ == "__main__":
    # 本地和远程路径
    LOCAL_DIR = '/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/web/SSH/server1'
    REMOTE_DIR = '/gemini/code/123/SDT/SSH'
    
    # 列出远程目录中的文件
    print("远程目录中的文件:")
    remote_files = list_remote_files(REMOTE_DIR, 1)
    for file in remote_files:
        print(f"- {file}")
    
    # 上传文件示例
    local_file = os.path.join(LOCAL_DIR, 'test.txt')
    if os.path.exists(local_file):
        upload_file(local_file, REMOTE_DIR, 1)
    
    # 下载文件示例
    remote_file = os.path.join(REMOTE_DIR, 'test.txt')
    download_file(remote_file, LOCAL_DIR, 1)