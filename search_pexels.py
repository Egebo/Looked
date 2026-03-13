import urllib.request
import re

def search(query):
    print(f"=== {query} ===")
    url = "https://www.pexels.com/search/" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        matches = re.findall(r'<img[^>]*?alt="([^"]+)"[^>]*?src="(https://images\.pexels\.com/photos/[^"]+)"', html)
        visited = set()
        count = 0
        for alt, src in matches:
            if "icon" in alt.lower() or "logo" in alt.lower() or len(alt) < 5: continue
            base_src = src.split("?")[0]
            if base_src in visited: continue
            visited.add(base_src)
            print(f"ALT: {alt}")
            print(f"URL: {base_src}?auto=compress&cs=tinysrgb&w=800\n")
            count += 1
            if count >= 10: break
    except Exception as e:
        print(e)

search('elegant men fashion')
search('linen shirt men')
search('trousers men pants')
search('leather loafers men shoes')
