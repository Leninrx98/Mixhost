# -*- coding: utf-8 -*-
import os
import json
from PIL import Image

base_input = "public/Fotos Mixy"
base_output = "public/emotes"

packs = [
    {
        "name": "glo",
        "prefix": "Pac de Glo ",
        "ext": ".jfif",
        "total_frames": 4,
        "rows": 2,
        "cols": 3
    },
    {
        "name": "roxy",
        "prefix": "Pac Roxy ",
        "ext": ".jfif",
        "total_frames": 6,
        "rows": 2,
        "cols": 3
    },
    {
        "name": "mixi",
        "prefix": "Pac de emotes Mixi ",
        "ext": ".jfif",
        "total_frames": 5,
        "rows": 2,
        "cols": 3
    }
]

def make_transparent(img):
    img = img.convert("RGBA")
    datas = img.getdata()
    newData = []
    for item in datas:
        r, g, b, a = item
        # Filtro de tolerancia para capturar blancos y grises claros de Glo y Mixi
        if r > 160 and g > 160 and b > 160 and abs(r - g) < 25 and abs(g - b) < 25:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    return img

frame_counts = {"glo": {}, "roxy": {}, "mixi": {}}

for pack in packs:
    for frame_idx in range(1, pack["total_frames"] + 1):
        img_path = os.path.join(base_input, f"{pack['prefix']}{frame_idx}{pack['ext']}")
        
        if not os.path.exists(img_path):
            continue
            
        with Image.open(img_path) as img:
            width, height = img.size
            cell_w = width // pack["cols"]
            cell_h = height // pack["rows"]
            
            emote_counter = 1
            for r in range(pack["rows"]):
                for c in range(pack["cols"]):
                    left = c * cell_w
                    top = r * cell_h
                    right = (c + 1) * cell_w
                    bottom = (r + 1) * cell_h
                    
                    cropped = img.crop((left, top, right, bottom))
                    transparent_cropped = make_transparent(cropped)
                    
                    out_dir = os.path.join(base_output, pack["name"], f"emote_{emote_counter}")
                    os.makedirs(out_dir, exist_ok=True)
                    out_file = os.path.join(out_dir, f"frame_{frame_idx}.png")
                    transparent_cropped.save(out_file, "PNG")
                    
                    emote_key = f"emote_{emote_counter}"
                    frame_counts[pack["name"]][emote_key] = frame_counts[pack["name"]].get(emote_key, 0) + 1
                    
                    emote_counter += 1

print("¡Procesamiento completo!")
print("Frames detectados por emote:")
print(json.dumps(frame_counts, indent=2))

