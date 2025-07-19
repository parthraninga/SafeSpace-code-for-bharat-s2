import requests

# Test the heatmap endpoint
response = requests.get('http://localhost:8000/api/threats/heatmap', timeout=15)
print('Status:', response.status_code)

if response.status_code == 200:
    data = response.json()
    cities = data.get('heatmap_data', [])
    print(f'Total cities: {len(cities)}')
    
    for city in cities[:3]:
        print(f"{city['city']}: {city['threatCount']} threats ({city['threatLevel']})")
        print(f"  High: {city['highRiskCount']}, Medium: {city['mediumRiskCount']}, Low: {city['lowRiskCount']}")
        print()
else:
    print('Error:', response.text)
