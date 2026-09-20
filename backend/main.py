from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "MedLearn AI backend is running!"}