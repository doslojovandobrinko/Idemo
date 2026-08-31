import urllib.request
import re

url = "https://chatgpt.com/s/m_6a8f152398bc819183f6b612406451ba"
req = urllib.request.Request(
    url,
    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode("utf-8")
        print("HTML length:", len(html))
        
        # Look for the estuary / public_content / image URL in the scripts
        matches = re.findall(r'https://chatgpt\.com/backend-api/estuary/public_content/enc/[^\s"\'\\<>]+', html)
        print("Found estuary URLs:", len(matches))
        if matches:
            for m in matches:
                print("Estuary match:", m[:120])
            # The first one is typically the full generation image
            target_img_url = matches[0]
            print("Downloading:", target_img_url)
            img_req = urllib.request.Request(target_img_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(img_req) as img_resp:
                img_data = img_resp.read()
                print("Downloaded image size:", len(img_data), "bytes")
                with open("public/idemo_hero_custom.png", "wb") as f:
                    f.write(img_data)
                print("Successfully updated public/idemo_hero_custom.png!")
        else:
            print("No estuary URLs found directly. Searching all image URLs...")
            all_urls = re.findall(r'https?://[^\s"\'<>]+', html)
            for u in all_urls:
                if "oai" in u or "image" in u or "file" in u:
                    print("Candidate:", u)
except Exception as e:
    print("Error:", e)
