# -*- coding: utf-8 -*-
import os
from PIL import Image

base_input = "public/Fotos Mixy"
base_output = "public/emotes/glo"

pack = {
    "name": "glo",
    "prefix": "Pac de Glo ",
    "ext": ".jfif",
    "total_frames": 4,
    "rows": 2,
    "cols": 3
}

def remove_background_floodfill(img):
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Umbral para identificar el fondo claro/gris del recuadro
    def is_bg(r, g, b):
        return (r > 120 and g > 120 and b > 120) or (r > 90 and g > 90 and b > 90 and abs(r - g) < 15 and abs(g - b) < 15)

    visited = set()
    queue = []

    # Agregar los 4 bordes externos como puntos de inicio
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    # Algoritmo BFS para borrar solo desde afuera hacia adentro
    while queue:
        x, y = queue.pop(0)
        if (x, y) in visited:
            continue
        visited.add((x, y))

        if 0 <= x < width and 0 <= y < height:
            r, g, b, a = pixels[x, y]
            if is_bg(r, g, b):
                pixels[x, y] = (255, 255, 255, 0)
                # Inspeccionar vecinos adyacentes
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                        queue.append((nx, ny))

    return img

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
                cleaned = remove_background_floodfill(cropped)
                
                out_dir = os.path.join(base_output, f"emote_{emote_counter}")
                os.makedirs(out_dir, exist_ok=True)
                out_file = os.path.join(out_dir, f"frame_{frame_idx}.png")
                cleaned.save(out_file, "PNG")
                
                emote_counter += 1

print("¡Emotes de Glo recortados respetando el cuerpo del pulpo!")
