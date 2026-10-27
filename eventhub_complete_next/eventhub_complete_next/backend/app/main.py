from datetime import datetime, timedelta, date
from enum import Enum
import base64
import binascii
import os
import re
import secrets
import jwt
from urllib.parse import urlsplit
from pwdlib import PasswordHash
from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import AliasChoices, BaseModel, EmailStr, Field, field_validator
from sqlalchemy import create_engine, String, Integer, Float, Boolean, DateTime, Date, ForeignKey, Text, UniqueConstraint, func, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session, relationship, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://eventhub:eventhub_dev@localhost:5432/eventhub")
JWT_SECRET = os.getenv("JWT_SECRET", "local-secret")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@eventhub.local")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
pwd = PasswordHash.recommended()
app = FastAPI(title="EventHub API", version="2.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__="users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(30), default="")
    alternate_contact_phone: Mapped[str | None] = mapped_column(String(30), default="", nullable=True)
    city: Mapped[str] = mapped_column(String(100), default="")
    state: Mapped[str] = mapped_column(String(100), default="")
    address_line1: Mapped[str] = mapped_column(String(240), default="")
    address_line2: Mapped[str] = mapped_column(String(240), default="")
    locality: Mapped[str] = mapped_column(String(120), default="")
    postal_code: Mapped[str] = mapped_column(String(6), default="")
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="CUSTOMER")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    referral_code: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    referral_source: Mapped[str] = mapped_column(String(80), default="")
    referred_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class UserPreferences(Base):
    __tablename__="user_preferences"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    booking_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    shortlist_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    marketing_emails: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Category(Base):
    __tablename__="service_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class Service(Base):
    __tablename__="services"
    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("service_categories.id"))
    name: Mapped[str] = mapped_column(String(120))
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class Provider(Base):
    __tablename__="providers"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    business_name: Mapped[str] = mapped_column(String(180))
    business_title: Mapped[str] = mapped_column(String(180), default="")
    contact_email: Mapped[str | None] = mapped_column(String(255), default="", nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(30), default="", nullable=True)
    alternate_contact_phone: Mapped[str | None] = mapped_column(String(30), default="", nullable=True)
    logo_data: Mapped[str] = mapped_column(Text, default="")
    instagram_url: Mapped[str] = mapped_column(String(500), default="")
    facebook_url: Mapped[str] = mapped_column(String(500), default="")
    youtube_url: Mapped[str] = mapped_column(String(500), default="")
    linkedin_url: Mapped[str] = mapped_column(String(500), default="")
    website_url: Mapped[str] = mapped_column(String(500), default="")
    category: Mapped[str] = mapped_column(String(120))
    provider_type: Mapped[str] = mapped_column(String(120), default="General Events")
    city: Mapped[str] = mapped_column(String(100), default="Ranchi")
    state: Mapped[str] = mapped_column(String(100), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    service_radius: Mapped[int] = mapped_column(Integer, default=25)
    years_experience: Mapped[int] = mapped_column(Integer, default=1)
    starting_price: Mapped[float] = mapped_column(Float, default=0)
    price_unit: Mapped[str] = mapped_column(String(30), default="event")
    rating: Mapped[float] = mapped_column(Float, default=0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_status: Mapped[str] = mapped_column(String(30), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class PlannerShortlist(Base):
    __tablename__="planner_shortlist"
    __table_args__=(UniqueConstraint("customer_id","provider_id",name="uq_planner_shortlist_customer_provider"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"))
    note: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="SHORTLISTED")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Event(Base):
    __tablename__="events"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    event_type: Mapped[str] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100), default="")
    event_date: Mapped[date] = mapped_column(Date)
    guests: Mapped[int] = mapped_column(Integer)
    budget: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(30), default="OPEN")

class Requirement(Base):
    __tablename__="event_requirements"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    service_name: Mapped[str] = mapped_column(String(120))
    details: Mapped[str] = mapped_column(Text, default="")

class QuoteRequest(Base):
    __tablename__="quote_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"))
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    details: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Quote(Base):
    __tablename__="quotes"
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("quote_requests.id"))
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"))
    amount: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(30), default="event")
    notes: Mapped[str] = mapped_column(Text, default="")
    valid_until: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="SUBMITTED")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Booking(Base):
    __tablename__="bookings"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    quote_id: Mapped[int] = mapped_column(ForeignKey("quotes.id"))
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"))
    amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(30), default="CONFIRMED")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Review(Base):
    __tablename__="reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int | None] = mapped_column(ForeignKey("bookings.id"), unique=True, nullable=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"))
    rating: Mapped[float] = mapped_column(Float)
    quality: Mapped[float] = mapped_column(Float, default=0)
    professionalism: Mapped[float] = mapped_column(Float, default=0)
    communication: Mapped[float] = mapped_column(Float, default=0)
    value: Mapped[float] = mapped_column(Float, default=0)
    timeliness: Mapped[float] = mapped_column(Float, default=0)
    comment: Mapped[str] = mapped_column(Text, default="")
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    reported: Mapped[bool] = mapped_column(Boolean, default=False)
    report_reason: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Availability(Base):
    __tablename__="provider_availability"
    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"))
    available_date: Mapped[date] = mapped_column(Date)
    available: Mapped[bool] = mapped_column(Boolean, default=True)

def db():
    s=SessionLocal()
    try: yield s
    finally: s.close()

def token(user):
    return jwt.encode({"sub":str(user.id),"role":user.role,"exp":datetime.utcnow()+timedelta(hours=12)}, JWT_SECRET, algorithm="HS256")

def current_user(authorization: str = Header(default=""), s: Session = Depends(db)):
    if not authorization.startswith("Bearer "): raise HTTPException(401,"Login required")
    try: payload=jwt.decode(authorization[7:],JWT_SECRET,algorithms=["HS256"]); uid=int(payload["sub"])
    except Exception: raise HTTPException(401,"Invalid token")
    u=s.get(User,uid)
    if not u: raise HTTPException(401,"User not found")
    if not u.active: raise HTTPException(403,"Account is disabled")
    return u

def admin(u=Depends(current_user)):
    if u.role!="ADMIN": raise HTTPException(403,"Admin role required")
    return u

def normalize_login_phone(value:str)->str:
    digits=re.sub(r"\D","",value)
    if digits.startswith("0091") and len(digits)==14:
        return digits[4:]
    if digits.startswith("91") and len(digits)==12:
        return digits[2:]
    if digits.startswith("0") and len(digits)==11:
        return digits[1:]
    return digits

