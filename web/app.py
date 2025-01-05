from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from PIL import Image, ImageDraw, ImageFont
import io
import base64
import traceback
import glob
import hashlib
from datetime import datetime

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


def text_to_image(text, width=256, height=256, style_images = [], style_texts = []):
    if text == '人':
        image_path = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/ren.jpg"
    elif text == '才':
        image_path = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/cai.jpg"
    elif text == '力':
        image_path = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/li.jpg"
    elif text == '气':
        image_path = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/qi.jpg"
    elif text == '大':
        image_path = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/da.jpg"
    else:
        """
        临时函数：将文本转换为图片
        实际项目中，这里将被替换为模型调用
        """
        # 创建一个白色背景的图片
        img = Image.new('RGB', (width, height), color='white')
        d = ImageDraw.Draw(img)
        
        # 使用默认字体，实际项目中可以使用更好的手写字体
        try:
            font = ImageFont.truetype('Arial', 80)
        except:
            font = ImageFont.load_default()
        
        # 计算文本大小
        bbox = d.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # 居中绘制文本
        x = (width - text_width) / 2
        y = (height - text_height) / 2
        d.text((x, y), text, font=font, fill='black')
        
        # 将图片转换为base64字符串
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        return base64.b64encode(img_byte_arr).decode()
    
    # 读取图片并转换为PNG格式
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode()

def combine_images(images):
    """
    将多个图片水平拼接
    """
    # 将base64字符串转换回图片对象
    pil_images = []
    for img_str in images:
        try:
            # 移除MIME类型前缀
            base64_data = img_str.split(',')[1]
            img_data = base64.b64decode(base64_data)
            img = Image.open(io.BytesIO(img_data))
            pil_images.append(img)
        except Exception as e:
            print(f"Error processing image: {str(e)}")
            continue
    
    if not pil_images:
        return ""
    
    # 计算总宽度和最大高度
    total_width = sum(img.width for img in pil_images)
    max_height = max(img.height for img in pil_images)
    
    # 创建新图片
    combined_image = Image.new('RGB', (total_width, max_height), color='white')
    
    # 拼接图片
    x_offset = 0
    for img in pil_images:
        combined_image.paste(img, (x_offset, (max_height - img.height) // 2))
        x_offset += img.width
    
    # 转换为base64字符串
    img_byte_arr = io.BytesIO()
    combined_image.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    return f'data:image/png;base64,{base64.b64encode(img_byte_arr).decode()}'

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
            img_base64 = text_to_image(word, style_images=style_images, style_texts=style_texts)
            word_images.append(f'data:image/jpeg;base64,{img_base64}')
        
        final_image = combine_images(word_images)
        
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
        
        # 从数据库获取用户的所有样式，按创建时间排序
        styles = StyleImage.query.filter_by(user_id=user_id).order_by(StyleImage.created_at.desc()).all()
        
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

@app.route('/save_style', methods=['POST'])
def save_style():
    try:
        user_id = get_user_id()
        
        if 'image' not in request.files:
            return jsonify({'error': '没有上传图片'}), 400
            
        image = request.files['image']
        text = request.form.get('text', '').strip()
        
        # 保存图片
        filename = f'style_{user_id}_{datetime.utcnow().strftime("%Y%m%d%H%M%S")}.png'
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
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

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5123) 