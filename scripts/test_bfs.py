import os
import time
from PIL import Image
from collections import deque

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
    
    # Count transparent pixels
    count = sum(1 for y in range(height) for x in range(width) if pixels[x, y][3] == 0)
    print(f"Processed in {time.time() - start_time:.2f} seconds. Made {count} pixels transparent.")

if __name__ == '__main__':
    img_path = r"C:\Users\giomj\.gemini\antigravity-cli\brain\dd4234e3-1ae0-47f1-925e-de1b434464a5\sari_sales_state_1782109773711.jpg"
    out_path = r"C:\Users\giomj\OneDrive\Desktop\SariSari\assets\images\sari-emotions\sari-sales-state.png"
    
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    flood_fill_transparency(img_path, out_path)
