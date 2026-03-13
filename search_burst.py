import urllib.request
import re

def search(query):
    print(f'=== {query} ===')
    url = f'https://burst.shopify.com/search?q={query.replace(" ", "+")}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        urls = re.findall(r'https://burst\.shopifycdn\.com/photos/([^"]+\.jpg)', html)
        visited = set()
        for u in urls:
            if "width=" in u: continue
            base = f"https://burst.shopifycdn.com/photos/{u}?width=800&format=pjpg&exif=1&iptc=1"
            if base not in visited:
                print(base)
                visited.add(base)
            if len(visited) > 4: break
    except Exception as e:
        print(e)

search('men fashion')
search('shirt')
search('pants')
search('shoes')
