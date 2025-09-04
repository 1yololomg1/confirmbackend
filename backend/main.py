from fastapi import FastAPI, HTTPException, Request
from supabase import create_client, Client
import os
import hashlib
import hmac
import datetime
import stripe
import smtplib
from email.mime.text import MIMEText
from pydantic import BaseModel

app = FastAPI()

# Supabase connection
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY") 
supabase: Client = create_client(url, key)

class LicenseRequest(BaseModel):
    machine_id: str

@app.post("/verify-license")
async def verify_license(data: LicenseRequest):
    machine_id = data.machine_id
    
    result = supabase.table("licenses").select("*").eq("machine_id", machine_id).execute()
    
    if result.data and result.data[0]["paid"]:
        return {"status": "valid"}
    else:
        return {"status": "trial", "buy_url": "https://buy.stripe.com/your-link"}

@app.post("/stripe-webhook")
async def handle_stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    event = stripe.Webhook.construct_event(
        payload, sig_header, os.environ.get("STRIPE_WEBHOOK_SECRET")
    )
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        customer_email = session['customer_details']['email']
        
        license_key = generate_license_key(customer_email)
        
        supabase.table("licenses").insert({
            "email": customer_email,
            "license_key": license_key,
            "paid": True
        }).execute()
        
        send_license_email(customer_email, license_key)
    
    return {"status": "success"}

def generate_license_key(email: str) -> str:
    secret = os.environ.get("LICENSE_SECRET", "your-secret")
    return hmac.new(secret.encode(), email.encode(), hashlib.sha256).hexdigest()[:16].upper()

def send_license_email(email: str, license_key: str):
    msg = MIMEText(f"Your CONFIRM license key: {license_key}")
    msg['Subject'] = 'Your CONFIRM License'
    msg['From'] = 'noreply@deltavsolutions.com'
    msg['To'] = email
    
    # Configure your email here
    pass