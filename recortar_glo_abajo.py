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

def clean_bottom_row_floodfill(img):
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Evalua si un pixel pertenece al fondo (claros, grises o sombras de la base)
    def is_background_pixel(r, g, b):
        # Fondos claros/grises
        if r > 110 and g > 110 and b > 110:
            return True
        # Sombras grises/azuladas de la base (donde R, G y B son similares y no es el azul intenso del pulpo)
        if r > 55 and g > 55 and b > 55 and abs(r - g) < 20 and abs(g - b) < 20:
            # Evitar tocar morados/azules saturados del personaje
            if not (b > r + 30):
                return True
        return False

    visited = set()
    queue = []

    # Iniciar la busqueda unicamente desde los bordes exteriores de la imagen
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.pop(0)
        if (x, y) in visited:
            continue
        visited.add((x, y))

        if 0 <= x < width and 0 <= y < height:
            r, g, b, a = pixels[x, y]
            if is_background_pixel(r, g, b):
                pixels[x, y] = (255, 255, 255, 0)
                # Extender a los vecinos directos
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                        queue.append((nx, ny))

    return img

target_emotes = [4, 5, 6]

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
                if emote_counter in target_emotes:
                    left = c * cell_w
                    top = r * cell_h
                    right = (c + 1) * cell_w
                    bottom = (r + 1) * cell_h
                    
                    cropped = img.crop((left, top, right, bottom))
                    cleaned = clean_bottom_row_floodfill(cropped)
                    
                    out_dir = os.path.join(base_output, f"emote_{emote_counter}")
                    os.makedirs(out_dir, exist_ok=True)
                    out_file = os.path.join(out_dir, f"frame_{frame_idx}.png")
                    cleaned.save(out_file, "PNG")
                    
                emote_counter += 1

print("¡Procesamiento de los emotes 4, 5 y 6 completado!")
