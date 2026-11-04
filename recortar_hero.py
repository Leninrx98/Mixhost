# -*- coding: utf-8 -*-
import os
from PIL import Image

base_public = "public"
base_photos = os.path.join(base_public, "Fotos Mixy")
output_dir = os.path.join(base_public, "mixi_hero")
os.makedirs(output_dir, exist_ok=True)

sequence_files = [
    ("Mixi place holder .png", False),
    ("Mixi placeholder 1.5.png", True),
    ("Mixi place holder 2.png", False),
    ("Mixi placeholder 2.5.png", True),
    ("Mixi place holder 3.png", False),
    ("Mixi placeholder 3.5.png", True),
    ("Mixi place holder 4.png", False),
    ("Mixi placeholder 4.5.png", True)
]

def align_and_center_strict(img_path, is_new, target_size=(1024, 1024)):
    with Image.open(img_path) as img:
        img = img.convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            r, g, b, a = item
            if r < 65 and g < 65 and b < 65 and abs(r - g) < 20 and abs(g - b) < 20:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        img.putdata(newData)

        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)

        # Aumentamos la escala interna del personaje dentro del lienzo 1024x1024
        max_dim = 830 if is_new else 980
        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
        offset_x = (target_size[0] - img.width) // 2
        offset_y = (target_size[1] - img.height) // 2
        
        canvas.paste(img, (offset_x, offset_y), img)
        return canvas

print("Re-escalando siluetas internas para aprovechar el espacio...")
for idx, (file_name, is_new) in enumerate(sequence_files, start=1):
    full_path = os.path.join(base_photos, file_name)
    if os.path.exists(full_path):
        processed = align_and_center_strict(full_path, is_new)
        out_file = os.path.join(output_dir, f"frame_{idx}.png")
        processed.save(out_file, "PNG")
        print(f"Frame {idx} ajustado correctamente.")

print("¡Procesamiento completo!")
