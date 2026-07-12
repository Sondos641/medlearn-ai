import requests

API_KEY = "AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz"  # ← Replace with your actual AIza key!

response = requests.post(
    'http://localhost:5000/chat',
    json={'message': 'What is the correct technique for palpating the liver?'}
)

print("Status Code:", response.status_code)
print("Response:", response.json())
