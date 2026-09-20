import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("❌ API key not found")
    exit()

print("✅ API key found")

client = OpenAI(api_key=api_key)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "user",
            "content": "Say hello to MedLearn AI in one sentence."
        }
    ]
)

print("\nAI response:")
print(response.choices[0].message.content)