class Signup(BaseModel):
    name:str=Field(validation_alias=AliasChoices("full_name","name"))
    email:EmailStr
    phone:str=Field(min_length=7,max_length=30)
    alternate_contact_phone:str=Field(default="",max_length=30)
    password:str=Field(min_length=6)
    role:str="CUSTOMER"
    referral_source:str=Field(default="",max_length=80)
    referral_code:str=Field(default="",max_length=20)
    business_name:str=""
    business_title:str=Field(default="",max_length=180)
    logo_data:str=Field(default="",max_length=700000)
    instagram_url:str=Field(default="",max_length=500)
    facebook_url:str=Field(default="",max_length=500)
    youtube_url:str=Field(default="",max_length=500)
    linkedin_url:str=Field(default="",max_length=500)
    website_url:str=Field(default="",max_length=500)
    provider_type:str=Field(default="General Events",max_length=120)
    description:str=""
    city:str=""
    state:str=""
    service_radius:int=Field(default=25,ge=1)
    years_experience:int=Field(default=1,ge=0)
class ProfileUpdate(BaseModel):
    full_name:str=Field(min_length=1,max_length=120)
    email:EmailStr
    phone:str=Field(min_length=7,max_length=30)
    alternate_contact_phone:str=Field(default="",max_length=30)
    address_line1:str=Field(min_length=1,max_length=240)
    address_line2:str=Field(default="",max_length=240)
    locality:str=Field(min_length=1,max_length=120)
    city:str=Field(min_length=1,max_length=100)
    state:str=Field(min_length=1,max_length=100)
    postal_code:str=Field(pattern=r"^[1-9][0-9]{5}$")
class Login(BaseModel):
    identifier:str=Field(
        min_length=3,
        max_length=255,
        validation_alias=AliasChoices("identifier","email","phone"),
    )
    password:str
class PasswordChange(BaseModel):
    current_password:str=Field(min_length=1)
    new_password:str=Field(min_length=8,max_length=128)
class NotificationPreferencesIn(BaseModel):
    email_notifications:bool
    booking_updates:bool
    shortlist_updates:bool
    marketing_emails:bool
class EventRequestIn(BaseModel):
    event_type:str=Field(min_length=1,max_length=100)
    city:str=Field(min_length=1,max_length=100)
    state:str=Field(min_length=1,max_length=100)
    event_date:date
    guests:int=Field(gt=0,le=100000)
    budget:float=Field(ge=0,allow_inf_nan=False)
    provider_ids:list[int]=Field(min_length=1,max_length=25)
    services:list[str]=Field(default_factory=list,max_length=20)
    venue:str=Field(default="",max_length=300)
    details:str=Field(default="",max_length=4000)
class ProviderIn(BaseModel):
    business_name:str=Field(min_length=1,max_length=180)
    category:str=Field(min_length=1,max_length=120)
    city:str=Field(min_length=1,max_length=100)
    state:str=Field(min_length=1,max_length=100)
    contact_email:EmailStr|None=None
    contact_phone:str|None=Field(default=None,max_length=30)
    alternate_contact_phone:str|None=Field(default=None,max_length=30)
    description:str=Field(default="",max_length=4000)
    years_experience:int=Field(default=1,ge=0)
    service_radius:int=Field(default=25,ge=1)
    starting_price:float=Field(default=0,ge=0,allow_inf_nan=False)
    price_unit:str=Field(default="event",max_length=30)
    business_title:str=Field(default="",max_length=180)
    logo_data:str=Field(default="",max_length=700000)
    instagram_url:str=Field(default="",max_length=500)
    facebook_url:str=Field(default="",max_length=500)
    youtube_url:str=Field(default="",max_length=500)
    linkedin_url:str=Field(default="",max_length=500)
    website_url:str=Field(default="",max_length=500)

    @field_validator("contact_email",mode="before")
    @classmethod
    def empty_contact_email_is_optional(cls,value):
        if isinstance(value,str) and not value.strip():
            return None
        return value
class CategoryIn(BaseModel): name:str; description:str=""
class ServiceIn(BaseModel): category_id:int; name:str
class QuoteIn(BaseModel):
    amount:float=Field(gt=0); unit:str="event"; notes:str=""; valid_until:date|None=None
class ReviewIn(BaseModel):
    rating:float=Field(ge=1,le=5); quality:float=Field(ge=1,le=5); professionalism:float=Field(ge=1,le=5)
    communication:float=Field(ge=1,le=5); value:float=Field(ge=1,le=5); timeliness:float=Field(ge=1,le=5); comment:str=""
class ProviderReviewIn(BaseModel):
    rating:float=Field(ge=1,le=5)
    comment:str=Field(default="",max_length=2000)
class PlannerShortlistIn(BaseModel):
    provider_id:int
    note:str=Field(default="",max_length=2000)
class PlannerShortlistNote(BaseModel):
    note:str=Field(default="",max_length=2000)
class ReportIn(BaseModel): reason:str

@app.on_event("startup")
def startup():
    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS alternate_contact_phone VARCHAR(30)"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(240) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(240) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS locality VARCHAR(120) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(6) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_source VARCHAR(80) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_user_id INTEGER REFERENCES users(id)"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_referral_code ON users (referral_code)"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS provider_type VARCHAR(120) NOT NULL DEFAULT 'General Events'"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS service_radius INTEGER NOT NULL DEFAULT 25"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS state VARCHAR(100) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS business_title VARCHAR(180) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30)"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS alternate_contact_phone VARCHAR(30)"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS logo_data TEXT NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE providers ADD COLUMN IF NOT EXISTS website_url VARCHAR(500) NOT NULL DEFAULT ''"))
        connection.execute(text("UPDATE providers SET contact_email=users.email FROM users WHERE providers.user_id=users.id AND providers.contact_email IS NULL"))
        connection.execute(text("UPDATE providers SET contact_phone=users.phone FROM users WHERE providers.user_id=users.id AND providers.contact_phone IS NULL"))
        connection.execute(text("UPDATE providers SET alternate_contact_phone=users.alternate_contact_phone FROM users WHERE providers.user_id=users.id AND providers.alternate_contact_phone IS NULL AND users.alternate_contact_phone IS NOT NULL"))
        connection.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS state VARCHAR(100) NOT NULL DEFAULT ''"))
        connection.execute(text("ALTER TABLE reviews ALTER COLUMN booking_id DROP NOT NULL"))
    with SessionLocal() as s:
        users=s.query(User).all()
        for user in users:
            if user.referral_code and re.fullmatch(r"EH-[A-Z0-9]{8}", user.referral_code):
                continue
            user.referral_code=generate_referral_code(s)
            s.flush()
        s.commit()
        if not s.query(User).filter_by(email=ADMIN_EMAIL).first():
            s.add(User(
                name="EventHub Admin",
                email=ADMIN_EMAIL,
                password_hash=pwd.hash(ADMIN_PASSWORD),
                role="ADMIN",
                referral_code=generate_referral_code(s),
            ))
        if s.query(Category).count()==0:
            cats=[("Photography","Photography and event coverage"),("Catering","Food and beverage services"),("Decoration","Stage, floral and venue decoration"),("Music & DJ","DJ, sound and live music"),("Makeup","Bridal and event makeup")]
            s.add_all([Category(name=n,description=d) for n,d in cats])
        s.commit()

