import os
import glob
import time
from PIL import Image
from collections import deque

ARTIFACT_DIR = r"C:\Users\giomj\.gemini\antigravity-cli\brain\dd4234e3-1ae0-47f1-925e-de1b434464a5"
OUTPUT_DIR = r"C:\Users\giomj\OneDrive\Desktop\SariSari\assets\images\sari-emotions"

state_mapping = {
    'sari_default_state': 'sari-default-state.png',
    'sari_inventory_state': 'sari-inventory-state.png',
    'sari_low_stock': 'sari-low-stock-state.png',
    'sari_sales_state': 'sari-sales-state.png',
    'sari_utang_state': 'sari-utang-state.png',
    'sari_outstanding_balance': 'sari-outstanding-balance-state.png',
    'sari_balance_cleared': 'sari-balance-cleared-state.png',
    'sari_offline_state': 'sari-offline-state.png',
    'sari_onboarding_state': 'sari-onboarding-state.png',
    'sari_empty_state': 'sari-empty-state.png',
    'sari_delete_state': 'sari-delete-state.png',
    'sari_settings_state': 'sari-settings-state.png',
    'sari_reports_state': 'sari-reports-state.png',
    'sari_error_state': 'sari-error-state.png',
}

def flood_fill_transparency(img_path, output_path, tolerance_distance=20):
    start_time = time.time()
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    visited = [False] * (width * height)
    
    # Helper to check color distance
    def color_dist(c1, c2):
        return ((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2)**0.5

    # Sample four corners as starting points
    corners = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    
    for cx, cy in corners:
        start_color = pixels[cx, cy]
        if not visited[cy * width + cx]:
            queue = deque([(cx, cy)])
            visited[cy * width + cx] = True
            
            while queue:
                x, y = queue.popleft()
                pixels[x, y] = (0, 0, 0, 0) # transparent
                
                # Check 4-connected neighbors
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        idx = ny * width + nx
                        if not visited[idx]:
                            dist = color_dist(pixels[nx, ny], start_color)
                            if dist <= tolerance_distance:
                                visited[idx] = True
                                queue.append((nx, ny))
                        
    img.save(output_path, "PNG")
    duration = time.time() - start_time
    transparent_count = sum(1 for y in range(height) for x in range(width) if pixels[x, y][3] == 0)
    print(f"Processed '{os.path.basename(img_path)}' -> '{os.path.basename(output_path)}' in {duration:.2f}s (made {transparent_count} pixels transparent)")

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for prefix, target_name in state_mapping.items():
        # Find all files with the prefix in the artifact directory
        pattern = os.path.join(ARTIFACT_DIR, f"{prefix}_*.jpg")
        matching_files = glob.glob(pattern)
        
        if not matching_files:
            print(f"Warning: No generated files found for prefix '{prefix}'")
            continue
            
        # Get the latest generated file by modification time
        latest_file = max(matching_files, key=os.path.getmtime)
        output_path = os.path.join(OUTPUT_DIR, target_name)
        
        flood_fill_transparency(latest_file, output_path)

if __name__ == '__main__':
    main()
