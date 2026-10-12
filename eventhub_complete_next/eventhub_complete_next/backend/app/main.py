from datetime import datetime, timedelta, date
from enum import Enum
import os
import jwt
from pwdlib import PasswordHash
from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import create_engine, String, Integer, Float, Boolean, DateTime, Date, ForeignKey, Text, func
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
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="CUSTOMER")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

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
    category: Mapped[str] = mapped_column(String(120))
    city: Mapped[str] = mapped_column(String(100), default="Ranchi")
    description: Mapped[str] = mapped_column(Text, default="")
    years_experience: Mapped[int] = mapped_column(Integer, default=1)
    starting_price: Mapped[float] = mapped_column(Float, default=0)
    price_unit: Mapped[str] = mapped_column(String(30), default="event")
    rating: Mapped[float] = mapped_column(Float, default=0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_status: Mapped[str] = mapped_column(String(30), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Event(Base):
    __tablename__="events"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    event_type: Mapped[str] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(100))
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
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), unique=True)
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
    return u

def admin(u=Depends(current_user)):
    if u.role!="ADMIN": raise HTTPException(403,"Admin role required")
    return u

class Signup(BaseModel):
    name:str; email:EmailStr; password:str=Field(min_length=6); role:str="CUSTOMER"
class Login(BaseModel): email:EmailStr; password:str
class ProviderIn(BaseModel):
    business_name:str; category:str; city:str="Ranchi"; description:str=""; years_experience:int=1
    starting_price:float=0; price_unit:str="event"
class CategoryIn(BaseModel): name:str; description:str=""
class ServiceIn(BaseModel): category_id:int; name:str
class QuoteIn(BaseModel):
    amount:float=Field(gt=0); unit:str="event"; notes:str=""; valid_until:date|None=None
class ReviewIn(BaseModel):
    rating:float=Field(ge=1,le=5); quality:float=Field(ge=1,le=5); professionalism:float=Field(ge=1,le=5)
    communication:float=Field(ge=1,le=5); value:float=Field(ge=1,le=5); timeliness:float=Field(ge=1,le=5); comment:str=""
class ReportIn(BaseModel): reason:str

@app.on_event("startup")
def startup():
    Base.metadata.create_all(engine)
    with SessionLocal() as s:
        if not s.query(User).filter_by(email=ADMIN_EMAIL).first():
            s.add(User(name="EventHub Admin",email=ADMIN_EMAIL,password_hash=pwd.hash(ADMIN_PASSWORD),role="ADMIN"))
        if s.query(Category).count()==0:
            cats=[("Photography","Photography and event coverage"),("Catering","Food and beverage services"),("Decoration","Stage, floral and venue decoration"),("Music & DJ","DJ, sound and live music"),("Makeup","Bridal and event makeup")]
            s.add_all([Category(name=n,description=d) for n,d in cats])
        s.commit()

@app.get("/health")
def health(): return {"status":"ok"}

@app.post("/api/v1/auth/signup")
def signup(x:Signup,s:Session=Depends(db)):
    if s.query(User).filter_by(email=x.email).first(): raise HTTPException(409,"Email already registered")
    role="PROVIDER" if x.role.upper()=="PROVIDER" else "CUSTOMER"
    u=User(name=x.name,email=x.email,password_hash=pwd.hash(x.password),role=role); s.add(u); s.commit(); s.refresh(u)
    if role=="PROVIDER":
        p=Provider(user_id=u.id,business_name=x.name,category="General Events",city="Ranchi"); s.add(p); s.commit()
    return {"access_token":token(u),"user":{"id":u.id,"name":u.name,"email":u.email,"role":u.role}}

@app.post("/api/v1/auth/login")
def login(x:Login,s:Session=Depends(db)):
    u=s.query(User).filter_by(email=x.email).first()
    if not u or not pwd.verify(x.password,u.password_hash): raise HTTPException(401,"Invalid email or password")
    return {"access_token":token(u),"user":{"id":u.id,"name":u.name,"email":u.email,"role":u.role}}

@app.get("/api/v1/providers")
def providers(q:str="",city:str="",category:str="",verified:bool|None=None,s:Session=Depends(db)):
    rows=s.query(Provider).all()
    if q: rows=[p for p in rows if q.lower() in (p.business_name+" "+p.description).lower()]
    if city: rows=[p for p in rows if p.city.lower()==city.lower()]
    if category: rows=[p for p in rows if category.lower() in p.category.lower()]
    if verified is not None: rows=[p for p in rows if p.verified==verified]
    return [provider_json(p) for p in rows]

@app.get("/api/v1/providers/{pid}")
def provider(pid:int,s:Session=Depends(db)):
    p=s.get(Provider,pid)
    if not p: raise HTTPException(404,"Provider not found")
    return provider_json(p)

def provider_json(p):
    return {"id":p.id,"business_name":p.business_name,"category":p.category,"city":p.city,"description":p.description,
            "years_experience":p.years_experience,"starting_price":p.starting_price,"price_unit":p.price_unit,
            "rating":p.rating,"review_count":p.review_count,"verified":p.verified,"verification_status":p.verification_status}

@app.put("/api/v1/provider/profile")
def update_provider(x:ProviderIn,u=Depends(current_user),s:Session=Depends(db)):
    if u.role!="PROVIDER": raise HTTPException(403,"Provider role required")
    p=s.query(Provider).filter_by(user_id=u.id).first()
    if not p: raise HTTPException(404,"Provider profile not found")
    for k,v in x.model_dump().items(): setattr(p,k,v)
    p.verification_status="PENDING"; p.verified=False
    s.commit(); return provider_json(p)

@app.get("/api/v1/provider/enquiries")
def enquiries(u=Depends(current_user),s:Session=Depends(db)):
    p=s.query(Provider).filter_by(user_id=u.id).first()
    if not p: raise HTTPException(404,"Provider profile not found")
    rs=s.query(QuoteRequest).filter_by(provider_id=p.id).order_by(QuoteRequest.created_at.desc()).all()
    out=[]
    for r in rs:
        e=s.get(Event,r.event_id); q=s.query(Quote).filter_by(request_id=r.id).first()
        out.append({"id":r.id,"event_id":r.event_id,"event_type":e.event_type,"city":e.city,"event_date":str(e.event_date),
                    "guests":e.guests,"budget":e.budget,"details":r.details,"status":r.status,
                    "quote":None if not q else {"id":q.id,"amount":q.amount,"unit":q.unit,"notes":q.notes,"status":q.status}})
    return out

@app.post("/api/v1/quote-requests/{rid}/quote")
def submit_quote(rid:int,x:QuoteIn,u=Depends(current_user),s:Session=Depends(db)):
    if u.role!="PROVIDER": raise HTTPException(403,"Provider role required")
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
    all_reviews=s.query(Review).filter_by(provider_id=p.id,published=True).all()
    p.rating=round(sum(z.rating for z in all_reviews+[r])/(len(all_reviews)+1),2)
    p.review_count=len(all_reviews)+1
    s.commit(); return {"id":r.id}

@app.post("/api/v1/reviews/{rid}/report")
def report_review(rid:int,x:ReportIn,u=Depends(current_user),s:Session=Depends(db)):
    r=s.get(Review,rid)
    if not r: raise HTTPException(404,"Review not found")
    r.reported=True; r.report_reason=x.reason; s.commit(); return {"reported":True}
