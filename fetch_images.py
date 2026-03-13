import urllib.request
import re

def search_unsplash(query):
    url = "https://unsplash.com/s/photos/" + query.replace(" ", "-")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        urls = re.findall(r'https://images\.unsplash\.com/photo-[a-zA-Z0-9\-]+', html)
        unique_urls = list(dict.fromkeys(urls))
        return [u + '?q=80&w=800&auto=format&fit=crop' for u in unique_urls[:5]]
    except Exception as e:
        return [str(e)]

print('--- OLD MONEY COVER ---')
for u in search_unsplash('old money aesthetic'): print(u)

print('--- LINEN SHIRT ---')
for u in search_unsplash('mens linen shirt'): print(u)

print('--- TROUSERS ---')
for u in search_unsplash('mens tailored trousers'): print(u)

print('--- LOAFERS ---')
for u in search_unsplash('mens leather loafers'): print(u)
