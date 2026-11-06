# -*- coding: utf-8 -*-
import os
from PIL import Image

base_dir = os.path.join("public", "Fotos Mixy")
output_base = os.path.join("public", "avatars")

targets = [
    ("Variantes de Mixi para perfil.png", "mixi", ["classic", "shiny", "cyber", "fire"]),
    ("Variantes de Glo para perfil.png", "glo", ["classic", "shiny", "cyber", "fire"]),
    ("Variantes de Roxy para perfil.png", "roxy", ["classic", "shiny", "cyber", "fire"])
]

def process_grid(file_name, character_folder, skin_names):
    input_path = os.path.join(base_dir, file_name)
    if not os.path.exists(input_path):
        print(f"Error: No se encontro {input_path}")
        return

    char_dir = os.path.join(output_base, character_folder)
    os.makedirs(char_dir, exist_ok=True)

    with Image.open(input_path) as img:
        img = img.convert("RGBA")
        width, height = img.size
        
        half_w = width // 2
        half_h = height // 2
        
        crops = [
            (skin_names[0], (0, 0, half_w, half_h)),
            (skin_names[1], (half_w, 0, width, half_h)),
            (skin_names[2], (0, half_h, half_w, height)),
            (skin_names[3], (half_w, half_h, width, height))
        ]

        for skin_name, box in crops:
            cropped = img.crop(box)
            
            # Limpieza de fondo blanco/claro a transparente (RGBA)
            datas = cropped.getdata()
            newData = []
            for item in datas:
                r, g, b, a = item
                if r > 230 and g > 230 and b > 230:
                    newData.append((255, 255, 255, 0))
                else:
                    newData.append(item)
            cropped.putdata(newData)
            
            # Auto-crop de bordes transparentes sobrantes
            bbox = cropped.getbbox()
            if bbox:
                cropped = cropped.crop(bbox)

            out_file = os.path.join(char_dir, f"{skin_name}.png")
            cropped.save(out_file, "PNG")
            print(f"Guardado: {out_file}")

print("Iniciando recorte y transparencia de skins para Mixi, Glo y Roxy...")
for file_name, folder, skins in targets:
    process_grid(file_name, folder, skins)

print("¡Procesamiento completo! Los avatares estan listos en /public/avatars/")
