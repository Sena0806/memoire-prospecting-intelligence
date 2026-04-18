import os
import re
import json
import unicodedata
from typing import Optional
from contextlib import asynccontextmanager

import httpx
import boto3
import gspread
from google.oauth2.service_account import Credentials
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Google Sheets client (lazy singleton)
# ---------------------------------------------------------------------------

_gc: Optional[gspread.Client] = None

SHEETS_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
]

SHEET_HEADERS = ["id", "company", "contact", "outcome", "note", "addedBy", "addedDate", "campaignName"]


def _sheets_client() -> gspread.Client:
    global _gc
    if _gc is None:
        raw = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
        if not raw:
            raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON not set")
        info = json.loads(raw)
        creds = Credentials.from_service_account_info(info, scopes=SHEETS_SCOPES)
        _gc = gspread.authorize(creds)
    return _gc


def _get_sheet() -> gspread.Worksheet:
    sheet_id = os.getenv("GOOGLE_SHEETS_ID", "")
    if not sheet_id:
        raise ValueError("GOOGLE_SHEETS_ID not set")
    gc = _sheets_client()
    spreadsheet = gc.open_by_key(sheet_id)
    try:
        ws = spreadsheet.worksheet("memories")
    except gspread.WorksheetNotFound:
        ws = spreadsheet.add_worksheet(title="memories", rows=1000, cols=len(SHEET_HEADERS))
        ws.append_row(SHEET_HEADERS)
    return ws


def _ensure_headers(ws: gspread.Worksheet) -> None:
    first_row = ws.row_values(1)
    if first_row != SHEET_HEADERS:
        ws.insert_row(SHEET_HEADERS, index=1)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="Mémoire Prospecting API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class CampaignRequest(BaseModel):
    sector: str
    area: str
    count: int
    pitch: str
    tone: str
    je_name: str = "Centrale Nantes Études"
    je_email: str = "contact@centralenantes-etudes.fr"
    je_signature: str = "L'équipe commerciale — Centrale Nantes Études"
    bedrock_model: str = "Claude 3.5 Sonnet"
    bedrock_region: str = "us-west-2"


class ProspectOut(BaseModel):
    id: str
    firstName: str
    lastName: str
    position: str
    company: str
    email: str
    status: str = "pending"
    emailSubject: str = ""
    emailBody: str = ""


class CampaignResponse(BaseModel):
    campaignName: str
    prospects: list[ProspectOut]


class SendEmailRequest(BaseModel):
    to_email: str
    from_email: str
    subject: str
    body: str
    demo_redirect: str = ""  # if set, redirect all mail here


class SendAllRequest(BaseModel):
    prospects: list[ProspectOut]
    from_email: str
    demo_redirect: str = ""  # if set, redirect all mail here


class SendAllResponse(BaseModel):
    sent: int
    failed: int
    results: list[dict]


class MemoryEntryIn(BaseModel):
    id: str
    company: str
    contact: str
    outcome: str  # "signed" | "followup" | "rejected"
    note: str
    addedBy: str
    addedDate: str
    campaignName: str = ""


class MemoryEntryOut(MemoryEntryIn):
    pass


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", _normalize(text).lower())


def _company_domain(company_name: str) -> str:
    """Build a realistic email domain from a company name."""
    # Remove common legal suffixes
    cleaned = re.sub(
        r"\b(SAS|SARL|SA|SNC|SASU|EURL|SCI|GIE|EI|SEL|EARL|GAEC)\b",
        "", company_name, flags=re.IGNORECASE
    ).strip()
    # Take meaningful words (skip articles, conjunctions)
    stopwords = {"de", "du", "des", "le", "la", "les", "et", "en", "sur", "l", "d"}
    words = [w for w in re.split(r"[\s\-_/()]+", cleaned) if w and _slug(w) not in stopwords]
    # Use acronym if company name has parenthetical abbreviation e.g. "VENDEE MECANIQUE (VMI)"
    acronym_match = re.search(r"\(([A-Z]{2,6})\)", company_name)
    if acronym_match:
        return f"{acronym_match.group(1).lower()}.fr"
    # Use first meaningful word + optional second word if short
    if not words:
        return "contact.fr"
    slug1 = _slug(words[0])
    if len(words) > 1 and len(slug1) < 5:
        slug2 = _slug(words[1])
        return f"{slug1}{slug2}.fr"
    return f"{slug1}.fr"


def _build_email(first: str, last: str, company_name: str) -> str:
    f = _slug(first)
    l = _slug(last)
    domain = _company_domain(company_name)
    return f"{f}.{l}@{domain}"


# ---------------------------------------------------------------------------
# Prospect search — recherche-entreprises.api.gouv.fr (no auth required)
# ---------------------------------------------------------------------------

SEARCH_URL = "https://recherche-entreprises.api.gouv.fr/search"

PRIORITY_TITLES = [
    "directeur", "président", "pdg", "dg", "ceo", "cto", "coo",
    "responsable", "manager", "chef", "directrice", "gérant",
]

