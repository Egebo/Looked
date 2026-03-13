import urllib.request
import json

def search(query):
    print(f'--- {query.upper()} ---')
    url = f'https://unsplash.com/napi/search/photos?query={query.replace(" ", "+")}&per_page=15'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/json',
        'Referer': 'https://unsplash.com/s/photos/old-money'
    })
    try:
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read().decode('utf-8'))
        for idx, res in enumerate(data['results'][:15]):
            desc = res.get('description') or res.get('alt_description') or 'No description'
            img = res['urls']['regular']
            print(f'{idx+1}. DESC: {desc}')
            print(f'   IMG: {img}')
    except Exception as e:
        print(f'Error: {e}')

search('old money men')
search('classic linen shirt men')
search('mens tailored trousers')
search('mens leather penny loafers')
