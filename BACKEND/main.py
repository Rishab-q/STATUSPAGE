# main.py
#import apscheduler
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request,WebSocket, WebSocketDisconnect
from typing import List
from sqlalchemy.orm import Session,joinedload
from fastapi.middleware.cors import CORSMiddleware
import os
from db import get_db
from model import Service,Event,Eventupdate,Affected_Services as Affected_services_model
from schemas import ServiceCreate, ServiceUpdate, ServiceStatus, ServiceBase,Eventbase,Eventupdates, Eventupdatescreate,Eventout,ServiceOut,EventCreate,Affected_services as Affected_services_schema
from auth import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
import requests,json,asyncio
from enum import Enum
bearer_scheme = HTTPBearer()
from datetime import datetime
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
scheduler=BackgroundScheduler()
scheduler.start()

class Eventtype(str, Enum):
    SCHEDULED_MAINTENANCE = "Scheduled maintenance"
    INCIDENT = "incident"
    
class ServiceStatus(str, Enum):
    OPERATIONAL = "Operational"
    DEGRADED = "Degraded performance"
    FULL_OUTAGE = "Full outage"
    PARTIAL_OUTAGE = "Partial outage"
    MAINTENANCE = "Maintenance"
class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, websocket: WebSocket, message: str):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

# WebSocket manager instance
ws_manager = WebSocketManager()
@app.websocket("/ws_update")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        
    
@app.get("/services",response_model=List[ServiceOut])
def public_endpoint(
    org_slug:str,
    db:Session = Depends(get_db),
):
    response=requests.get(f"https://api.clerk.dev/v1/organizations/{org_slug}",headers={"Authorization":f"Bearer {os.getenv('CLERK_API_KEY')}"})
    
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error retrieving organization details")
    else:
        org_id=response.json()["id"]
        return db.query(Service).filter_by(org_id=org_id).all()
# Create router for service endpoints
@app.get("/events", response_model=List[Eventout])
def get_events(
    org_slug:str,
    db: Session = Depends(get_db),

):
    response=requests.get(f"https://api.clerk.dev/v1/organizations/{org_slug}",headers={"Authorization":f"Bearer {os.getenv('CLERK_API_KEY')}"})
    org_id=response.json()["id"]
    try:   
        events = (
            db.query(Event)
            .options(
                joinedload(Event.affected_services).joinedload(Affected_services_model.service))
            .filter(Event.org_id == org_id)
            .all()
        )
             
            
        
        return events
          
          
    except:
            raise HTTPException(status_code=500, detail="Error retrieving events")
service_router = APIRouter(prefix="/admin/services", tags=["Service"])

# ---------------------------
# Routes: Service CRUD
# ---------------------------

@service_router.post("/", response_model=ServiceOut)
def create_service(
    
    service: ServiceCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    new_service = Service(**service.model_dump(), org_id=user["org_id"]) 
    print(new_service)
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service

@service_router.get("/", response_model=List[ServiceOut])
def get_services(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    try:
          return db.query(Service).filter_by(org_id=user["org_id"]).all()
    except:
            raise HTTPException(status_code=500, detail="Error retrieving services")

@service_router.put("/{service_id}")
def update_service(
    service_id: int,
    update: ServiceUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    service = db.query(Service).filter_by(id=service_id, org_id=user["org_id"]).first()
    for field, value in update.model_dump(exclude={"status"}).items():
        setattr(service, field, value)
    
    update_status(service, update.status, db,user=user)
    
   
    
    return service

@service_router.delete("/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
  if user["role"] == "admin":
    service = db.query(Service).filter_by(id=service_id, org_id=user["org_id"]).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
    return {"message": "Service deleted"}
  else:
    raise HTTPException(status_code=403, detail="Permission denied")

# ---------------------------
# Health Check
# ---------------------------
@app.get("/ping")
def ping():
    return {"message": "pong"}

event_router = APIRouter(prefix="/admin/event", tags=["Events"])



@event_router.post("/",response_model=Eventout)
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
  try:
   
    new_event = Event(**event.model_dump(exclude={"affected_services"}),org_id=user["org_id"]) 
    db.add(new_event)
    db.flush()
    
    for svc in event.affected_services:
        relation = Affected_services_model(event_id=new_event.id, service_id=svc.service_id)
        db.add(relation)
        if event.type==Eventtype.INCIDENT:
            service=db.query(Service).filter_by(id=svc.service_id, org_id=user["org_id"]).first()
            update_status(service, svc.new_status, db,user=user)
            print(service.status)
    if event.type==Eventtype.SCHEDULED_MAINTENANCE:
        schedule_event(new_event, db, user=user)        
    db.commit()
    return new_event
  except Exception as e:
    db.rollback()
    print(e)
    raise HTTPException(status_code=500, detail="Error creating event")

@event_router.get("/", response_model=List[Eventout])
def get_events(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    
    try:   
        events = (
            db.query(Event)
            .options(
                joinedload(Event.affected_services).joinedload(Affected_services_model.service))
            .filter(Event.org_id == user["org_id"])
            .all()
        )
             
            
        
        return events
          
          
    except:
            raise HTTPException(status_code=500, detail="Error retrieving events")


@event_router.post("/updates", response_model=Eventout)
def create_event_update(
    update: Eventupdatescreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    new_update = Eventupdate(**update.model_dump(exclude={"closed","affected_services"}), time=datetime.now())
    for svc in update.affected_services:
        service=db.query(Service).filter_by(id=svc.service_id, org_id=user["org_id"]).first()
        update_status(service, svc.new_status, db,user=user)
    if update.closed:
        new_update.event.end_time=datetime.now()
    event = db.query(Event).filter_by(id=update.event_id, org_id=user["org_id"]).first()
    event.status=update.status
    db.add(new_update)
    
    db.commit()
    db.refresh(new_update.event)
    return new_update.event

# Include service router
app.include_router(service_router)
app.include_router(event_router)


def update_status(service:Service, status:ServiceStatus, db:Session,user=Depends(get_current_user)):
    
    if service.status!=status:
        service.status=status
        db.commit()
        print("hi")
        message = {"service_id": service.id, "status": status}
        
        # Call the broadcast function to notify all connected clients
        ws_manager.broadcast(json.dumps(message))
       
    db.commit()
    db.refresh(service) 

 # Assuming get_db is in your db.py

def sched(event: Event, db: Session, user,i:int):
    affected_services = db.query(Affected_services_model).filter_by(event_id=event.id).all()

    for svc in affected_services:
        if svc.service.status == ServiceStatus.OPERATIONAL and i==0:
            update_status(svc.service, ServiceStatus.MAINTENANCE, db, user=user)
        elif svc.service.status == ServiceStatus.MAINTENANCE and i==1:
            update_status(svc.service, ServiceStatus.OPERATIONAL, db, user=user)

    db.commit()

def schedule_event(event: Event, db: Session = Depends(get_db), user=Depends(get_current_user)):
    scheduler.add_job(
        sched,
        'date',
        run_date=event.start_time,
        args=[event, db, user,0],  # Pass event, db session, and user
        id=f"sched_start_{event.id}",  # Unique job ID
        replace_existing=True  # Incase the job is rescheduled
    )
    scheduler.add_job(
        sched,
        'date',
        run_date=event.end_time,
        args=[event, db, user,1],  # Pass event, db session, and user
        id=f"sched_end_{event.id}",  # Unique job ID
        replace_existing=True  
    )
    
