from datetime import datetime
from app import db
from sqlalchemy import String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

class User(db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    cognome: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    ruolo: Mapped[str] = mapped_column(String(30), default="tecnico")
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    technician = relationship("Technician", back_populates="user", uselist=False)
    projects = relationship("Project", back_populates="creator")


class Technician(db.Model):
    __tablename__ = "technicians"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    nome_pubblico: Mapped[str] = mapped_column(String(150), nullable=False)
    ruolo_pubblico: Mapped[str] = mapped_column(String(150), nullable=False)
    descrizione_breve: Mapped[str] = mapped_column(Text, default="")
    anni_esperienza: Mapped[int] = mapped_column(Integer, default=0)
    competenze: Mapped[str] = mapped_column(Text, default="")
    foto: Mapped[str] = mapped_column(String(255), default="")
    ordine_visualizzazione: Mapped[int] = mapped_column(Integer, default=0)
    visibile_pubblico: Mapped[bool] = mapped_column(Boolean, default=True)

    user = relationship("User", back_populates="technician")


class QuoteRequest(db.Model):
    __tablename__ = "quote_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    telefono: Mapped[str] = mapped_column(String(50), default="")
    email: Mapped[str] = mapped_column(String(150), nullable=False)
    comune: Mapped[str] = mapped_column(String(150), default="")
    indirizzo: Mapped[str] = mapped_column(String(255), default="")
    tipologia_lavoro: Mapped[str] = mapped_column(String(150), default="")
    urgenza: Mapped[str] = mapped_column(String(50), default="")
    descrizione: Mapped[str] = mapped_column(Text, nullable=False)
    budget: Mapped[str] = mapped_column(String(100), default="")
    stato: Mapped[str] = mapped_column(String(50), default="nuova")
    note_interne: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    attachments = relationship("QuoteAttachment", back_populates="quote_request", cascade="all, delete-orphan")


class QuoteAttachment(db.Model):
    __tablename__ = "quote_attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    quote_request_id: Mapped[int] = mapped_column(ForeignKey("quote_requests.id"), nullable=False)
    nome_file_originale: Mapped[str] = mapped_column(String(255), default="")
    nome_file_salvato: Mapped[str] = mapped_column(String(255), default="")
    percorso_file: Mapped[str] = mapped_column(String(255), default="")
    mime_type: Mapped[str] = mapped_column(String(100), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    quote_request = relationship("QuoteRequest", back_populates="attachments")


class Project(db.Model):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    titolo: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=False)
    categoria: Mapped[str] = mapped_column(String(100), default="")
    luogo: Mapped[str] = mapped_column(String(150), default="")
    descrizione_breve: Mapped[str] = mapped_column(Text, default="")
    descrizione_completa: Mapped[str] = mapped_column(Text, default="")
    stato: Mapped[str] = mapped_column(String(50), default="bozza")
    visibile_pubblico: Mapped[bool] = mapped_column(Boolean, default=False)
    in_evidenza: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="projects")
    photos = relationship("ProjectPhoto", back_populates="project", cascade="all, delete-orphan")


class ProjectPhoto(db.Model):
    __tablename__ = "project_photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    caption: Mapped[str] = mapped_column(String(255), default="")
    tipo: Mapped[str] = mapped_column(String(50), default="avanzamento")
    ordine: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="photos")


class SiteSetting(db.Model):
    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    chiave: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    valore: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)