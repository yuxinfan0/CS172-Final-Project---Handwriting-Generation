import web.SSH.util as ssh

ssh.list_remote_files('/gemini/code/123/SDT/SSH')

ssh.upload_file('/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/ren.jpg', '/gemini/code/123/SDT/SSH')

ssh.download_file('/gemini/code/123/SDT/SSH/ren.jpg', '/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/web/SSH/server1')

ssh.list_remote_files('/gemini/code/123/SDT/SSH')