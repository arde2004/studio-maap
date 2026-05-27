import os
import uuid

from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

import cloudinary
import cloudinary.uploader


from app import db
from app.models import QuoteRequest, QuoteAttachment, Project, ProjectPhoto, SiteSetting

api_bp = Blueprint("api", __name__)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

ALLOWED_EXTENSIONS = {
    "png", "jpg", "jpeg", "webp", "pdf", "doc", "docx"
}

IMAGE_EXTENSIONS = {
    "png", "jpg", "jpeg", "webp"
}


def allowed_file(filename, allowed_set):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_set


@api_bp.route("/api/preventivo", methods=["POST"])
def api_preventivo():
    try:
        nome = (request.form.get("nome") or "").strip()
        telefono = (request.form.get("telefono") or "").strip()
        email = (request.form.get("email") or "").strip()
        comune = (request.form.get("comune") or "").strip()
        tipologia = (request.form.get("tipologia") or "").strip()
        urgenza = (request.form.get("urgenza") or "").strip()
        descrizione = (request.form.get("descrizione") or "").strip()
        budget = (request.form.get("budget") or "").strip()

        if not nome or not email or not descrizione:
            return jsonify({
                "ok": False,
                "messaggio": "Compila almeno nome, email e descrizione del lavoro."
            }), 400

        richiesta = QuoteRequest(
            nome=nome,
            telefono=telefono,
            email=email,
            comune=comune,
            tipologia_lavoro=tipologia,
            urgenza=urgenza,
            descrizione=descrizione,
            budget=budget,
            stato="nuova"
        )

        db.session.add(richiesta)
        db.session.flush()

        file = request.files.get("file")
        if file and file.filename:
            if not allowed_file(file.filename, ALLOWED_EXTENSIONS):
                return jsonify({
                    "ok": False,
                    "messaggio": "Formato file non supportato."
                }), 400

            original_name = secure_filename(file.filename)
            ext = original_name.rsplit(".", 1)[1].lower()
            saved_name = f"{uuid.uuid4().hex}.{ext}"

            upload_dir = os.path.join(current_app.static_folder, "uploads", "preventivi")
            os.makedirs(upload_dir, exist_ok=True)

            full_path = os.path.join(upload_dir, saved_name)
            file.save(full_path)

            allegato = QuoteAttachment(
                quote_request_id=richiesta.id,
                nome_file_originale=original_name,
                nome_file_salvato=saved_name,
                percorso_file=f"uploads/preventivi/{saved_name}",
                mime_type=file.mimetype or ""
            )
            db.session.add(allegato)

        db.session.commit()

        return jsonify({
            "ok": True,
            "messaggio": "Richiesta inviata correttamente."
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500


@api_bp.route("/api/richieste", methods=["GET"])
def api_richieste():
    try:
        richieste = (
            QuoteRequest.query
            .order_by(QuoteRequest.created_at.desc())
            .all()
        )

        risultato = []
        for r in richieste:
            risultato.append({
                "id": r.id,
                "nome": r.nome,
                "telefono": r.telefono,
                "email": r.email,
                "comune": r.comune,
                "tipologia_lavoro": r.tipologia_lavoro,
                "urgenza": r.urgenza,
                "descrizione": r.descrizione,
                "budget": r.budget,
                "stato": r.stato,
                "created_at": r.created_at.strftime("%d/%m/%Y %H:%M") if r.created_at else ""
            })

        return jsonify({
            "ok": True,
            "richieste": risultato
        })

    except Exception as e:
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500


@api_bp.route("/api/projects", methods=["GET"])
def api_projects():
    try:
        projects = Project.query.order_by(Project.created_at.desc()).all()

        risultato = []
        for p in projects:
            risultato.append({
                "id": p.id,
                "titolo": p.titolo,
                "slug": p.slug,
                "categoria": p.categoria or "",
                "luogo": p.luogo or "",
                "descrizione_breve": p.descrizione_breve or "",
                "stato": p.stato or "",
                "visibile_pubblico": p.visibile_pubblico
            })

        return jsonify({
            "ok": True,
            "projects": risultato
        })

    except Exception as e:
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500


@api_bp.route("/api/projects", methods=["POST"])
def api_create_project():
    try:
        titolo = (request.form.get("titolo") or "").strip()
        categoria = (request.form.get("categoria") or "").strip()
        luogo = (request.form.get("luogo") or "").strip()
        descrizione_breve = (request.form.get("descrizione_breve") or "").strip()

        if not titolo:
            return jsonify({
                "ok": False,
                "messaggio": "Inserisci almeno il titolo del cantiere."
            }), 400

        slug_base = secure_filename(titolo.lower()).replace("_", "-")
        slug = slug_base if slug_base else f"cantiere-{uuid.uuid4().hex[:8]}"

        existing = Project.query.filter_by(slug=slug).first()
        if existing:
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        project = Project(
            titolo=titolo,
            slug=slug,
            categoria=categoria,
            luogo=luogo,
            descrizione_breve=descrizione_breve,
            descrizione_completa=descrizione_breve,
            stato="pubblicato",
            visibile_pubblico=True,
            in_evidenza=False,
            created_by=1
        )

        db.session.add(project)
        db.session.commit()

        return jsonify({
            "ok": True,
            "messaggio": "Cantiere creato correttamente."
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500


@api_bp.route("/api/upload-photo", methods=["POST"])
def api_upload_photo():
    try:
        project_id = request.form.get("project_id")
        tipo = (request.form.get("tipo") or "").strip()
        caption = (request.form.get("caption") or "").strip()

        if not project_id:
            return jsonify({
                "ok": False,
                "messaggio": "Seleziona un cantiere."
            }), 400

        project = Project.query.get(project_id)
        if not project:
            return jsonify({
                "ok": False,
                "messaggio": "Cantiere non trovato."
            }), 404

        file = request.files.get("file")
        if not file or not file.filename:
            return jsonify({
                "ok": False,
                "messaggio": "Seleziona un'immagine da caricare."
            }), 400

        if not allowed_file(file.filename, IMAGE_EXTENSIONS):
            return jsonify({
                "ok": False,
                "messaggio": "Formato immagine non supportato."
            }), 400

        original_name = secure_filename(file.filename)

        upload_result = cloudinary.uploader.upload(
            file,
            folder="studio-maap/cantieri",
            resource_type="image"
        )

        image_url = upload_result.get("secure_url")

        if not image_url:
            return jsonify({
                "ok": False,
                "messaggio": "Errore durante il caricamento su Cloudinary."
            }), 500

        foto = ProjectPhoto(
            project_id=project.id,
            file_name=original_name,
            file_path=image_url,
            caption=caption,
            tipo=tipo or "avanzamento",
            ordine=0
        )

        db.session.add(foto)
        db.session.commit()

        return jsonify({
            "ok": True,
            "messaggio": "Immagine caricata correttamente."
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500
    
@api_bp.route("/api/projects/<int:project_id>", methods=["GET"])
def api_project_detail(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({
                "ok": False,
                "messaggio": "Cantiere non trovato."
            }), 404

        return jsonify({
            "ok": True,
            "project": {
                "id": project.id,
                "titolo": project.titolo,
                "slug": project.slug,
                "categoria": project.categoria or "",
                "luogo": project.luogo or "",
                "descrizione_breve": project.descrizione_breve or "",
                "descrizione_completa": project.descrizione_completa or "",
                "stato": project.stato or "",
                "visibile_pubblico": project.visibile_pubblico,
                "in_evidenza": project.in_evidenza
            }
        })

    except Exception as e:
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500


@api_bp.route("/api/projects/<int:project_id>", methods=["POST"])
def api_update_project(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({
                "ok": False,
                "messaggio": "Cantiere non trovato."
            }), 404

        titolo = (request.form.get("titolo") or "").strip()
        categoria = (request.form.get("categoria") or "").strip()
        luogo = (request.form.get("luogo") or "").strip()
        descrizione_breve = (request.form.get("descrizione_breve") or "").strip()

        if not titolo:
            return jsonify({
                "ok": False,
                "messaggio": "Il titolo è obbligatorio."
            }), 400

        project.titolo = titolo
        project.categoria = categoria
        project.luogo = luogo
        project.descrizione_breve = descrizione_breve
        project.descrizione_completa = descrizione_breve or project.descrizione_completa

        db.session.commit()

        return jsonify({
            "ok": True,
            "messaggio": "Cantiere aggiornato correttamente."
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500


@api_bp.route("/api/projects/<int:project_id>/toggle-public", methods=["POST"])
def api_toggle_project_public(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({
                "ok": False,
                "messaggio": "Cantiere non trovato."
            }), 404

        project.visibile_pubblico = not bool(project.visibile_pubblico)
        db.session.commit()

        return jsonify({
            "ok": True,
            "messaggio": "Visibilità aggiornata correttamente.",
            "visibile_pubblico": project.visibile_pubblico
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500


@api_bp.route("/api/projects/<int:project_id>/delete", methods=["POST"])
def api_delete_project(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({
                "ok": False,
                "messaggio": "Cantiere non trovato."
            }), 404

        for photo in project.photos:
            if photo.file_path:
                full_path = os.path.join(current_app.static_folder, photo.file_path)
                if os.path.exists(full_path):
                    try:
                        os.remove(full_path)
                    except Exception:
                        pass

        db.session.delete(project)
        db.session.commit()

        return jsonify({
            "ok": True,
            "messaggio": "Cantiere eliminato correttamente."
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500
    
@api_bp.route("/api/projects/<int:project_id>/photos", methods=["GET"])
def api_project_photos(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({
                "ok": False,
                "messaggio": "Cantiere non trovato."
            }), 404

        photos = []
        for photo in project.photos:
            photos.append({
                "id": photo.id,
                "file_path": photo.file_path,
                "caption": photo.caption or "",
                "tipo": photo.tipo or "avanzamento"
            })

        return jsonify({
            "ok": True,
            "photos": photos
        })

    except Exception as e:
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500


@api_bp.route("/api/photos/<int:photo_id>/delete", methods=["POST"])
def api_delete_photo(photo_id):
    try:
        photo = ProjectPhoto.query.get(photo_id)
        if not photo:
            return jsonify({
                "ok": False,
                "messaggio": "Foto non trovata."
            }), 404

        if photo.file_path:
            full_path = os.path.join(current_app.static_folder, photo.file_path)
            if os.path.exists(full_path):
                try:
                    os.remove(full_path)
                except Exception:
                    pass

        db.session.delete(photo)
        db.session.commit()

        return jsonify({
            "ok": True,
            "messaggio": "Foto eliminata correttamente."
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500

@api_bp.route("/api/settings", methods=["GET"])
def api_get_settings():
    try:
        settings = SiteSetting.query.all()

        data = {}
        for item in settings:
            data[item.chiave] = item.valore or ""

        return jsonify({
            "ok": True,
            "settings": data
        })

    except Exception as e:
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500


@api_bp.route("/api/settings", methods=["POST"])
def api_save_settings():
    try:
        fields = [
            "home_titolo",
            "home_sottotitolo",
            "home_stat_1",
            "home_stat_2",
            "studio_nome",
            "studio_indirizzo",
            "studio_telefono",
            "studio_email",
            "studio_pec",
            "studio_orari",
            "servizi_testo",
            "cantieri_testo",
            "tecnici_testo"
        ]

        for key in fields:
            value = (request.form.get(key) or "").strip()

            setting = SiteSetting.query.filter_by(chiave=key).first()

            if setting:
                setting.valore = value
            else:
                setting = SiteSetting(
                    chiave=key,
                    valore=value
                )
                db.session.add(setting)

        db.session.commit()

        return jsonify({
            "ok": True,
            "messaggio": "Contenuti salvati correttamente."
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "ok": False,
            "messaggio": f"Errore server: {str(e)}"
        }), 500