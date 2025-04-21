# auth.py
from fastapi import Request, HTTPException
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError

bearer_scheme = HTTPBearer()

load_dotenv()

CLERK_PUBLIC_KEY = os.getenv("CLERK_JWT_PUBLIC_KEY")
CLERK_URL =os.getenv("CLERK_URL")
ALGORITHMS = ["RS256"]

#define a function to verify the JWT token and get the org_id and user_id from the token
def verify_JWT(token: str):
    try:
        payload = jwt.decode(
            token,
            key=CLERK_PUBLIC_KEY,
            algorithms=ALGORITHMS,
            audience="",
            issuer=CLERK_URL
        )
        print(payload)
        return{
            "org_id": payload.get("org_id"),
            "user_id": payload.get("user_id"),
            "role": payload.get("role"),
            "org_slug": payload.get("org_slug"),
        }
    except JWTError as e:
        raise HTTPException(status_code=401, detail=str(e)) from e
def get_current_user(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)):
    token=credentials.credentials
    return verify_JWT(token)

# add fields to get current user to enable authorization in swaager docs also
