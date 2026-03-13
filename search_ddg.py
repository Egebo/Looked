import urllib.request
import urllib.parse
import json
import re

def search_ddg_images(query):
    print(f"=== {query} ===")
    req = urllib.request.Request(f"https://duckduckgo.com/?q={urllib.parse.quote(query)}&t=h_&iar=images&iax=images&ia=images", headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        vqd_match = re.search(r'vqd=([\'"]?)([\d-]+)([\'"]?)', html)
        if not vqd_match:
            print("No vqd found")
            return
        vqd = vqd_match.group(2)
        
        url = f"https://duckduckgo.com/i.js?q={urllib.parse.quote(query)}&o=json&vqd={vqd}"
        req2 = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0'})
        res = urllib.request.urlopen(req2).read().decode('utf-8')
        data = json.loads(res)
        
        for idx, item in enumerate(data['results'][:6]):
            print(f"TITLE: {item['title'].encode('ascii', 'ignore').decode('utf-8')}")
            print(f"IMG: {item['image']}\n")
    except Exception as e:
        print("Error:", e)

search_ddg_images("old money men fashion style classic pinterest")
search_ddg_images("men classic linen shirt editorial photography")
search_ddg_images("men tailored classic trousers beige aesthetic photography")
search_ddg_images("men leather penny loafers photography dark brown")
