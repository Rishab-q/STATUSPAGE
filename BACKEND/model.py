from sqlalchemy import Column,ForeignKey, Integer, DateTime,String,Text,Enum as SEnum
#import relationship
from sqlalchemy.orm import relationship
from db import Base
from enum import Enum 
from datetime import datetime

class ServiceStatus(str,Enum):
    OPERATIONAL = "Operational"
    DEGRADED = "Degraded performance"
    FULL_OUTAGE = "Full outage"
    PARTIAL_OUTAGE = "Partial outage"
    MAINTENANCE = "Maintenance"
    
class EventStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "Investigating"
    IDENTIFIED = "Identified"
    MONITORING = "Monitoring"
    RESOLVED = "Resolved"

class Eventtype(str, Enum):
    SCHEDULED_MAINTENANCE = "Scheduled maintenance"
    INCIDENT = "incident"
    
class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    status = Column(SEnum(ServiceStatus), default=ServiceStatus.OPERATIONAL)
    org_id = Column(String, nullable=False)

    affected_services = relationship("Affected_Services", back_populates="service")


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    type = Column(SEnum(Eventtype), nullable=False)
    title=Column(String, nullable=False)
    start_time=Column(DateTime, nullable=False,default=datetime.now())
    end_time=Column(DateTime, nullable=True,default=None)
    status=Column(SEnum(EventStatus), nullable=False,default=EventStatus.OPEN)
    eventupdates = relationship("Eventupdate", back_populates="event")
    # add relationship to affected services table
    affected_services = relationship("Affected_Services", back_populates="event")
    org_id = Column(String, nullable=False)
    
class Eventupdate(Base):
    __tablename__ = "eventupdates"
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id",ondelete="CASCADE"), nullable=False)
    status=Column(SEnum(EventStatus), nullable=False,default=EventStatus.OPEN)
    time=Column(DateTime, nullable=False,default=datetime.now())
    event = relationship("Event", back_populates="eventupdates")
    message = Column(String, nullable=False)
    
class Affected_Services(Base):
    __tablename__ = "affected_services"
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id",ondelete="CASCADE"), nullable=False)  # Foreign key to Event table
    service_id = Column(Integer, ForeignKey("services.id",ondelete="CASCADE"), nullable=False)  # Foreign key to Service table
    event = relationship("Event", back_populates="affected_services")
    service = relationship("Service", back_populates="affected_services")