from fastapi import Depends, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests

from app import crud, models, schemas, utils, exceptions
from app.api.api_v1 import deps
from app.core import security
from app.core.config import settings


router = APIRouter(prefix="/api/login", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

request = requests.Request()


@router.post("/", response_model=schemas.TokenOut)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(deps.get_db),
):
    user = crud.user.get_by_email(db, email=form_data.username)
    if user is None:
        raise exceptions.IncorrectLoginCredentials()
    if not security.verify_password(form_data.password, user.password):
        raise exceptions.IncorrectLoginCredentials()

    access_token = security.create_access_token(data={"user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "login_type": "normal",
    }


@router.post("/google", response_model=schemas.TokenOut)
async def login_via_google(
    payload: schemas.GoogleToken, db: Session = Depends(deps.get_db)
):
    user_data = id_token.verify_oauth2_token(
        payload.token_id, request, settings.GOOGLE_CLIENT_ID
    )
    user_id: str = None
    user = crud.user.get_by_email(db, email=user_data.get("email"))

    # if email does not exist, create a new user with empty password
    if user is None:
        # avoid duplicating user id
        new_user_id = utils.generate_uuid()
        while crud.user.get(db, id=new_user_id) is not None:
            new_user_id = utils.generate_uuid()
        new_user = models.User(id=new_user_id, email=user_data.get("email"))
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user_id = new_user.id
    else:
        # if user attempts to sign in with email that has already been created
        # without signing in by google, raise exception
        if user.password is not None:
            raise exceptions.AccountCreatedWithOutGoogle()
        user_id = user.id
    access_token = security.create_access_token(data={"user_id": user_id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "login_type": "3rd party",
    }