import os, uuid, random, smtplib, datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from database import init_db, SessionLocal, Complaint, AdminUser

# ─── App Setup ──────────────────────────────────────────────────────────
app = FastAPI(title="GeoRoad AI – Road Damage Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "GeoRoad AI Backend API is Running",
        "docs": "http://127.0.0.1:8000/docs",
        "all_complaints_api": "http://127.0.0.1:8000/api/admin/complaints"
    }

if os.getenv("VERCEL"):
    UPLOAD_DIR = Path("/tmp/uploads")
else:
    UPLOAD_DIR = Path(__file__).parent / "uploads"

UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Auto-initialize DB on serverless invocation if needed
init_db()

# In-memory OTP store  { email: { otp, expires } }
otp_store: dict = {}

# ─── Email Utility ──────────────────────────────────────────────────────
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))


def send_email(to_email: str, subject: str, body_html: str):
    """Send an email via SMTP. Silently fails if SMTP is not configured."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"[EMAIL MOCK] To: {to_email} | Subject: {subject}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body_html, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")


# ─── Startup ────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    init_db()


# ─── Pydantic Models ───────────────────────────────────────────────────
class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class AdminLogin(BaseModel):
    officer_id: str
    password: str

class ForgotPassword(BaseModel):
    email: str

class StatusUpdate(BaseModel):
    status: str            # progress | resolved | rejected
    detail: str = ""       # progress note or rejection reason


# ═══════════════════════════════════════════════════════════════════════
# CITIZEN ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/otp/send")
def send_otp(req: OTPRequest):
    code = str(random.randint(1000, 9999))
    otp_store[req.email] = {
        "otp": code,
        "expires": datetime.datetime.utcnow() + datetime.timedelta(minutes=5),
    }
    send_email(
        req.email,
        "GeoRoad AI – Your Verification Code",
        f"<h2>Your OTP is: <b>{code}</b></h2><p>Valid for 5 minutes.</p>",
    )
    # For demo / testing, we also return it (remove in production)
    return {"message": "OTP sent", "otp_debug": code}


@app.post("/api/otp/verify")
def verify_otp(req: OTPVerify):
    record = otp_store.get(req.email)
    if not record:
        raise HTTPException(400, "No OTP found. Please request a new one.")
    if datetime.datetime.utcnow() > record["expires"]:
        raise HTTPException(400, "OTP has expired. Please request a new one.")
    if record["otp"] != req.otp:
        raise HTTPException(400, "Invalid OTP. Please try again.")
    del otp_store[req.email]
    return {"message": "Verified", "email": req.email}


@app.post("/api/complaint")
async def create_complaint(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    address: str = Form(""),
    description: str = Form(""),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(...),
):
    # Save uploaded image
    ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(await image.read())

    # Generate ticket ID
    ticket_id = f"MCD-{random.randint(1000, 9999)}"

    # ─── YOLOv8 AI Analysis ───
    model_path = Path(__file__).parent / "best.pt"
    
    if model_path.exists():
        try:
            from ultralytics import YOLO
            model = YOLO(str(model_path))
            results = model(str(filepath))
            
            if len(results[0].boxes) > 0:
                # Get the detection with the highest confidence
                best_box = max(results[0].boxes, key=lambda x: x.conf[0])
                class_id = int(best_box.cls[0])
                confidence = round(float(best_box.conf[0]), 2)
                
                # Standard RDD2022 defect classes as per your image
                class_map = {
                    0: "Longitudinal Cracks (D00)",
                    1: "Transverse Cracks (D10)",
                    2: "Alligator Cracks (D20)",
                    3: "Potholes (D40)"
                }
                chosen_type = class_map.get(class_id, "Unknown Damage")
                
                # Calculate severity based on bounding box size relative to the image
                img_h, img_w = results[0].orig_shape
                box_w, box_h = best_box.xywh[0][2], best_box.xywh[0][3]
                area_ratio = float((box_w * box_h) / (img_w * img_h))
                # Scale it up for a realistic score (0.0 to 1.0)
                severity = round(min(max(area_ratio * 5, 0.3), 0.99), 2)
                
                # Optionally, save the image with bounding boxes drawn
                annotated_filepath = UPLOAD_DIR / f"annotated_{filename}"
                results[0].save(str(annotated_filepath))
                filename = f"annotated_{filename}"  # Serve the annotated image to the dashboard
                
            else:
                chosen_type = "No Damage Detected"
                confidence = 1.0
                severity = 0.0
        except Exception as e:
            print(f"YOLO Inference Error: {e}")
            chosen_type = "Analysis Failed"
            severity = 0.0
            confidence = 0.0
    else:
        # Fallback to simulation if you haven't placed 'best.pt' in the backend folder yet
        damage_types = [
            "Longitudinal Cracks (D00)", 
            "Transverse Cracks (D10)", 
            "Alligator (Fatigue) Cracks (D20)", 
            "Potholes (D40)"
        ]
        chosen_type = random.choice(damage_types)
        severity = round(random.uniform(0.4, 0.99), 2)
        confidence = round(random.uniform(0.7, 0.99), 2)

    # Zone routing based on latitude (simplified)
    if latitude > 28.7:
        zone = "North MCD"
    elif latitude > 28.5:
        zone = "Central MCD"
    else:
        zone = "South MCD"

    db = SessionLocal()
    complaint = Complaint(
        ticket_id=ticket_id,
        citizen_name=name,
        citizen_email=email,
        citizen_phone=phone,
        citizen_address=address,
        image_filename=filename,
        latitude=latitude,
        longitude=longitude,
        description=description,
        damage_type=chosen_type,
        severity_score=severity,
        confidence=confidence,
        mcd_zone=zone,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    db.close()

    # Send confirmation email
    send_email(
        email,
        f"GeoRoad AI – Ticket {ticket_id} Submitted",
        f"""
        <h2>Complaint Registered Successfully</h2>
        <p><b>Ticket ID:</b> {ticket_id}</p>
        <p><b>Damage Detected:</b> {chosen_type} (Severity {int(severity*100)}%)</p>
        <p><b>Routed to:</b> {zone}</p>
        <p>You will receive email updates as your issue progresses.</p>
        """,
    )

    return {
        "ticket_id": ticket_id,
        "damage_type": chosen_type,
        "severity_score": severity,
        "confidence": confidence,
        "mcd_zone": zone,
    }


@app.get("/api/complaint/{ticket_id}")
def get_complaint(ticket_id: str):
    db = SessionLocal()
    c = db.query(Complaint).filter(Complaint.ticket_id == ticket_id).first()
    db.close()
    if not c:
        raise HTTPException(404, "Ticket not found")
    return _complaint_to_dict(c)


# ═══════════════════════════════════════════════════════════════════════
# ADMIN ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/admin/login")
def admin_login(req: AdminLogin):
    db = SessionLocal()
    admin = db.query(AdminUser).filter(
        AdminUser.officer_id == req.officer_id,
        AdminUser.password == req.password,
    ).first()
    db.close()
    if not admin:
        raise HTTPException(401, "Invalid Officer ID or Password.")
    return {"message": "Authenticated", "name": admin.name}


@app.post("/api/admin/forgot-password")
def forgot_password(req: ForgotPassword):
    db = SessionLocal()
    admin = db.query(AdminUser).filter(AdminUser.email == req.email).first()
    db.close()
    if not admin:
        raise HTTPException(404, "No admin account with this email.")
    send_email(
        req.email,
        "GeoRoad AI – Password Recovery",
        f"<h2>Your Login Credentials</h2><p><b>Officer ID:</b> {admin.officer_id}</p><p><b>Password:</b> {admin.password}</p>",
    )
    return {"message": "Password sent to your email."}


@app.get("/api/admin/complaints")
def list_complaints(status: str = None):
    db = SessionLocal()
    query = db.query(Complaint).order_by(Complaint.created_at.desc())
    if status:
        query = query.filter(Complaint.status == status)
    results = [_complaint_to_dict(c) for c in query.all()]
    db.close()
    return results


@app.put("/api/admin/complaint/{ticket_id}")
def update_complaint_status(ticket_id: str, update: StatusUpdate):
    db = SessionLocal()
    c = db.query(Complaint).filter(Complaint.ticket_id == ticket_id).first()
    if not c:
        db.close()
        raise HTTPException(404, "Ticket not found")

    old_status = c.status
    c.status = update.status
    c.updated_at = datetime.datetime.utcnow()

    if update.status == "progress":
        c.progress_detail = update.detail or "Work has been initiated by the field team."
        c.progress_percent = random.randint(15, 85)
    elif update.status == "resolved":
        c.progress_detail = update.detail or "Issue has been fully resolved."
        c.progress_percent = 100
    elif update.status == "rejected":
        c.rejection_reason = update.detail or "Complaint does not meet actionable criteria."

    db.commit()

    # Notify citizen via email
    status_labels = {"progress": "In Progress", "resolved": "Resolved", "rejected": "Rejected"}
    send_email(
        c.citizen_email,
        f"GeoRoad AI – Ticket {ticket_id} Status: {status_labels.get(update.status, update.status)}",
        f"""
        <h2>Your Ticket {ticket_id} has been updated</h2>
        <p><b>New Status:</b> {status_labels.get(update.status, update.status)}</p>
        <p><b>Details:</b> {update.detail or c.progress_detail or c.rejection_reason}</p>
        <p>Thank you for using GeoRoad AI.</p>
        """,
    )

    db.close()
    return {"message": f"Ticket {ticket_id} updated to {update.status}"}


# ─── Helpers ────────────────────────────────────────────────────────────
def _complaint_to_dict(c: Complaint) -> dict:
    return {
        "ticket_id": c.ticket_id,
        "citizen_name": c.citizen_name,
        "citizen_email": c.citizen_email,
        "citizen_phone": c.citizen_phone,
        "citizen_address": c.citizen_address,
        "image_url": f"/uploads/{c.image_filename}" if c.image_filename else None,
        "latitude": c.latitude,
        "longitude": c.longitude,
        "description": c.description,
        "damage_type": c.damage_type,
        "severity_score": c.severity_score,
        "confidence": c.confidence,
        "mcd_zone": c.mcd_zone,
        "status": c.status,
        "progress_detail": c.progress_detail,
        "progress_percent": c.progress_percent,
        "rejection_reason": c.rejection_reason,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }
