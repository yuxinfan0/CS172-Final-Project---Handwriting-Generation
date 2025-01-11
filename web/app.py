from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from PIL import Image, ImageDraw, ImageFont, ImageOps
import io
import base64
import traceback
import glob
import hashlib
from datetime import datetime
from SSH.util import *
from gradio_client import Client, handle_file
import combine
# from random import *
# import time


app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max-limit
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///styles.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class StyleImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    image_path = db.Column(db.String(255), nullable=False)
    text = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.String(50), nullable=False)  # 存储用户的IP哈希
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'image_path': self.image_path,
            'text': self.text,
            'created_at': self.created_at.isoformat()
        }

class GeneratedImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    image_path = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'image_path': self.image_path,
            'created_at': self.created_at.isoformat()
        }

def get_user_id():
    """获取基于用户IP的唯一标识"""
    ip = request.remote_addr
    return hashlib.md5(ip.encode()).hexdigest()[:8]

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def image_to_base64(image_path):
    """将图片文件转换为base64字符串"""
    with open(image_path, 'rb') as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode()
        return f'data:image/jpeg;base64,{encoded_string}'

# def text_to_image(text, style_images, style_texts, width=256, height=256):
#TODO: 将样式图片上传到服务器
def load_style_image(style_image_path = [], style_text = []):
    for path in style_image_path:
        if not upload_file(path, '/gemini/code/123/SDT/SSH', id = 1):
            print(f"Failed to upload {path} to the server.")
            return False
    #TODO: 执行ssh命令，微调模型。
    return True

def text_to_image(text, width=256, height=256, style_image_path=[], style_text=[]):
    
    # image_folder = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/zcb_input"
    image_folder = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/web/character_dict"
    char_filename = f"{text}.png"
    char_path = os.path.join(image_folder, char_filename)
    if os.path.exists(char_path):
        with open(char_path, 'rb') as f:
            img_data = base64.b64encode(f.read()).decode()
            # randsleep = randint(0,2)
            # time.sleep(randsleep)
            return f'data:image/jpeg;base64,{img_data}'
    else:
        print(f"Image for '{text}' not found in {image_folder}.")
        return None

    # def find_images_for_phrase(phrase, folder):
    #     images = []
    #     for char in phrase:
    #         char_filename = f"{char}.jpg"
    #         char_path = os.path.join(folder, char_filename)
    #         if os.path.exists(char_path):
    #             images.append(char_path)
    #         else:
    #             print(f"Image for '{char}' not found in {folder}.")
    #     return images
    

    
# def text_to_image(text, width=256, height=256, style_image_path=[], style_text=[]):
#     # # 打印接收到的样式图片路径，用于调试
#     # print("Style image paths:", style_image_path)
#     # print("Style texts:", style_text)
    
#     # # 将样式图片转换为base64
#     # base64_style_images = []
#     # for path in style_image_path:
#     #     try:
#     #         with open(path, 'rb') as f:
#     #             img_data = base64.b64encode(f.read()).decode()
#     #             base64_style_images.append(f'data:image/png;base64,{img_data}')
#     #     except Exception as e:
#     #         print(f"Error reading image {path}: {str(e)}")
#     #         continue
            
#     # # 测试：直接返回样式图片的组合
#     # if text == '0':
#     #     if base64_style_images:
#     #         combined = combine_images(base64_style_images)
#     #         # 移除 MIME 类型前缀
#     #         return combined

#     #TODO: 输入text，执行ssh命令，等待服务器返回图片到本地

#     # base64_style_images 为base64图片列表
#     # style_text 为样式文字列表
#     # TODO: 输入模型处理（如果未调整模型则输入上述list，否则用模型处理图片，返回base64字符串）

#     if text == '人':
#         image_path = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/ren.jpg"
#     elif text == '才':
#         image_path = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/cai.jpg"
#     elif text == '力':
#         image_path = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/li.jpg"
#     elif text == '气':
#         image_path = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/qi.jpg"
#     elif text == '大':
#         image_path = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/da.jpg"
#     else:
#         """
#         临时函数：将文本转换为图片
#         实际项目中，这里将被替换为模型调用
#         """
#         # 创建一个白色背景的图片
#         img = Image.new('RGB', (width, height), color='white')
#         d = ImageDraw.Draw(img)
        
