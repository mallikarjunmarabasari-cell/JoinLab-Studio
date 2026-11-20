from fastapi import FastAPI

app = FastAPI(
    title="JoinLab Studio API",
    description="Python backend for JoinLab Studio",
    version="0.3.1"
)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "JoinLab Python API is running"
    }