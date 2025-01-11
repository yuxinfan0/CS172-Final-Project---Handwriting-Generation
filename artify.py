from gradio_client import Client, handle_file

img_path = '/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/output.jpg'

# prompt = "Elegant single-colored artistic text, each letter intricately designed with unique SpongeBob-inspired patterns and subtle decorative elements, set against a clean and simple solid or gradient background to highlight the beauty and clarity of the text. The words' color should be red"
fixed_prompt = "clear and sharp result, single color blackground, no additional characters or patterns"
prompt = "make it black and white"
prompt = fixed_prompt + prompt
client = Client("hysts/ControlNet-v1-1")
result = client.predict(
#   image=handle_file('https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png'),
  image=handle_file(img_path),
  prompt=prompt,
  additional_prompt="best quality, extremely detailed",
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
print(result)

# [{'image': '/private/var/folders/t2/1klvg8p923g4zvbz8fb9_h9h0000gn/T/gradio/1f2b789d401435357a90a7905b90710075d32b9beda6f601b7adee3cbba43103/image.webp', 'caption': None}, 
#  {'image': '/private/var/folders/t2/1klvg8p923g4zvbz8fb9_h9h0000gn/T/gradio/d77d19e9fbe8a037fa7bbf0abd9f33921c48ef143f90bcdfd709f17d403d4247/image.webp', 'caption': None}]