#         # 使用默认字体，实际项目中可以使用更好的手写字体
#         try:
#             font = ImageFont.truetype('Arial', 80)
#         except:
#             font = ImageFont.load_default()
        
#         # 计算文本大小
#         bbox = d.textbbox((0, 0), text, font=font)
#         text_width = bbox[2] - bbox[0]
#         text_height = bbox[3] - bbox[1]
        
#         # 居中绘制文本
#         x = (width - text_width) / 2
#         y = (height - text_height) / 2
#         d.text((x, y), text, font=font, fill='black')
        
#         # 将图片转换为base64字符串
#         img_byte_arr = io.BytesIO()
#         img.save(img_byte_arr, format='PNG')
#         img_byte_arr = img_byte_arr.getvalue()
#         return f'data:image/png;base64,{base64.b64encode(img_byte_arr).decode()}'
    
#     # 读取图片并转换为PNG格式
#     with open(image_path, 'rb') as f:
#         img_data = base64.b64encode(f.read()).decode()
#         return f'data:image/png;base64,{img_data}'

# 将多个图片水平拼接，接受base64字符串的列表，返回单个base64字符串
# def combine_images(images):

#     #TODO: 应用实际拼接模型，可使用服务器缓存，避免重复传输图片。

#     """
#     将多个图片水平拼接
#     """
#     # 将base64字符串转换回图片对象
#     pil_images = []
#     for img_str in images:
#         try:
#             # 移除MIME类型前缀
#             base64_data = img_str.split(',')[1]
#             img_data = base64.b64decode(base64_data)
#             img = Image.open(io.BytesIO(img_data))
#             pil_images.append(img)
#         except Exception as e:
#             print(f"Error processing image: {str(e)}")
#             continue
    
#     if not pil_images:
#         return ""
    
#     # 计算总宽度和最大高度
#     total_width = sum(img.width for img in pil_images)
#     max_height = max(img.height for img in pil_images)
    
#     # 创建新图片
#     combined_image = Image.new('RGB', (total_width, max_height), color='white')
    
#     # 拼接图片
#     x_offset = 0
#     for img in pil_images:
#         combined_image.paste(img, (x_offset, (max_height - img.height) // 2))
#         x_offset += img.width
    
#     # 转换为base64字符串
#     img_byte_arr = io.BytesIO()
#     combined_image.save(img_byte_arr, format='PNG')
#     img_byte_arr = img_byte_arr.getvalue()
#     return f'data:image/png;base64,{base64.b64encode(img_byte_arr).decode()}'

def combine_images(phrase):
    output_path = combine.combine(phrase)
    with open(output_path, 'rb') as f:
        img_data = base64.b64encode(f.read()).decode()
    return f'data:image/png;base64,{img_data}'

