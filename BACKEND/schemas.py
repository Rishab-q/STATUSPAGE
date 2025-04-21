#import minimal essential for schema
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from enum import Enum

class Eventtype(str, Enum):
    SCHEDULED_MAINTENANCE = "Scheduled maintenance"
    INCIDENT = "incident"

# Define the ServiceStatus Enum
class ServiceStatus(str, Enum):
    OPERATIONAL = "Operational"
    DEGRADED = "Degraded performance"
    FULL_OUTAGE = "Full outage"
    PARTIAL_OUTAGE = "Partial outage"
    MAINTENANCE = "Maintenance"
   

class EVENT_STATUSES(str,Enum):
  IDENTIFIED="Identified"
  MONITORING="Monitoring"
  INVESTIGATING="Investigating"
  RESOLVED="Resolved"
  OPEN="open"

# Define the Service schema
class ServiceBase(BaseModel):
    name: str = Field(..., description="Name of the service")
    status: ServiceStatus = Field(default=ServiceStatus.OPERATIONAL, description="Status of the service")
    #org_id: str = Field(..., description="Organization ID to which the service belongs")
    
class ServiceOut(ServiceBase):
    id: int

    
    class Config:
        orm_mode = True
class ServiceCreate(ServiceBase):
    pass
        
        
# class for updating service
class ServiceUpdate(ServiceBase):
    pass
    

class Affected_services(BaseModel):
   
    service_id:int
    new_status:Optional[ServiceStatus]
    
    
    
    class Config:
        orm_mode=True

class Eventbase(BaseModel):
    start_time:datetime
    type:Eventtype
    title:str
    end_time:Optional[datetime] = None
    status:Optional[EVENT_STATUSES]
    class Config:
        orm_mode=True
        
    pass
    
class EventCreate(Eventbase):
    affected_services: list[Affected_services]
    
    class Config:
        orm_mode=True
        
    
class Eventupdates(BaseModel):
    status:str
    event_id:int
    message:str
    status:EVENT_STATUSES
    class Config:
        orm_mode=True

class Eventupdatescreate(Eventupdates):
    closed:Optional[bool] = False
    affected_services:list[Affected_services]
    class Config:
        orm_mode=True

class AffectedServiceOut(BaseModel):
    service: ServiceOut  # nested service object

    class Config:
        orm_mode = True


class Eventout(Eventbase):
    id:int
    eventupdates:list[Eventupdates]=[]
    affected_services:list[AffectedServiceOut]=[]
    
    class Config:
        orm_mode=True