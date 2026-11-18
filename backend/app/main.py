from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import (
    system, classical, ca, pqc, signatures, attacks, benchmark, experiments, reports
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="QuantumShield Evaluation Platform API",
    description="Research-Grade Classical & Post-Quantum Cryptography Evaluation API",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
app.include_router(system.router)
app.include_router(classical.router)
app.include_router(ca.router)
app.include_router(pqc.router)
app.include_router(signatures.router)
app.include_router(attacks.router)
app.include_router(benchmark.router)
app.include_router(experiments.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {
        "platform": "QuantumShield Research Platform",
        "status": "ONLINE",
        "documentation": "/docs",
        "algorithms": ["RSA-2048", "ECDSA-P256", "ML-DSA-44"]
    }