def artify_image(image_path, text_prompt):
    # TODO: 应用实际艺术化模型，id = 2
    # try:
    #     # 读取图片
    #     img = Image.open(io.BytesIO(base64.b64decode(image_path.split(',')[1])))
        
    #     if text_prompt == "0":
    #         # 黑白二值化
    #         img = img.convert('L').point(lambda x: 0 if x < 128 else 255, '1')
    #     elif text_prompt == "1":
    #         # 颜色反转
    #         if img.mode == 'RGBA':
    #             r, g, b, a = img.split()
    #             rgb_image = Image.merge('RGB', (r, g, b))
    #             inverted_rgb = ImageOps.invert(rgb_image)
    #             r2, g2, b2 = inverted_rgb.split()
    #             img = Image.merge('RGBA', (r2, g2, b2, a))
    #         else:
    #             img = ImageOps.invert(img)
        
    #     # 转换回base64
    #     buffered = io.BytesIO()
    #     img.save(buffered, format="PNG")
    #     img_str = base64.b64encode(buffered.getvalue()).decode()
    #     return f'data:image/png;base64,{img_str}'
    # except Exception as e:
    #     print(f"Error in artify_image: {str(e)}")
    #     return None
    try:
        # 从base64字符串读取图片
        img_data = base64.b64decode(image_path.split(',')[1])
        img_path = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_input.png')
        with open(img_path, 'wb') as f:
            f.write(img_data)
            
        image = handle_file(img_path)
        # fixed_prompt = "don't change the text. the white part is the background, you can change the color of the background, but ALWAYS keep the text!!! you may change the color"
        fixed_prompt = "don't change the black lines, make it obvious the white part is the background, you can change the color of the background, but ALWAYS keep the text!!! you may change the color."
        prompt = fixed_prompt + text_prompt
        # print('success')
        client = Client("hysts/ControlNet-v1-1")
        result = client.predict(
            image=image,
            prompt= prompt,
            additional_prompt = "best quality, extremely detailed",
            negative_prompt="longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality",
            num_images=1,
            image_resolution=768,
            preprocess_resolution=512,
            num_steps=20,
            guidance_scale=9,
            seed=0,
            preprocessor_name="HED",
            api_name="/scribble"
        )
        
        # 读取生成的图片并转换为base64
        output_path = result[1]['image']
        with open(output_path, 'rb') as f:
            output_data = f.read()
        output_base64 = base64.b64encode(output_data).decode()
        
        # 清理临时文件
        os.remove(img_path)
        os.remove(output_path)
        
        return f'data:image/png;base64,{output_base64}'
        
    except Exception as e:
        print(f"Error in artify_image: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/delete_style', methods=['POST'])
def delete_style():
    try:
        data = request.get_json()
        style_id = data.get('id')
        user_id = get_user_id()
        
        # 查找并删除样式
        style = StyleImage.query.filter_by(id=style_id, user_id=user_id).first()
        if style:
            # 删除文件
            if os.path.exists(style.image_path):
                os.remove(style.image_path)
            # 从数据库中删除记录
            db.session.delete(style)
            db.session.commit()
            return jsonify({'success': True})
        return jsonify({'error': '未找到样式'}), 404
    except Exception as e:
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/cleanup', methods=['POST'])
def cleanup():
    try:
        user_id = get_user_id()
        
        # 删除该用户的所有样式
        styles = StyleImage.query.filter_by(user_id=user_id).all()
        for style in styles:
            if os.path.exists(style.image_path):
                os.remove(style.image_path)
            db.session.delete(style)
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/process', methods=['POST'])
def process():
    try:
        user_id = get_user_id()
        text = request.form.get('text', '').strip()
        if not text:
            return jsonify({'error': '没有输入要转换的文字'}), 400
        
        # 获取用户的样式图片和文字
        styles = StyleImage.query.filter_by(user_id=user_id).all()
        style_images = [style.image_path for style in styles]
        style_texts = [style.text for style in styles]
        
        # 生成图片
        if all('\u0000' <= char <= '\u007F' for char in text):
            words = text.split()
        else:
            words = list(text)
            
        word_images = []
        for word in words:
            img_base64 = text_to_image(word, style_image_path=style_images, style_text=style_texts)
            # word_images.append(f'data:image/jpeg;base64,{img_base64}')
            word_images.append(img_base64)
        
        # final_image = combine_images(word_images)
        final_image = combine_images(text)
        
        return jsonify({
            'word_images': word_images,
            'final_image': final_image
        })
    except Exception as e:
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/get_styles', methods=['GET'])
def get_styles():
    try:
        user_id = get_user_id()
        
        # 从数据库获取用户的所有样式，按创建时间正序排序
        styles = StyleImage.query.filter_by(user_id=user_id).order_by(StyleImage.created_at.asc()).all()
        
        result = []
        for i, style in enumerate(styles):
            try:
                # 检查文件是否存在
                if not os.path.exists(style.image_path):
                    # 如果文件不存在，从数据库中删除记录
                    db.session.delete(style)
                    continue
                
                # 读取图片并转换为base64
                with open(style.image_path, 'rb') as f:
                    img_data = base64.b64encode(f.read()).decode()
                    
                result.append({
                    'id': style.id,
                    'index': i,
                    'image': f'data:image/png;base64,{img_data}',
                    'text': style.text
                })
            except Exception as e:
                print(f"Error processing style {style.id}: {str(e)}")
                continue
        
        # 如果有记录被删除，提交数据库更改
        if len(styles) != len(result):
            db.session.commit()
        
        return jsonify({'styles': result})
    except Exception as e:
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/update_style_text', methods=['POST'])
def update_style_text():
    try:
        data = request.get_json()
        style_id = data.get('id')
        text = data.get('text', '').strip()
        user_id = get_user_id()
        
        # 查找并更新样式
        style = StyleImage.query.filter_by(id=style_id, user_id=user_id).first()
        if style:
            style.text = text
            db.session.commit()
            return jsonify({'success': True})
        return jsonify({'error': '未找到样式'}), 404
    except Exception as e:
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

def get_user_upload_folder(user_id):
    """获取用户特定的上传文件夹路径"""
    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], user_id)
    os.makedirs(user_folder, exist_ok=True)
    return user_folder

