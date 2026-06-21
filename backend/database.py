from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "dsa_tracker")

client: AsyncIOMotorClient | None = None


async def get_db():
    global client
    if client is None:
        client = AsyncIOMotorClient(MONGODB_URL)
    return client[MONGODB_DB_NAME]


async def close_db():
    global client
    if client:
        client.close()
        client = None
