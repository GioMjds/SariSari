import os
import shutil
from PIL import Image, ImageDraw, ImageFont

# Set up paths
workspace_dir = "C:/Users/giomj/OneDrive/Desktop/SariSari"
category_a_dir = os.path.join(workspace_dir, "docs/advertisements/category-A")
backup_dir = os.path.join(category_a_dir, "backup")
fonts_dir = os.path.join(workspace_dir, "assets/fonts")

# Fonts
font_bold_path = os.path.join(fonts_dir, "StackSansText-Bold.ttf")
font_reg_path = os.path.join(fonts_dir, "StackSansText-Regular.ttf")
font_semibold_path = os.path.join(fonts_dir, "StackSansText-SemiBold.ttf")

# Brand colors (RGBA)
COLOR_PERSIMMON = (232, 90, 31, 255) # #E85A1F
COLOR_CINNAMON = (98, 52, 24, 255)   # #623418
COLOR_SAGE = (79, 122, 36, 255)       # #4F7A24
COLOR_INK = (14, 12, 10, 255)          # #0E0C0A
COLOR_PAPER = (251, 247, 238, 225)    # #FBF7EE with 225 alpha (translucent cream)
COLOR_WHITE = (255, 255, 255, 255)

def restore_from_backup():
    print("Restoring original images from backup...")
    for i in range(1, 11):
        filename = f"image-{i:02d}.png"
        src = os.path.join(backup_dir, filename)
        dst = os.path.join(category_a_dir, filename)
        if os.path.exists(src):
            shutil.copy(src, dst)
            print(f"Restored {filename}")

def wrap_text(text, font, max_width):
    words = text.split(' ')
    lines = []
    current_line = []
    for word in words:
        test_line = ' '.join(current_line + [word])
        bbox = font.getbbox(test_line)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                lines.append(word)
    if current_line:
        lines.append(' '.join(current_line))
    return lines

def draw_wrapped_text(draw, text, font, color, x, y, max_width, line_gap=8):
    lines = wrap_text(text, font, max_width)
    curr_y = y
    for line in lines:
        draw.text((x, curr_y), line, font=font, fill=color)
        bbox = font.getbbox(line)
        line_h = bbox[3] - bbox[1] if (bbox[3] - bbox[1]) > 0 else font.size
        curr_y += line_h + line_gap
    return curr_y