# NAF-based position fallback labels
NAF_POSITIONS: dict[str, str] = {
    "28": "Directeur de Production",
    "29": "Directeur Technique",
    "25": "Directeur Industriel",
    "27": "Directeur Technique",
    "33": "Responsable Maintenance",
    "22": "Directeur de Production",
    "24": "Directeur Industriel",
    "62": "Directeur des Systèmes d'Information",
    "70": "Directeur Général",
    "71": "Directeur de Bureau d'Études",
    "73": "Directeur R&D",
    "74": "Directeur de Projets",
}


def _best_contact(dirigeants: list[dict]) -> Optional[dict]:
    """Return the highest-priority director from the list."""
    for title in PRIORITY_TITLES:
        for d in dirigeants:
            if title in str(d.get("qualite", "")).lower():
                if d.get("nom") and d.get("prenoms"):
                    return d
    # Return first with a name
    for d in dirigeants:
        if d.get("nom") and d.get("prenoms"):
            return d
    return None


async def search_prospects(sector: str, area: str, count: int) -> list[dict]:
    city = area.split(",")[0].strip()
    prospects: list[dict] = []
    seen: set[str] = set()

    async with httpx.AsyncClient(timeout=25.0) as client:
        queries = [f"{sector} {city}", f"{sector}", f"ingénierie {city}"]
        for query in queries:
            if len(prospects) >= count:
                break
            params = {"q": query, "per_page": 25}
            try:
                resp = await client.get(SEARCH_URL, params=params)
                resp.raise_for_status()
                results = resp.json().get("results", [])
            except Exception as exc:
                print(f"[search] error: {exc}")
                continue

            for company_data in results:
                if len(prospects) >= count:
                    break

                company_name: str = company_data.get("nom_complet", "").strip()
                if not company_name or company_name in seen:
                    continue

                dirigeants: list[dict] = company_data.get("dirigeants", [])
                contact = _best_contact(dirigeants)

                # Skip companies with no named contact
                if not contact:
                    continue

                seen.add(company_name)

                first = contact["prenoms"].split()[0].capitalize()
                last = contact["nom"].capitalize()

                qualite = contact.get("qualite", "").strip()
                # Use qualite if meaningful, else fallback by NAF code
                if qualite and len(qualite) > 3:
                    position = qualite.capitalize()
                else:
                    naf = str(company_data.get("activite_principale", ""))[:2]
                    position = NAF_POSITIONS.get(naf, "Directeur Général")

                email = _build_email(first, last, company_name)
                siege = company_data.get("siege", {})

                prospects.append({
                    "id": f"p{len(prospects)+1}",
                    "firstName": first,
                    "lastName": last,
                    "position": position,
                    "company": company_name,
                    "email": email,
                    "city": siege.get("libelle_commune", city),
                    "naf": company_data.get("activite_principale", ""),
                })

    return prospects


# ---------------------------------------------------------------------------
# Email generation — Amazon Bedrock (Claude)
# ---------------------------------------------------------------------------

BEDROCK_MODEL_IDS = {
    "Claude 3.5 Sonnet": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "Claude 3 Haiku":    "anthropic.claude-3-haiku-20240307-v1:0",
    "Claude 3 Sonnet":   "anthropic.claude-3-sonnet-20240229-v1:0",
}

TONE_MAP = {
    "Professionnel et formel":  "formel, soutenu et professionnel",
    "Professionnel et amical":  "professionnel mais chaleureux et accessible",
    "Direct et concis":         "direct et percutant, 3 paragraphes maximum",
}


def generate_email(
    prospect: dict,
    sector: str,
    pitch: str,
    tone: str,
    je_name: str,
    je_signature: str,
    model_label: str,
    region: str,
) -> tuple[str, str]:
    model_id = BEDROCK_MODEL_IDS.get(model_label, BEDROCK_MODEL_IDS["Claude 3.5 Sonnet"])
    tone_desc = TONE_MAP.get(tone, "professionnel")
    name = f"{prospect['firstName']} {prospect['lastName']}".strip()
    position = prospect["position"]
    company = prospect["company"]

    prompt = f"""Tu es un expert en prospection B2B pour une Junior-Entreprise d'ingénierie française.

Génère un email de prospection commerciale TRÈS personnalisé :

Destinataire : {name}, {position} chez {company}
Secteur ciblé : {sector}
Organisation : {je_name}
Pitch : {pitch}
Ton : {tone_desc}
Signature : {je_signature}

Règles STRICTES :
1. Commence par "Bonjour {prospect['firstName']},"
2. La 1ère phrase mentionne EXPLICITEMENT le rôle "{position}" et l'entreprise "{company}"
3. Présente {je_name} en une phrase naturelle
4. Propose une collaboration concrète en lien avec le secteur {sector} et le rôle du destinataire
5. Termine avec une invitation à un échange de 15 min la semaine prochaine
6. MAXIMUM 160 mots corps + signature
7. L'objet doit mentionner "{company}" ou "{sector}" — jamais générique

Réponds UNIQUEMENT avec du JSON valide (sans markdown, sans backticks) :
{{"subject": "...", "body": "..."}}"""

    bedrock = boto3.client(
        "bedrock-runtime",
        region_name=region,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
    )

    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": prompt}],
    }
    resp = bedrock.invoke_model(
        modelId=model_id,
        body=json.dumps(payload),
        contentType="application/json",
        accept="application/json",
    )
    raw = json.loads(resp["body"].read())
    text: str = raw["content"][0]["text"].strip()

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group())
            subject = data.get("subject", "")
            body = data.get("body", text)
            if subject and body:
                return subject, body
        except json.JSONDecodeError:
            pass

    return f"Proposition de collaboration — {company}", text