@app.route('/save_style', methods=['POST'])
def save_style():
    try:
        user_id = get_user_id()
        user_folder = get_user_upload_folder(user_id)
        
        if 'image' not in request.files:
            return jsonify({'error': '没有上传图片'}), 400
            
        image = request.files['image']
        text = request.form.get('text', '').strip()
        
        # 保存图片到用户特定的文件夹
        filename = f'style_{datetime.utcnow().strftime("%Y%m%d%H%M%S")}.png'
        image_path = os.path.join(user_folder, filename)
        image.save(image_path)
        
        # 保存到数据库
        style = StyleImage(
            image_path=image_path,
            text=text,
            user_id=user_id
        )
        db.session.add(style)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'style': {
                'id': style.id,
                'image_path': image_path,
                'text': text
            }
        })
    except Exception as e:
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/save_generated', methods=['POST'])
def save_generated():
    try:
        user_id = get_user_id()
        user_folder = get_user_upload_folder(user_id)
        data = request.get_json()
        image_data = data.get('image', '').split(',')[1]  # 移除 MIME 类型前缀
        
        # 将 base64 转换为图片并保存到用户特定的文件夹
        filename = f'generated_{datetime.utcnow().strftime("%Y%m%d%H%M%S")}.png'
        image_path = os.path.join(user_folder, filename)
        
        with open(image_path, 'wb') as f:
            f.write(base64.b64decode(image_data))
        
        # 保存到数据库
        generated = GeneratedImage(
            image_path=image_path,
            user_id=user_id
        )
        db.session.add(generated)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/get_generated', methods=['GET'])
def get_generated():
    try:
        user_id = get_user_id()
        
        # 获取用户生成的所有图片
        images = GeneratedImage.query.filter_by(user_id=user_id).order_by(GeneratedImage.created_at.desc()).all()
        
        result = []
        for image in images:
            try:
                if not os.path.exists(image.image_path):
                    db.session.delete(image)
                    continue
                    
                with open(image.image_path, 'rb') as f:
                    img_data = base64.b64encode(f.read()).decode()
                    
                result.append({
                    'id': image.id,
                    'image': f'data:image/png;base64,{img_data}',
                    'created_at': image.created_at.isoformat()
                })
            except Exception as e:
                print(f"Error processing image {image.id}: {str(e)}")
                continue
                
        if len(images) != len(result):
            db.session.commit()
            
        return jsonify({'images': result})
    except Exception as e:
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/artify', methods=['POST'])
def artify():
    try:
        data = request.get_json()
        image_data = data.get('image')
        text_prompt = data.get('text_prompt')
        
        if not image_data or not text_prompt:
            return jsonify({'error': '缺少必要参数'}), 400
            
        result = artify_image(image_data, text_prompt)
        if result:
            return jsonify({'image': result})
        else:
            return jsonify({'error': '处理图片失败'}), 500
    except Exception as e:
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/delete_generated', methods=['POST'])
def delete_generated():
    try:
        data = request.get_json()
        image_id = data.get('id')
        user_id = get_user_id()
        
        # 查找并删除生成的图片
        image = GeneratedImage.query.filter_by(id=image_id, user_id=user_id).first()
        if image:
            # 删除文件
            if os.path.exists(image.image_path):
                os.remove(image.image_path)
            # 从数据库中删除记录
            db.session.delete(image)
            db.session.commit()
            return jsonify({'success': True})
        return jsonify({'error': '未找到图片'}), 404
    except Exception as e:
        print("Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

with app.app_context():
    db.create_all()

# if __name__ == '__main__':
#     app.run(debug=True, port=5123) 

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5123, debug=True)