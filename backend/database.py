from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime, os

if os.getenv("VERCEL"):
    DB_PATH = "/tmp/road_damage.db"
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "road_damage.db")

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, unique=True, index=True)

    # Citizen info
    citizen_name = Column(String, nullable=False)
    citizen_email = Column(String, nullable=False)
    citizen_phone = Column(String)
    citizen_address = Column(String)

    # Image & location
    image_filename = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)

    # AI detection
    damage_type = Column(String, default="Pending Analysis")
    severity_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)

    # Complaint metadata
    description = Column(Text)
    mcd_zone = Column(String, default="South MCD")
    status = Column(String, default="new")  # new | progress | resolved | rejected
    progress_detail = Column(Text, default="")
    progress_percent = Column(Integer, default=0)
    rejection_reason = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AdminUser(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True)
    officer_id = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String)
    email = Column(String)


def init_db():
    """Create all tables and seed a default admin if none exists."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if not db.query(AdminUser).first():
        db.add(AdminUser(
            officer_id="admin",
            password="mcd@2026",
            name="Head Officer",
            email="admin@mcd.gov.in"
        ))
        db.commit()
    db.close()