@app.get("/health")
def health(): return {"status":"ok"}

def generate_referral_code(s:Session)->str:
    while True:
        code="EH-"+"".join(secrets.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") for _ in range(8))
        if not s.query(User.id).filter_by(referral_code=code).first():
            return code

def ensure_referral_code(u:User,s:Session)->str:
    if not u.referral_code or not re.fullmatch(r"EH-[A-Z0-9]{8}",u.referral_code):
        u.referral_code=generate_referral_code(s)
        s.commit()
    return u.referral_code

@app.post("/api/v1/auth/signup")
def signup(x:Signup,s:Session=Depends(db)):
    email=str(x.email).lower()
    if s.query(User).filter(func.lower(User.email)==email).first(): raise HTTPException(409,"Email already registered")
    role="PROVIDER" if x.role.upper()=="PROVIDER" else "CUSTOMER"
    referral_source=x.referral_source.strip()
    allowed_referral_sources={"Service provider","Customer referral","Social media","Search engine","EventHub website","Friend or family","Other"}
    if referral_source and referral_source not in allowed_referral_sources:
        raise HTTPException(400,"Choose a valid answer for how you heard about EventHub")
    referral_code=x.referral_code.strip().upper()
    referrer=None
    if referral_code:
        referrer=s.query(User).filter(
            User.referral_code==referral_code,
            User.role.in_(("CUSTOMER","PROVIDER","CUSTOMER_PROVIDER")),
            User.active.is_(True),
        ).first()
        if not referrer:
            raise HTTPException(400,"Referral code not found. Check the code and try again.")
    provider_fields={}
    if role=="PROVIDER":
        provider_fields={
            "business_title":x.business_title.strip(),
            "contact_email":email,
            "contact_phone":x.phone.strip(),
            "alternate_contact_phone":x.alternate_contact_phone.strip() or None,
            "logo_data":validate_logo_data(x.logo_data),
            "instagram_url":validate_social_url(x.instagram_url,"Instagram"),
            "facebook_url":validate_social_url(x.facebook_url,"Facebook"),
            "youtube_url":validate_social_url(x.youtube_url,"YouTube"),
            "linkedin_url":validate_social_url(x.linkedin_url,"LinkedIn"),
            "website_url":validate_social_url(x.website_url,"Website"),
        }
    u=User(
        name=x.name,
        email=email,
        phone=x.phone,
        alternate_contact_phone=x.alternate_contact_phone.strip() or None,
        city=x.city,
        state=x.state,
        password_hash=pwd.hash(x.password),
        role=role,
        referral_code=generate_referral_code(s),
        referral_source=referral_source,
        referred_by_user_id=referrer.id if referrer else None,
    )
    s.add(u); s.commit(); s.refresh(u)
    if role=="PROVIDER":
        provider_type=x.provider_type.strip() or "General Events"
        p=Provider(
            user_id=u.id,
            business_name=x.business_name.strip() or x.name,
            **provider_fields,
            category=provider_type,
            provider_type=provider_type,
            description=x.description,
            city=x.city,
            state=x.state,
            service_radius=x.service_radius,
            years_experience=x.years_experience,
        )
        s.add(p); s.commit()
    return {"access_token":token(u),"user":{"id":u.id,"name":u.name,"full_name":u.name,"email":u.email,"phone":u.phone,"alternate_contact_phone":u.alternate_contact_phone,"city":u.city,"state":u.state,"role":u.role,"active":u.active,"email_verified":u.email_verified,"referral_code":u.referral_code,"created_at":u.created_at.isoformat()}}

@app.post("/api/v1/auth/login")
def login(x:Login,s:Session=Depends(db)):
    identifier=x.identifier.strip()
    u=s.query(User).filter(func.lower(User.email)==identifier.lower()).first()
    if not u and "@" not in identifier:
        phone_digits=normalize_login_phone(identifier)
        if len(phone_digits)>=7:
            matches=[
                account for account in s.query(User).filter(User.phone!="").all()
                if normalize_login_phone(account.phone)==phone_digits
            ]
            if len(matches)>1:
                raise HTTPException(409,"This mobile number is linked to multiple accounts. Please sign in with your email.")
            u=matches[0] if matches else None
    if not u or not pwd.verify(x.password,u.password_hash): raise HTTPException(401,"Invalid email/mobile number or password")
    if not u.active: raise HTTPException(403,"Account is disabled")
    referral_code=ensure_referral_code(u,s)
    return {"access_token":token(u),"user":{"id":u.id,"name":u.name,"full_name":u.name,"email":u.email,"phone":u.phone,"alternate_contact_phone":u.alternate_contact_phone,"city":u.city,"state":u.state,"role":u.role,"active":u.active,"email_verified":u.email_verified,"referral_code":referral_code,"created_at":u.created_at.isoformat()}}

def user_profile_json(u:User):
    return {
        "id":u.id,
        "full_name":u.name,
        "email":u.email,
        "phone":u.phone,
        "alternate_contact_phone":u.alternate_contact_phone or "",
        "city":u.city,
        "state":u.state,
        "address_line1":u.address_line1,
        "address_line2":u.address_line2,
        "locality":u.locality,
        "postal_code":u.postal_code,
        "role":u.role,
        "active":u.active,
        "email_verified":u.email_verified,
        "referral_code":u.referral_code,
        "created_at":u.created_at.isoformat(),
    }

@app.get("/api/v1/profile")
def get_profile(u=Depends(current_user),s:Session=Depends(db)):
    ensure_referral_code(u,s)
    return user_profile_json(u)

@app.put("/api/v1/profile")
def update_profile(x:ProfileUpdate,u=Depends(current_user),s:Session=Depends(db)):
    email=str(x.email).lower()
    duplicate=s.query(User).filter(func.lower(User.email)==email,User.id!=u.id).first()
    if duplicate:
        raise HTTPException(409,"Email already registered")
    if email!=u.email.lower():
        u.email_verified=False
    u.name=x.full_name.strip()
    u.email=email
    u.phone=x.phone.strip()
    u.alternate_contact_phone=x.alternate_contact_phone.strip() or None
    u.address_line1=x.address_line1.strip()
    u.address_line2=x.address_line2.strip()
    u.locality=x.locality.strip()
    u.city=x.city
    u.state=x.state
    u.postal_code=x.postal_code
    if u.role in {"PROVIDER","CUSTOMER_PROVIDER"}:
        provider=s.query(Provider).filter_by(user_id=u.id).first()
        if provider:
            provider.city=x.city
            provider.state=x.state
            provider.contact_phone=u.phone
            provider.alternate_contact_phone=u.alternate_contact_phone
    s.commit()
    s.refresh(u)
    return user_profile_json(u)

def preferences_json(preferences:UserPreferences):
    return {
        "email_notifications":preferences.email_notifications,
        "booking_updates":preferences.booking_updates,
        "shortlist_updates":preferences.shortlist_updates,
        "marketing_emails":preferences.marketing_emails,
        "updated_at":preferences.updated_at.isoformat(),
    }

@app.get("/api/v1/settings/notifications")
def get_notification_preferences(u=Depends(current_user),s:Session=Depends(db)):
    preferences=s.get(UserPreferences,u.id)
    if not preferences:
        preferences=UserPreferences(user_id=u.id)
        s.add(preferences)
        s.commit()
        s.refresh(preferences)
    return preferences_json(preferences)

@app.put("/api/v1/settings/notifications")
def update_notification_preferences(x:NotificationPreferencesIn,u=Depends(current_user),s:Session=Depends(db)):
    preferences=s.get(UserPreferences,u.id)
    if not preferences:
        preferences=UserPreferences(user_id=u.id)
        s.add(preferences)
    for key,value in x.model_dump().items():
        setattr(preferences,key,value)
    s.commit()
    s.refresh(preferences)
    return preferences_json(preferences)

@app.post("/api/v1/settings/password")
def change_password(x:PasswordChange,u=Depends(current_user),s:Session=Depends(db)):
    if not pwd.verify(x.current_password,u.password_hash):
        raise HTTPException(400,"Current password is incorrect")
    if pwd.verify(x.new_password,u.password_hash):
        raise HTTPException(400,"New password must be different from the current password")
    u.password_hash=pwd.hash(x.new_password)
    s.commit()
    return {"updated":True}

@app.get("/api/v1/providers")
def providers(q:str="",city:str="",category:str="",verified:bool|None=None,s:Session=Depends(db)):
    rows=s.query(Provider).join(User,Provider.user_id==User.id).filter(User.active.is_(True)).all()
    if q: rows=[p for p in rows if q.lower() in (p.business_name+" "+p.description).lower()]
    if city: rows=[p for p in rows if p.city.lower()==city.lower()]
    if category: rows=[p for p in rows if category.lower() in p.category.lower()]
    if verified is not None: rows=[p for p in rows if p.verified==verified]
    return [provider_json(p) for p in rows]

@app.get("/api/v1/providers/{pid}")
def provider(pid:int,s:Session=Depends(db)):
    p=s.get(Provider,pid)
    if not p or not s.query(User).filter_by(id=p.user_id,active=True).first(): raise HTTPException(404,"Provider not found")
    return provider_json(p,include_logo=True)

@app.get("/api/v1/providers/{pid}/referrals")
def provider_referrals(pid:int,s:Session=Depends(db)):
    current=s.get(Provider,pid)
    if not current:
        raise HTTPException(404,"Provider not found")
    current_owner=s.query(User).filter_by(id=current.user_id,active=True).first()
    if not current_owner:
        raise HTTPException(404,"Provider not found")

    chain=[]
    seen_user_ids=set()
    owner=current_owner
    while owner and owner.id not in seen_user_ids and len(chain)<12:
        seen_user_ids.add(owner.id)
        linked_provider=s.query(Provider).filter_by(user_id=owner.id).first()
        is_public_provider=(
            linked_provider is not None
            and (
                owner.id == current_owner.id
                or owner.role in {"PROVIDER","CUSTOMER_PROVIDER"}
            )
        )
        chain.append({
            "provider_id":linked_provider.id if is_public_provider else None,
            "name":linked_provider.business_name if is_public_provider else "EventHub community member",
            "kind":"provider" if is_public_provider else "community",
        })
        if not owner.referred_by_user_id:
            break
        owner=s.get(User,owner.referred_by_user_id)
        if owner and not owner.active:
            break
    chain.reverse()

    referred_rows=s.query(Provider,User).join(
        User,Provider.user_id==User.id
    ).filter(
        User.referred_by_user_id==current_owner.id,
        User.id!=current_owner.id,
        User.active.is_(True),
        User.role.in_(("PROVIDER","CUSTOMER_PROVIDER")),
    ).order_by(Provider.created_at.desc()).all()
    referred_providers=[
        {"id":referred.id,"business_name":referred.business_name,"category":referred.category}
        for referred,_ in referred_rows
    ]
    return {"chain":chain,"referred_providers":referred_providers}

def validate_social_url(value:str,platform:str)->str:
    value=value.strip()
    if not value:
        return ""
    parsed=urlsplit(value)
    if parsed.scheme not in {"https","http"} or not parsed.netloc or any(char.isspace() for char in value):
        raise HTTPException(400,f"{platform} link must be a valid HTTP or HTTPS URL")
    return value

def validate_logo_data(value:str)->str:
    if not value:
        return ""
    try:
        header,payload=value.split(",",1)
        mime=header.removeprefix("data:").removesuffix(";base64")
        if header != f"data:{mime};base64" or mime not in {"image/png","image/jpeg","image/webp"}:
            raise ValueError("Unsupported image format")
        content=base64.b64decode(payload,validate=True)
    except (ValueError,binascii.Error):
        raise HTTPException(400,"Logo must be a valid PNG, JPEG, or WebP image")
    if len(content)>512*1024:
        raise HTTPException(400,"Logo image must be 512 KB or smaller")
    valid_image=(
        (mime=="image/png" and content.startswith(b"\x89PNG\r\n\x1a\n"))
        or (mime=="image/jpeg" and content.startswith(b"\xff\xd8\xff"))
        or (mime=="image/webp" and len(content)>=12 and content[:4]==b"RIFF" and content[8:12]==b"WEBP")
    )
    if not valid_image:
        raise HTTPException(400,"Uploaded file content does not match a supported image type")
    return value

def provider_json(p,include_logo=False):
    return {"id":p.id,"business_name":p.business_name,"category":p.category,"city":p.city,"state":p.state,"description":p.description,
            "business_title":p.business_title,"contact_email":p.contact_email,"contact_phone":"",
            "alternate_contact_phone":p.alternate_contact_phone,
            "instagram_url":p.instagram_url,"facebook_url":p.facebook_url,"youtube_url":p.youtube_url,
            "linkedin_url":p.linkedin_url,"website_url":p.website_url,
            "provider_type":p.provider_type,"service_radius":p.service_radius,"years_experience":p.years_experience,"starting_price":p.starting_price,"price_unit":p.price_unit,
            "logo_data":p.logo_data if include_logo else "","rating":p.rating,"review_count":p.review_count,"verified":p.verified,"verification_status":p.verification_status}

def refresh_provider_rating(s:Session,p:Provider):
    reviews=s.query(Review).filter_by(provider_id=p.id,published=True).all()
    p.rating=round(sum(review.rating for review in reviews)/len(reviews),2) if reviews else 0
    p.review_count=len(reviews)

def require_customer(u:User):
    if u.role not in {"CUSTOMER","CUSTOMER_PROVIDER"}:
        raise HTTPException(403,"Customer account required")
    return u

def planner_shortlist_json(entry:PlannerShortlist,p:Provider,owner:User):
    return {
        "id":entry.id,
        "provider_id":p.id,
        "business_name":p.business_name,
        "provider_type":p.provider_type or p.category,
        "category":p.category,
        "city":p.city,
        "state":p.state,
        "description":p.description,
        "rating":p.rating,
        "review_count":p.review_count,
        "verification_status":p.verification_status,
        "provider_active":owner.active,
        "note":entry.note,
        "status":entry.status,
        "created_at":entry.created_at.isoformat(),
        "updated_at":entry.updated_at.isoformat(),
    }

@app.get("/api/v1/customer/shortlist")
def get_planner_shortlist(u=Depends(current_user),s:Session=Depends(db)):
    require_customer(u)
    rows=s.query(PlannerShortlist,Provider,User).join(
        Provider,PlannerShortlist.provider_id==Provider.id
    ).join(User,Provider.user_id==User.id).filter(
        PlannerShortlist.customer_id==u.id
    ).order_by(PlannerShortlist.created_at.desc()).all()
    return [planner_shortlist_json(entry,p,owner) for entry,p,owner in rows]

@app.post("/api/v1/customer/shortlist")
def add_to_planner_shortlist(x:PlannerShortlistIn,u=Depends(current_user),s:Session=Depends(db)):
    require_customer(u)
    p=s.get(Provider,x.provider_id)
    if not p or not s.query(User).filter_by(id=p.user_id,active=True).first():
        raise HTTPException(404,"Active provider not found")
    entry=s.query(PlannerShortlist).filter_by(customer_id=u.id,provider_id=p.id).first()
    if entry:
        entry.note=x.note.strip()
    else:
        entry=PlannerShortlist(customer_id=u.id,provider_id=p.id,note=x.note.strip())
        s.add(entry)
    s.commit()
    s.refresh(entry)
    owner=s.get(User,p.user_id)
    return planner_shortlist_json(entry,p,owner)

@app.put("/api/v1/customer/shortlist/{provider_id}/note")
def update_planner_note(provider_id:int,x:PlannerShortlistNote,u=Depends(current_user),s:Session=Depends(db)):
    require_customer(u)
    entry=s.query(PlannerShortlist).filter_by(customer_id=u.id,provider_id=provider_id).first()
    if not entry:
        raise HTTPException(404,"Planner is not in your shortlist")
    entry.note=x.note.strip()
    s.commit()
    p=s.get(Provider,provider_id)
    owner=s.get(User,p.user_id)
    return planner_shortlist_json(entry,p,owner)

@app.patch("/api/v1/customer/shortlist/{provider_id}/status")
def update_planner_status(provider_id:int,status:str=Query(...),u=Depends(current_user),s:Session=Depends(db)):
    require_customer(u)
    if status not in {"SHORTLISTED","SELECTED"}:
        raise HTTPException(400,"Status must be SHORTLISTED or SELECTED")
    entry=s.query(PlannerShortlist).filter_by(customer_id=u.id,provider_id=provider_id).first()
    if not entry:
        raise HTTPException(404,"Planner is not in your shortlist")
    p=s.get(Provider,provider_id)
    owner=s.get(User,p.user_id)
    if status=="SELECTED" and not owner.active:
        raise HTTPException(409,"This provider account is disabled and cannot be selected")
    if status=="SELECTED":
        s.query(PlannerShortlist).filter(
            PlannerShortlist.customer_id==u.id,
            PlannerShortlist.status=="SELECTED",
            PlannerShortlist.provider_id!=provider_id,
        ).update({"status":"SHORTLISTED"},synchronize_session=False)
    entry.status=status
    s.commit()
    return planner_shortlist_json(entry,p,owner)

@app.delete("/api/v1/customer/shortlist/{provider_id}")
def remove_from_planner_shortlist(provider_id:int,u=Depends(current_user),s:Session=Depends(db)):
    require_customer(u)
    entry=s.query(PlannerShortlist).filter_by(customer_id=u.id,provider_id=provider_id).first()
    if not entry:
        raise HTTPException(404,"Planner is not in your shortlist")
    s.delete(entry)
    s.commit()
    return {"removed":True,"provider_id":provider_id}

@app.put("/api/v1/provider/profile")
def update_provider(x:ProviderIn,u=Depends(current_user),s:Session=Depends(db)):
    if u.role not in {"PROVIDER","CUSTOMER_PROVIDER"}: raise HTTPException(403,"Provider role required")
    p=s.query(Provider).filter_by(user_id=u.id).first()
    if not p: raise HTTPException(404,"Provider profile not found")
    data=x.model_dump(exclude={"contact_email","contact_phone","alternate_contact_phone"})
    data["logo_data"]=validate_logo_data(data["logo_data"])
    for field,platform in (("instagram_url","Instagram"),("facebook_url","Facebook"),("youtube_url","YouTube"),("linkedin_url","LinkedIn"),("website_url","Website")):
        data[field]=validate_social_url(data[field],platform)
    for k,v in data.items(): setattr(p,k,v)
    p.contact_email=str(x.contact_email).lower() if x.contact_email else None
    p.contact_phone=u.phone
    if x.alternate_contact_phone is not None:
        u.alternate_contact_phone=x.alternate_contact_phone.strip() or None
    p.alternate_contact_phone=u.alternate_contact_phone
    p.provider_type=p.category
    p.verification_status="PENDING"; p.verified=False
    s.commit(); return provider_json(p,include_logo=True)

@app.post("/api/v1/provider/profile")
def create_provider_profile(x:ProviderIn,u=Depends(current_user),s:Session=Depends(db)):
    if u.role not in {"CUSTOMER","CUSTOMER_PROVIDER"}:
        raise HTTPException(403,"Customer account required to add a provider profile")
    if s.query(Provider).filter_by(user_id=u.id).first():
        raise HTTPException(409,"A provider profile already exists for this account")
    data=x.model_dump()
    data["business_name"]=data["business_name"].strip()
    data["category"]=data["category"].strip()
    data["city"]=data["city"].strip()
    data["state"]=data["state"].strip()
    u.alternate_contact_phone=(x.alternate_contact_phone or "").strip() or None
    if not data["business_name"] or not data["category"] or not data["city"] or not data["state"]:
        raise HTTPException(400,"Business name, service, city, and state are required")
    data["logo_data"]=validate_logo_data(data["logo_data"])
    for field,platform in (("instagram_url","Instagram"),("facebook_url","Facebook"),("youtube_url","YouTube"),("linkedin_url","LinkedIn"),("website_url","Website")):
        data[field]=validate_social_url(data[field],platform)
    provider=Provider(
        user_id=u.id,
        business_name=data["business_name"],
        business_title=data["business_title"].strip(),
        contact_email=str(x.contact_email).strip().lower() if x.contact_email else None,
        contact_phone=(x.contact_phone if x.contact_phone is not None else u.phone).strip(),
        alternate_contact_phone=u.alternate_contact_phone,
        logo_data=data["logo_data"],
        instagram_url=data["instagram_url"],
        facebook_url=data["facebook_url"],
        youtube_url=data["youtube_url"],
        linkedin_url=data["linkedin_url"],
        website_url=data["website_url"],
        category=data["category"],
        provider_type=data["category"],
        city=data["city"],
        state=data["state"],
        description=data["description"].strip(),
        service_radius=data["service_radius"],
        years_experience=data["years_experience"],
        starting_price=data["starting_price"],
        price_unit=data["price_unit"].strip() or "event",
        verification_status="PENDING",
        verified=False,
    )
    u.role="CUSTOMER_PROVIDER"
    u.city=data["city"]
    u.state=data["state"]
    s.add(provider)
    s.commit()
    s.refresh(provider)
    s.refresh(u)
    return {
        "provider":provider_json(provider,include_logo=True),
        "user":user_profile_json(u),
    }

@app.get("/api/v1/provider/profile")
def get_provider_profile(u=Depends(current_user),s:Session=Depends(db)):
    if u.role not in {"PROVIDER","CUSTOMER_PROVIDER"}: raise HTTPException(403,"Provider role required")
    p=s.query(Provider).filter_by(user_id=u.id).first()
    if not p: raise HTTPException(404,"Provider profile not found")
    return provider_json(p,include_logo=True)

@app.get("/api/v1/provider/enquiries")
def enquiries(u=Depends(current_user),s:Session=Depends(db)):
    p=s.query(Provider).filter_by(user_id=u.id).first()
    if not p: raise HTTPException(404,"Provider profile not found")
    rs=s.query(QuoteRequest).filter_by(provider_id=p.id).order_by(QuoteRequest.created_at.desc()).all()
    out=[]
    for r in rs:
        e=s.get(Event,r.event_id); q=s.query(Quote).filter_by(request_id=r.id).first()
        requirements=s.query(Requirement).filter_by(event_id=e.id).all()
        out.append({"id":r.id,"event_id":r.event_id,"event_type":e.event_type,"city":e.city,"state":e.state,"event_date":str(e.event_date),
                    "guests":e.guests,"budget":e.budget,"details":r.details,
                    "services":[item.service_name for item in requirements],"status":r.status,
                    "quote":None if not q else {"id":q.id,"amount":q.amount,"unit":q.unit,"notes":q.notes,"status":q.status}})
    return out

@app.post("/api/v1/customer/events")
def create_customer_event(x:EventRequestIn,u=Depends(current_user),s:Session=Depends(db)):
    require_customer(u)
    if x.event_date < date.today():
        raise HTTPException(400,"Event date cannot be in the past")
    provider_ids=list(dict.fromkeys(x.provider_ids))
    providers=s.query(Provider).join(User,Provider.user_id==User.id).filter(
        Provider.id.in_(provider_ids),User.active.is_(True)
    ).all()
    if len(providers)!=len(provider_ids):
        raise HTTPException(404,"One or more selected providers are unavailable")
    event=Event(
        customer_id=u.id,
        event_type=x.event_type.strip(),
        city=x.city.strip(),
        state=x.state.strip(),
        event_date=x.event_date,
        guests=x.guests,
        budget=x.budget,
        status="OPEN",
    )
    s.add(event)
    s.flush()
    requested_services=list(dict.fromkeys(service.strip() for service in x.services if service.strip()))
    for service_name in requested_services:
        s.add(Requirement(event_id=event.id,service_name=service_name,details=x.details.strip()))
    request_details="\n".join(
        part for part in (
            f"Venue / location details: {x.venue.strip()}" if x.venue.strip() else "",
            f"Additional event details: {x.details.strip()}" if x.details.strip() else "",
        ) if part
    )
    requests=[]
    for provider in providers:
        quote_request=QuoteRequest(
            event_id=event.id,
            provider_id=provider.id,
            customer_id=u.id,
            details=request_details,
            status="PENDING",
        )
        s.add(quote_request)
        requests.append({"provider_id":provider.id,"business_name":provider.business_name,"status":"PENDING"})
    s.commit()
    return {
        "event_id":event.id,
        "event_type":event.event_type,
        "requests":requests,
        "message":f"Your event details were sent to {len(requests)} provider(s).",
    }

@app.get("/api/v1/customer/events")
def customer_events(u=Depends(current_user),s:Session=Depends(db)):
    require_customer(u)
    events=s.query(Event).filter_by(customer_id=u.id).order_by(Event.id.desc()).all()
    result=[]
    for event in events:
        requirements=s.query(Requirement).filter_by(event_id=event.id).all()
        requests=s.query(QuoteRequest).filter_by(event_id=event.id,customer_id=u.id).all()
        provider_responses=[]
        for request in requests:
            provider=s.get(Provider,request.provider_id)
            quote=s.query(Quote).filter_by(request_id=request.id).first()
            provider_responses.append({
                "provider_id":request.provider_id,
                "business_name":provider.business_name if provider else "Provider unavailable",
                "status":request.status,
                "quote":None if not quote else {
                    "amount":quote.amount,
                    "unit":quote.unit,
                    "notes":quote.notes,
                    "status":quote.status,
                },
            })
        result.append({
            "id":event.id,
            "event_type":event.event_type,
            "city":event.city,
            "state":event.state,
            "event_date":str(event.event_date),
            "guests":event.guests,
            "budget":event.budget,
            "status":event.status,
            "details":requests[0].details if requests else "",
            "services":[item.service_name for item in requirements],
            "providers":provider_responses,
        })
    return result

@app.post("/api/v1/quote-requests/{rid}/quote")
def submit_quote(rid:int,x:QuoteIn,u=Depends(current_user),s:Session=Depends(db)):
    if u.role not in {"PROVIDER","CUSTOMER_PROVIDER"}: raise HTTPException(403,"Provider role required")
    p=s.query(Provider).filter_by(user_id=u.id).first(); r=s.get(QuoteRequest,rid)
    if not p or not r or r.provider_id!=p.id: raise HTTPException(404,"Request not found")
    q=Quote(request_id=rid,provider_id=p.id,amount=x.amount,unit=x.unit,notes=x.notes,valid_until=x.valid_until)
    r.status="QUOTED"; s.add(q); s.commit(); s.refresh(q)
    return {"id":q.id,"status":q.status}

@app.get("/api/v1/provider/bookings")
def provider_bookings(u=Depends(current_user),s:Session=Depends(db)):
    p=s.query(Provider).filter_by(user_id=u.id).first()
    if not p: raise HTTPException(404,"Provider profile not found")
    bs=s.query(Booking).filter_by(provider_id=p.id).order_by(Booking.created_at.desc()).all()
    return [{"id":b.id,"event_id":b.event_id,"amount":b.amount,"status":b.status,"created_at":b.created_at.isoformat()} for b in bs]

@app.patch("/api/v1/provider/bookings/{bid}")
def update_booking(bid:int,status:str=Query(...),u=Depends(current_user),s:Session=Depends(db)):
    p=s.query(Provider).filter_by(user_id=u.id).first(); b=s.get(Booking,bid)
    if not p or not b or b.provider_id!=p.id: raise HTTPException(404,"Booking not found")
    allowed={"CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED"}
    if status not in allowed: raise HTTPException(400,"Invalid status")
    if b.status=="COMPLETED" and status!="COMPLETED": raise HTTPException(400,"Completed booking cannot be changed")
    b.status=status; s.commit()
    return {"id":b.id,"status":b.status}

@app.get("/api/v1/provider/availability")
def provider_availability(u=Depends(current_user),s:Session=Depends(db)):
    p=s.query(Provider).filter_by(user_id=u.id).first()
    return [{"id":a.id,"date":str(a.available_date),"available":a.available} for a in s.query(Availability).filter_by(provider_id=p.id).order_by(Availability.available_date).all()] if p else []

@app.post("/api/v1/provider/availability")
def set_availability(day:date,available:bool=True,u=Depends(current_user),s:Session=Depends(db)):
    p=s.query(Provider).filter_by(user_id=u.id).first()
    a=s.query(Availability).filter_by(provider_id=p.id,available_date=day).first()
    if not a: a=Availability(provider_id=p.id,available_date=day); s.add(a)
    a.available=available; s.commit(); return {"date":str(day),"available":available}

@app.get("/api/v1/admin/providers")
def admin_providers(u=Depends(admin),s:Session=Depends(db)):
    return [provider_json(p) for p in s.query(Provider).order_by(Provider.created_at.desc()).all()]

@app.get("/api/v1/admin/users")
def admin_users(u=Depends(admin),s:Session=Depends(db)):
    rows=s.query(User,Provider).outerjoin(Provider,Provider.user_id==User.id).filter(
        User.role.in_(("CUSTOMER","PROVIDER","CUSTOMER_PROVIDER"))
    ).order_by(User.created_at.desc()).all()
    return [{
        "id":account.id,
        "full_name":account.name,
        "email":account.email,
        "phone":account.phone,
        "role":account.role,
        "active":account.active,
        "city":account.city,
        "state":account.state,
        "business_name":provider.business_name if provider else "",
    } for account,provider in rows]

@app.patch("/api/v1/admin/users/{user_id}/status")
def toggle_user_status(user_id:int,active:bool=Query(...),u=Depends(admin),s:Session=Depends(db)):
    account=s.get(User,user_id)
    if not account or account.role not in {"CUSTOMER","PROVIDER","CUSTOMER_PROVIDER"}:
        raise HTTPException(404,"Customer or provider account not found")
    account.active=active
    s.commit()
    return {"id":account.id,"active":account.active}

@app.patch("/api/v1/admin/providers/{pid}/verification")
def verify_provider(pid:int,status:str=Query(...),u=Depends(admin),s:Session=Depends(db)):
    if status not in {"APPROVED","REJECTED","PENDING"}: raise HTTPException(400,"Invalid verification status")
    p=s.get(Provider,pid)
    if not p: raise HTTPException(404,"Provider not found")
    p.verification_status=status; p.verified=(status=="APPROVED"); s.commit()
    return provider_json(p)

@app.get("/api/v1/admin/categories")
def categories(u=Depends(admin),s:Session=Depends(db)):
    return [{"id":c.id,"name":c.name,"description":c.description,"active":c.active} for c in s.query(Category).order_by(Category.name).all()]

@app.post("/api/v1/admin/categories")
def add_category(x:CategoryIn,u=Depends(admin),s:Session=Depends(db)):
    if s.query(Category).filter(func.lower(Category.name)==x.name.lower()).first(): raise HTTPException(409,"Category exists")
    c=Category(name=x.name,description=x.description); s.add(c); s.commit(); s.refresh(c)
    return {"id":c.id,"name":c.name,"description":c.description,"active":c.active}

@app.patch("/api/v1/admin/categories/{cid}")
def toggle_category(cid:int,active:bool=Query(...),u=Depends(admin),s:Session=Depends(db)):
    c=s.get(Category,cid)
    if not c: raise HTTPException(404,"Category not found")
    c.active=active; s.commit(); return {"id":c.id,"active":c.active}

@app.get("/api/v1/admin/services")
def admin_services(u=Depends(admin),s:Session=Depends(db)):
    return [{"id":x.id,"name":x.name,"category_id":x.category_id,"active":x.active} for x in s.query(Service).order_by(Service.name).all()]

@app.post("/api/v1/admin/services")
def add_service(x:ServiceIn,u=Depends(admin),s:Session=Depends(db)):
    if not s.get(Category,x.category_id): raise HTTPException(404,"Category not found")
    z=Service(name=x.name,category_id=x.category_id); s.add(z); s.commit(); s.refresh(z)
    return {"id":z.id,"name":z.name,"category_id":z.category_id,"active":z.active}

@app.patch("/api/v1/admin/services/{sid}")
def toggle_service(sid:int,active:bool=Query(...),u=Depends(admin),s:Session=Depends(db)):
    z=s.get(Service,sid)
    if not z: raise HTTPException(404,"Service not found")
    z.active=active; s.commit(); return {"id":z.id,"active":z.active}

@app.get("/api/v1/admin/reviews/reported")
def reported_reviews(u=Depends(admin),s:Session=Depends(db)):
    rs=s.query(Review).filter_by(reported=True).order_by(Review.created_at.desc()).all()
    return [{"id":r.id,"booking_id":r.booking_id,"provider_id":r.provider_id,"rating":r.rating,"comment":r.comment,"reason":r.report_reason,"published":r.published} for r in rs]

@app.patch("/api/v1/admin/reviews/{rid}")
def moderate_review(rid:int,action:str=Query(...),u=Depends(admin),s:Session=Depends(db)):
    r=s.get(Review,rid)
    if not r: raise HTTPException(404,"Review not found")
    if action=="publish": r.published=True; r.reported=False
    elif action=="hide": r.published=False; r.reported=False
    elif action=="dismiss_report": r.reported=False
    else: raise HTTPException(400,"Invalid action")
    if action in {"publish","hide"}:
        s.flush()
        provider=s.get(Provider,r.provider_id)
        if provider: refresh_provider_rating(s,provider)
    s.commit()
    return {"id":r.id,"published":r.published,"reported":r.reported}

@app.get("/api/v1/admin/summary")
def admin_summary(u=Depends(admin),s:Session=Depends(db)):
    return {"providers":s.query(Provider).count(),"pending_providers":s.query(Provider).filter_by(verification_status="PENDING").count(),
            "categories":s.query(Category).count(),"services":s.query(Service).count(),"reported_reviews":s.query(Review).filter_by(reported=True).count(),
            "bookings":s.query(Booking).count()}

@app.post("/api/v1/bookings/{bid}/review")
def create_review(bid:int,x:ReviewIn,u=Depends(current_user),s:Session=Depends(db)):
    b=s.get(Booking,bid)
    if not b or b.customer_id!=u.id: raise HTTPException(404,"Booking not found")
    if b.status!="COMPLETED": raise HTTPException(400,"Only completed bookings can be reviewed")
    if s.query(Review).filter_by(booking_id=bid).first(): raise HTTPException(409,"Booking already reviewed")
    r=Review(booking_id=bid,customer_id=u.id,provider_id=b.provider_id,**x.model_dump()); s.add(r)
    p=s.get(Provider,b.provider_id)
    s.flush()
    refresh_provider_rating(s,p)
    s.commit(); return {"id":r.id}

@app.get("/api/v1/providers/{pid}/reviews")
def provider_reviews(pid:int,s:Session=Depends(db)):
    p=s.get(Provider,pid)
    if not p or not s.query(User).filter_by(id=p.user_id,active=True).first():
        raise HTTPException(404,"Provider not found")
    rows=s.query(Review,User).join(User,Review.customer_id==User.id).filter(
        Review.provider_id==pid,Review.published.is_(True)
    ).order_by(Review.created_at.desc()).all()
    return [{
        "id":review.id,
        "rating":review.rating,
        "comment":review.comment,
        "reviewer_name":customer.name,
        "created_at":review.created_at.isoformat(),
    } for review,customer in rows]

@app.post("/api/v1/providers/{pid}/reviews")
def submit_provider_review(pid:int,x:ProviderReviewIn,u=Depends(current_user),s:Session=Depends(db)):
    if u.role not in {"CUSTOMER","CUSTOMER_PROVIDER"}:
        raise HTTPException(403,"Customer account required to leave a provider review")
    p=s.get(Provider,pid)
    if not p or not s.query(User).filter_by(id=p.user_id,active=True).first():
        raise HTTPException(404,"Provider not found")
    review=s.query(Review).filter_by(customer_id=u.id,provider_id=pid).order_by(Review.created_at.desc()).first()
    if review:
        review.rating=x.rating
        review.comment=x.comment.strip()
        review.published=True
        review.reported=False
        review.report_reason=""
    else:
        review=Review(
            booking_id=None,
            customer_id=u.id,
            provider_id=pid,
            rating=x.rating,
            comment=x.comment.strip(),
        )
        s.add(review)
    s.flush()
    refresh_provider_rating(s,p)
    s.commit()
    return {"id":review.id,"rating":review.rating,"comment":review.comment}

@app.post("/api/v1/reviews/{rid}/report")
def report_review(rid:int,x:ReportIn,u=Depends(current_user),s:Session=Depends(db)):
    r=s.get(Review,rid)
    if not r: raise HTTPException(404,"Review not found")
    r.reported=True; r.report_reason=x.reason; s.commit(); return {"reported":True}
