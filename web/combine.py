from PIL import Image, ImageOps
import os

import numpy as np
from PIL import Image

# image_folder = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/zcb_input"
image_folder = "/Users/fanyuxin/Desktop/ShanghiTech/2024_autumn/计算机视觉/Project/web/character_dict"

# Target phrase to render
phrase = "人才力气大才大"

# Function to find image paths for each character in the phrase

def combine(phrase):

    def find_images_for_phrase(phrase, folder):
        images = []
        for char in phrase:
            char_filename = f"{char}.png"
            char_path = os.path.join(folder, char_filename)
            if os.path.exists(char_path):
                images.append(char_path)
            else:
                print(f"Image for '{char}' not found in {folder}.")
        return images

    transform_matrix = np.zeros((len(phrase), 4))
    transform_matrix[:,0] = np.random.normal(1,0.05,len(phrase))
    transform_matrix[:,1] = np.random.normal(0,5,len(phrase))
    transform_matrix[:,2] = np.random.normal(0,15,len(phrase))
    transform_matrix[:,3] = np.random.normal(0,50,len(phrase))
    transform_matrix = transform_matrix.tolist()

    # Ensure the transformation matrix matches the phrase length
    assert len(transform_matrix) == len(
        phrase), "Transformation matrix must match the phrase length."

    # Find images
    image_paths = find_images_for_phrase(phrase, image_folder)


    def combine_images_with_pixel_blending(images, transform_matrix, max_line_width, line_spacing=50):
        x_offset = 0  # Starting x-offset
        y_offset = 0  # Starting y-offset
        line_height = 0  # Height of the current line
        max_width = 0
        total_height = 0

        transformed_images = []
        for i, img in enumerate(images):
            if isinstance(img, str):
                img = Image.open(img)
            scale, rotation, translate_x, translate_y = transform_matrix[i]
            translate_x = int(translate_x)
            translate_y = int(translate_y)

            # Apply scaling
            width, height = img.size
            new_size = (int(width * scale), int(height * scale))
            img = img.resize(new_size, Image.Resampling.LANCZOS)

            # Apply rotation
            img = img.rotate(rotation, expand=True, fillcolor="white")

            # Ensure image has an alpha channel for blending
            img = img.convert("RGBA")

            # Check if we need to wrap to the next line
            if x_offset + img.size[0] > max_line_width:
                x_offset = 0
                y_offset += line_height+line_spacing  # Move down by the height of the tallest image in the line
                line_height = 0  # Reset line height for the new line

            # Update line height
            line_height = max(line_height, img.size[1])

            # Append transformed image with its position
            transformed_images.append((img, x_offset, y_offset))

            # Update offsets for the next image
            x_offset += img.size[0] + translate_x
            max_width = max(max_width, x_offset)
            total_height = max(total_height, y_offset + line_height)

        # Create a blank RGBA canvas for the combined image
        canvas = Image.new("RGBA", (max_line_width, total_height),
                        (255, 255, 255, 255))  # White background

        # Convert canvas to numpy array for faster processing
        canvas_array = np.array(canvas)

        # Place transformed images onto the canvas with pixel-level blending using numpy
        for img, x_pos, y_pos in transformed_images:
            img_array = np.array(img)  # Convert image to numpy array
            h, w, _ = img_array.shape

            # Extract the region from the canvas where the current image will be placed
            canvas_region = canvas_array[y_pos:y_pos + h, x_pos:x_pos + w]

            # Calculate brightness for blending
            canvas_brightness = 0.299 * canvas_region[:, :, 0] + \
                0.587 * canvas_region[:, :, 1] + \
                0.114 * canvas_region[:, :, 2]
            img_brightness = 0.299 * img_array[:, :, 0] + \
                0.587 * img_array[:, :, 1] + \
                0.114 * img_array[:, :, 2]

            # Create a mask where the image pixel is darker than the canvas pixel
            mask = img_brightness < canvas_brightness

            # Blend the image into the canvas
            canvas_region[mask] = img_array[mask]

            # Update the canvas region
            canvas_array[y_pos:y_pos + h, x_pos:x_pos + w] = canvas_region

        # Convert numpy array back to PIL Image
        final_image = Image.fromarray(canvas_array, mode="RGBA")
        return final_image


    # Specify the maximum line width for wrapping (e.g., 800 pixels)
    # max_line_width = 6000

    # m_len = Image.open(image_paths[0]).size[0]
    m_len = 256
    max_line_width = min(m_len * (8), 5000)
    linespacing = 50

    # Generate the combined image with pixel blending
    if image_paths:
        try:
            combined_image = combine_images_with_pixel_blending(
                image_paths, transform_matrix, max_line_width,line_spacing=linespacing)
            output_path = "./combined_transformed_phrase_with_pixel_blending.png"
            combined_image.save(output_path)
            print(f"Output saved to {output_path}")
        except Exception as e:
            print(f"Error during image generation: {e}")
    else:
        print("No images were found for the given phrase.")

    return output_path


if __name__ == "__main__":
    combine(phrase)