# ---------------------------------------------------------------------------
# Email sending — Resend
# ---------------------------------------------------------------------------

def send_via_resend(
    to_email: str, from_email: str, subject: str, body: str, demo_redirect: str = ""
) -> None:
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        raise ValueError("RESEND_API_KEY not set")

    actual_to = demo_redirect if demo_redirect else to_email
    actual_subject = f"[DEMO → {to_email}] {subject}" if demo_redirect else subject

    with httpx.Client(timeout=15.0) as client:
        resp = client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_email,
                "to": [actual_to],
                "subject": actual_subject,
                "text": body,
            },
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Resend {resp.status_code}: {resp.text}")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "bedrock_region": os.getenv("AWS_DEFAULT_REGION", "us-west-2")}


@app.post("/api/run-campaign", response_model=CampaignResponse)
async def run_campaign(req: CampaignRequest):
    raw = await search_prospects(req.sector, req.area, req.count)
    if not raw:
        raise HTTPException(404, "Aucun prospect trouvé pour ce secteur / cette zone")

    region = req.bedrock_region.split(" ")[0]

    prospects_out: list[ProspectOut] = []
    for p in raw:
        try:
            subject, body = generate_email(
                prospect=p,
                sector=req.sector,
                pitch=req.pitch,
                tone=req.tone,
                je_name=req.je_name,
                je_signature=req.je_signature,
                model_label=req.bedrock_model,
                region=region,
            )
        except Exception as exc:
            print(f"[bedrock] {p['company']}: {exc}")
            subject = f"Proposition de collaboration — {p['company']}"
            body = (
                f"Bonjour {p['firstName']},\n\n"
                f"{req.pitch}\n\n"
                f"Seriez-vous disponible pour un échange de 15 min ?\n\n"
                f"{req.je_signature}"
            )

        prospects_out.append(ProspectOut(
            id=p["id"],
            firstName=p["firstName"],
            lastName=p["lastName"],
            position=p["position"],
            company=p["company"],
            email=p["email"],
            status="pending",
            emailSubject=subject,
            emailBody=body,
        ))

    return CampaignResponse(
        campaignName=f"{req.sector} × {req.area}",
        prospects=prospects_out,
    )


@app.post("/api/send-email")
async def send_email(req: SendEmailRequest):
    try:
        send_via_resend(req.to_email, req.from_email, req.subject, req.body, req.demo_redirect)
        return {"success": True}
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    except Exception as exc:
        raise HTTPException(500, str(exc))


@app.post("/api/send-all", response_model=SendAllResponse)
async def send_all(req: SendAllRequest):
    """Send emails to all pending prospects."""
    sent = 0
    failed = 0
    results = []

    for p in req.prospects:
        if p.status == "sent":
            continue
        try:
            send_via_resend(p.email, req.from_email, p.emailSubject, p.emailBody, req.demo_redirect)
            results.append({"id": p.id, "success": True})
            sent += 1
        except Exception as exc:
            results.append({"id": p.id, "success": False, "error": str(exc)})
            failed += 1

    return SendAllResponse(sent=sent, failed=failed, results=results)


# ---------------------------------------------------------------------------
# Memory (Google Sheets)
# ---------------------------------------------------------------------------

@app.get("/api/memories", response_model=list[MemoryEntryOut])
async def get_memories():
    """Fetch all memory entries from Google Sheets."""
    try:
        ws = _get_sheet()
        _ensure_headers(ws)
        rows = ws.get_all_records(expected_headers=SHEET_HEADERS)
        return [MemoryEntryOut(**{k: str(v) for k, v in row.items()}) for row in rows]
    except ValueError as exc:
        raise HTTPException(503, f"Google Sheets non configuré : {exc}")
    except Exception as exc:
        raise HTTPException(500, f"Erreur Google Sheets : {exc}")


@app.post("/api/memories", response_model=MemoryEntryOut, status_code=201)
async def add_memory(entry: MemoryEntryIn):
    """Append a new memory entry to Google Sheets."""
    try:
        ws = _get_sheet()
        _ensure_headers(ws)
        row = [
            entry.id,
            entry.company,
            entry.contact,
            entry.outcome,
            entry.note,
            entry.addedBy,
            entry.addedDate,
            entry.campaignName,
        ]
        ws.append_row(row, value_input_option="RAW")
        return MemoryEntryOut(**entry.model_dump())
    except ValueError as exc:
        raise HTTPException(503, f"Google Sheets non configuré : {exc}")
    except Exception as exc:
        raise HTTPException(500, f"Erreur Google Sheets : {exc}")
