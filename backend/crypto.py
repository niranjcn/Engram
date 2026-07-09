import os
from cryptography.fernet import Fernet
import base64
import hashlib

def _get_key() -> bytes:
    key = os.environ.get("FERNET_KEY")
    if key:
        return key.encode()
    secret = os.environ.get("SECRET_KEY")
    if not secret:
        raise RuntimeError("FERNET_KEY or SECRET_KEY must be set for token encryption")
    raw = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(raw)

_fernet = Fernet(_get_key())

def encrypt_token(token: str) -> str:
    return _fernet.encrypt(token.encode()).decode()

def decrypt_token(encrypted: str) -> str:
    return _fernet.decrypt(encrypted.encode()).decode()