def process_ad_1(img):
    # size: 2048 x 2048
    # Empty space: Top 30%
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    card_box = [100, 100, 1948, 580]
    draw.rounded_rectangle(card_box, radius=24, fill=COLOR_PAPER, outline=COLOR_PERSIMMON, width=5)
    
    font_title = ImageFont.truetype(font_bold_path, 60)
    font_subtitle = ImageFont.truetype(font_bold_path, 54)
    draw.text((150, 140), "PAALAM NOTEBOOK,", font=font_title, fill=COLOR_INK)
    draw.text((150, 215), "HELLO DIGITAL LEDGER!", font=font_subtitle, fill=COLOR_PERSIMMON)
    
    font_bullet = ImageFont.truetype(font_semibold_path, 40)
    bullets = [
        "✓ 100% Offline — Kahit walang load o internet signal sa tindahan",
        "✓ Auto FIFO Balance — Awtomatikong kalkulasyon ng utang at bayad",
        "✓ Share Receipts — Madaling i-screenshot at i-send sa Messenger"
    ]
    
    y = 310
    for bullet in bullets:
        draw.text((150, y), bullet, font=font_bullet, fill=COLOR_INK)
        y += 70
        
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def process_ad_2(img):
    # size: 2688 x 1152
    # Empty space: Left 30% (strictly keep card width within x=760 to avoid character)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    card_box = [60, 80, 760, 1072]
    draw.rounded_rectangle(card_box, radius=24, fill=COLOR_PAPER, outline=COLOR_PERSIMMON, width=5)
    
    font_title = ImageFont.truetype(font_bold_path, 56)
    draw.text((100, 120), "FIFO CREDIT", font=font_title, fill=COLOR_CINNAMON)
    draw.text((100, 190), "ALLOCATION", font=font_title, fill=COLOR_PERSIMMON)
    
    font_desc = ImageFont.truetype(font_reg_path, 30)
    font_bold = ImageFont.truetype(font_semibold_path, 32)
    
    y = 280
    y = draw_wrapped_text(draw, "Awtomatikong binabawas ng SariSari ang bayad sa pinakalumang utang ng suki.", font_desc, COLOR_INK, 100, y, 560, 10)
    y += 40
    
    bullets = [
        "✓ Clear & Fair Tracking",
        "✓ Zero floating-point error",
        "✓ Instant running balance",
        "✓ No calculator disputes"
    ]
    for bullet in bullets:
        draw.text((100, y), bullet, font=font_bold, fill=COLOR_INK)
        y += 60
        
    y += 30
    draw.rounded_rectangle([100, y, 720, y+160], radius=16, fill=(232, 90, 31, 25), outline=COLOR_PERSIMMON, width=2)
    font_small = ImageFont.truetype(font_semibold_path, 26)
    draw.text((120, y+25), "Oldest Unpaid Credit", font=font_small, fill=COLOR_PERSIMMON)
    draw.text((120, y+65), "Paid First & Audited", font=font_small, fill=COLOR_INK)
    draw.text((120, y+105), "100% Automatically", font=font_small, fill=COLOR_SAGE)
    
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def process_ad_3(img):
    # size: 1632 x 2048
    # Empty space: Top 35%
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    card_box = [80, 80, 1552, 650]
    draw.rounded_rectangle(card_box, radius=24, fill=COLOR_PAPER, outline=COLOR_PERSIMMON, width=5)
    
    font_title = ImageFont.truetype(font_bold_path, 60)
    font_subtitle = ImageFont.truetype(font_bold_path, 42)
    draw.text((140, 130), "SUKI TRUST BUILDER", font=font_title, fill=COLOR_CINNAMON)
    draw.text((140, 205), "TRANSPARENCY & CLARITY", font=font_subtitle, fill=COLOR_PERSIMMON)
    
    font_bullet = ImageFont.truetype(font_semibold_path, 38)
    bullets = [
        "✓ Show suki their exact ledger balance instantly on your phone",
        "✓ No lost pages. No messy handwritten lists. No disputes",
        "✓ 100% Offline — Works anytime, even without cell signal",
        "✓ Clear, itemized credit lines build customer loyalty"
    ]
    
    y = 290
    for bullet in bullets:
        y = draw_wrapped_text(draw, bullet, font_bullet, COLOR_INK, 140, y, 1300, 8)
        y += 25
        
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def process_ad_4(img):
    # size: 2048 x 1152
    # Empty space: Top 30% (moved from bottom to prevent blocking subject)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Translucent card at the top
    card_box = [100, 60, 1948, 360]
    draw.rounded_rectangle(card_box, radius=24, fill=COLOR_PAPER, outline=COLOR_PERSIMMON, width=5)
    
    font_title = ImageFont.truetype(font_bold_path, 52)
    font_subtitle = ImageFont.truetype(font_semibold_path, 34)
    
    draw.text((150, 100), "NO MORE LOST PAGES", font=font_title, fill=COLOR_CINNAMON)
    draw.text((150, 175), "Your store records are safe and secure offline.", font=font_subtitle, fill=COLOR_INK)
    
    # CTA Button on the right
    draw.rounded_rectangle([1300, 110, 1880, 280], radius=20, fill=COLOR_PERSIMMON)
    font_btn = ImageFont.truetype(font_bold_path, 34)
    btn_text = "GET SARISARI FREE"
    bbox = font_btn.getbbox(btn_text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = 1300 + (580 - tw) // 2
    ty = 110 + (170 - th) // 2 - 5
    draw.text((tx, ty), btn_text, font=font_btn, fill=COLOR_WHITE)
    
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def process_ad_5(img):
    # size: 2048 x 2048
    # Empty space: Top 30% (moved from right side to prevent blocking character)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    card_box = [100, 100, 1948, 580]
    draw.rounded_rectangle(card_box, radius=24, fill=COLOR_PAPER, outline=COLOR_PERSIMMON, width=5)
    
    font_title = ImageFont.truetype(font_bold_path, 60)
    font_subtitle = ImageFont.truetype(font_bold_path, 54)
    draw.text((150, 140), "THE ACCURATE SUM LEDGER", font=font_title, fill=COLOR_CINNAMON)
    draw.text((150, 215), "EVERY PESO ACCOUNTED FOR", font=font_subtitle, fill=COLOR_PERSIMMON)
    
    font_bullet = ImageFont.truetype(font_semibold_path, 38)
    bullets = [
        "✓ Automated Daily Ledger — No manual calculators needed",
        "✓ Real-time Suki Balance — Tracks exact outstanding credit",
        "✓ Zero Rounding Errors — 100% financial accuracy offline"
    ]
    
    y = 310
    for bullet in bullets:
        draw.text((150, y), bullet, font=font_bullet, fill=COLOR_INK)
        y += 70
        
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def process_ad_6(img):
    # size: 2048 x 1152
    # Empty space: Right 30% (moved from top to prevent blocking characters)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    card_box = [1320, 80, 1968, 1072]
    draw.rounded_rectangle(card_box, radius=24, fill=COLOR_PAPER, outline=COLOR_PERSIMMON, width=5)
    
    font_title = ImageFont.truetype(font_bold_path, 46)
    draw.text((1360, 120), "NO MORE", font=font_title, fill=COLOR_CINNAMON)
    draw.text((1360, 180), "AWKWARD", font=font_title, fill=COLOR_PERSIMMON)
    draw.text((1360, 240), "MATH", font=font_title, fill=COLOR_INK)
    
    font_desc = ImageFont.truetype(font_semibold_path, 28)
    y = 330
    y = draw_wrapped_text(draw, "SariSari calculates clear, automatic math that both you and your suki can trust.", font_desc, COLOR_INK, 1360, y, 560, 10)
    
    font_bullet = ImageFont.truetype(font_semibold_path, 30)
    bullets = [
        "✓ Stop disputes",
        "✓ 100% Accuracy",
        "✓ Instant updates",
        "✓ Zero internet load",
        "✓ Safe local data"
    ]
    y += 40
    for bullet in bullets:
        draw.text((1360, y), bullet, font=font_bullet, fill=COLOR_PERSIMMON)
        y += 65
        
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def process_ad_7(img):
    # size: 1152 x 2048
    # Empty space: Bottom 30% (moved from left side to prevent blocking character)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    card_box = [60, 1420, 1092, 1988]
    draw.rounded_rectangle(card_box, radius=24, fill=COLOR_PAPER, outline=COLOR_PERSIMMON, width=5)
    
    font_title = ImageFont.truetype(font_bold_path, 42)
    font_subtitle = ImageFont.truetype(font_bold_path, 30)
    draw.text((100, 1460), "RUNNING BALANCE AUDIT", font=font_title, fill=COLOR_CINNAMON)
    draw.text((100, 1515), "Automated Ledger Bookkeeping", font=font_subtitle, fill=COLOR_PERSIMMON)
    
    font_bullet = ImageFont.truetype(font_semibold_path, 28)
    
    # 2 columns layout to optimize space
    col1_bullets = [
        "✓ Track exact suki balance",
        "✓ 100% offline database",
        "✓ Zero floating-point drift"
    ]
    col2_bullets = [
        "✓ Fast counterPOS register",
        "✓ Prevent lost entries",
        "✓ Easily share receipts"
    ]
    
    y = 1585
    for bullet in col1_bullets:
        draw.text((100, y), bullet, font=font_bullet, fill=COLOR_INK)
        y += 55
        
    y = 1585
    for bullet in col2_bullets:
        draw.text((600, y), bullet, font=font_bullet, fill=COLOR_INK)
        y += 55
        
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def process_ad_8(img):
    # size: 1152 x 2048
    # Empty space: Top 25%
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    card_box = [60, 60, 1092, 500]
    draw.rounded_rectangle(card_box, radius=24, fill=COLOR_PAPER, outline=COLOR_PERSIMMON, width=5)
    
    font_title = ImageFont.truetype(font_bold_path, 52)
    font_subtitle = ImageFont.truetype(font_bold_path, 34)
    draw.text((100, 110), "BUILD SUKI TRUST", font=font_title, fill=COLOR_CINNAMON)
    draw.text((100, 185), "Clear Records, Happy Customers", font=font_subtitle, fill=COLOR_PERSIMMON)
    
    font_bullet = ImageFont.truetype(font_semibold_path, 30)
    bullets = [
        "✓ Share detailed statements via Messenger screenshots",
        "✓ Fast, error-free checkout calculations at the counter",
        "✓ Instant credit balance summary on demand"
    ]
    
    y = 260
    for bullet in bullets:
        y = draw_wrapped_text(draw, bullet, font_bullet, COLOR_INK, 100, y, 900, 8)
        y += 15
        
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def process_ad_9(img):
    # size: 1632 x 2048
    # Empty space: Left 30% (strictly keep card width within x=620)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    card_box = [60, 100, 620, 1948]
    draw.rounded_rectangle(card_box, radius=24, fill=COLOR_PAPER, outline=COLOR_PERSIMMON, width=5)
    
    font_brand = ImageFont.truetype(font_bold_path, 72)
    font_title = ImageFont.truetype(font_bold_path, 42)
    
    draw.text((100, 160), "SariSari", font=font_brand, fill=COLOR_PERSIMMON)
    draw.text((100, 250), "UPGRADE TO\nDIGITAL LEDGER", font=font_title, fill=COLOR_CINNAMON)
    
    font_bullet = ImageFont.truetype(font_semibold_path, 30)
    bullets = [
        "✓ Replace wet, torn, or lost credit notebooks",
        "✓ Safe offline local database on your phone",
        "✓ Instant running balances and computations",
        "✓ Free download, no monthly fees",
        "✓ Simple design made for local store owners"
    ]
    
    y = 400
    for bullet in bullets:
        y = draw_wrapped_text(draw, bullet, font_bullet, COLOR_INK, 100, y, 460, 8)
        y += 35
        
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def process_ad_10(img):
    # size: 2048 x 2048
    # Empty space: Left 35% (moved from top to prevent blocking characters)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    card_box = [100, 100, 850, 1948]
    draw.rounded_rectangle(card_box, radius=24, fill=COLOR_PAPER, outline=COLOR_PERSIMMON, width=5)
    
    font_title = ImageFont.truetype(font_bold_path, 52)
    font_subtitle = ImageFont.truetype(font_bold_path, 34)
    draw.text((140, 150), "RECEIPT", font=font_title, fill=COLOR_CINNAMON)
    draw.text((140, 215), "SHARING", font=font_title, fill=COLOR_PERSIMMON)
    draw.text((140, 280), "VIA MESSENGER", font=font_title, fill=COLOR_INK)
    
    y = 350
    y = draw_wrapped_text(draw, "Transparent and clear credit logs to send to your suki.", font_subtitle, COLOR_PERSIMMON, 140, y, 620, 8)
    y += 30
    
    font_bullet = ImageFont.truetype(font_semibold_path, 32)
    bullets = [
        "✓ Send direct screenshots of running balances",
        "✓ Clear, itemized transaction credit rows",
        "✓ Stop misunderstandings",
        "✓ Keep records clean",
        "✓ Works offline 100%"
    ]
    
    for bullet in bullets:
        y = draw_wrapped_text(draw, bullet, font_bullet, COLOR_INK, 140, y, 600, 8)
        y += 30
        
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def main():
    print("Starting layout correction for Category A...")
    restore_from_backup()
    
    processors = {
        1: process_ad_1,
        2: process_ad_2,
        3: process_ad_3,
        4: process_ad_4,
        5: process_ad_5,
        6: process_ad_6,
        7: process_ad_7,
        8: process_ad_8,
        9: process_ad_9,
        10: process_ad_10
    }
    
    for i in range(1, 11):
        filename = f"image-{i:02d}.png"
        img_path = os.path.join(category_a_dir, filename)
        if not os.path.exists(img_path):
            print(f"Skipping {filename}: file not found")
            continue
            
        print(f"Processing {filename} with corrected layout...")
        with Image.open(img_path) as img:
            processed_img = processors[i](img)
            processed_img.convert("RGB").save(img_path, "PNG")
            print(f"Saved corrected overlay to {img_path}")
            
    print("Done! All images corrected successfully.")

if __name__ == "__main__":
    main()
