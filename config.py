import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")

    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Upload immagini
    UPLOAD_FOLDER = os.path.join("app", "static", "uploads")

    # Limite dimensione file (es. 5MB)
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024