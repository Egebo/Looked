import base64
import io
from flask import Flask, request, jsonify
from rembg import remove
from PIL import Image, ImageStat

app = Flask(__name__)

def autocrop_image(img):
    """
    Crops the image to its non-transparent bounding box.
    """
    # Get bounding box of non-zero alpha
    bbox = img.getbbox()
    if bbox:
        return img.crop(bbox)
    return img

def get_contrasting_bg_color(img):
    """
    Calculates the brightness of the non-transparent pixels to 
    provide a contrasting background color (to prevent white T-shirts from 
    turning invisible on a white background).
    """
    try:
        # Split channels to use alpha as a perfect mask
        bands = img.split()
        if len(bands) == 4:
            r, g, b, a = bands
            stat = ImageStat.Stat(img, mask=a)
            mean_color = stat.mean
            
            if mean_color and len(mean_color) >= 3:
                # Perceived luminance formula
                luminance = 0.299 * mean_color[0] + 0.587 * mean_color[1] + 0.114 * mean_color[2]
                
                # If the clothing is very bright (e.g. white shirt), use a dark gray background
                if luminance > 210:
                    return (60, 60, 60, 255)
    except Exception as e:
        print("Luminance calculation failed", e)
        
    # Default to white background
    return (255, 255, 255, 255)

@app.route('/removebg', methods=['POST'])
def remove_background():
    try:
        data = request.json
        if not data or 'image_file_b64' not in data:
            return jsonify({"error": "Missing image_file_b64 in request JSON"}), 400

        # 1. Decode base64
        image_data = base64.b64decode(data['image_file_b64'])
        input_image = Image.open(io.BytesIO(image_data))

        # 2. Remove background using rembg
        # We pass the raw bytes to rembg for best results
        output_bytes = remove(image_data)
        
        # 3. Open the resulting image with Pillow to auto-crop the empty transparent space
        output_img = Image.open(io.BytesIO(output_bytes)).convert("RGBA")
        cropped_img = autocrop_image(output_img)

        # 4. Composite onto a dynamic contrasting background to prevent OpenAI transparency/contrast issues
        bg_color = get_contrasting_bg_color(cropped_img)
        bg = Image.new("RGBA", cropped_img.size, bg_color)
        bg.paste(cropped_img, (0, 0), cropped_img)
        final_img = bg.convert("RGB") # Convert to RGB to finalize the background

        # 5. Save to buffer and encode back to base64
        buffered = io.BytesIO()
        final_img.save(buffered, format="JPEG", quality=95)
        result_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return jsonify({
            "data": {
                "result_b64": result_b64
            }
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting local Rembg server on port 5000...")
    # Run locally
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)
