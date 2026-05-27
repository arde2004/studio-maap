from flask import Blueprint, render_template, session, redirect, url_for, abort
from app.models import Project, Technician

main_bp = Blueprint("main", __name__)


def build_project_card(project):
    foto_cover = None
    foto_prima = None
    foto_dopo = None
    foto_avanzamento = None

    # 🔥 PRIORITÀ 1: cover manuale (ordine = -100)
    for foto in project.photos:
        if foto.ordine == -100:
            foto_cover = foto
            break

    # 🔥 Se NON c'è cover manuale, fallback automatico
    if not foto_cover:
        for foto in project.photos:
            if foto.tipo == "prima" and not foto_prima:
                foto_prima = foto
            elif foto.tipo == "dopo" and not foto_dopo:
                foto_dopo = foto
            elif foto.tipo == "avanzamento" and not foto_avanzamento:
                foto_avanzamento = foto

        foto_cover = foto_dopo or foto_prima or foto_avanzamento

    return {
        "id": project.id,
        "titolo": project.titolo,
        "slug": project.slug,
        "categoria": project.categoria or "",
        "luogo": project.luogo or "",
        "descrizione_breve": project.descrizione_breve or "",
        "descrizione_completa": project.descrizione_completa or "",
        "stato": project.stato or "",
        "visibile_pubblico": project.visibile_pubblico,
        "in_evidenza": project.in_evidenza,

        # 👇 QUI LA COVER VERA
        "cover_path": foto_cover.file_path if foto_cover else None,

        "foto_prima": foto_prima.file_path if foto_prima else None,
        "foto_dopo": foto_dopo.file_path if foto_dopo else None,
        "foto_avanzamento": foto_avanzamento.file_path if foto_avanzamento else None,

        "numero_foto": len(project.photos),

        "photos": [
            {
                "id": foto.id,
                "file_path": foto.file_path,
                "caption": foto.caption or "",
                "tipo": foto.tipo or "avanzamento",
                "ordine": foto.ordine
            }
            for foto in project.photos
        ]
    }


@main_bp.route("/")
def home():
    featured_projects = (
        Project.query
        .filter_by(visibile_pubblico=True, stato="pubblicato", in_evidenza=True)
        .order_by(Project.created_at.desc())
        .all()
    )

    featured_projects = [build_project_card(p) for p in featured_projects]

    return render_template("index.html", featured_projects=featured_projects)


@main_bp.route("/cantieri")
def cantieri():
    projects = (
        Project.query
        .filter_by(visibile_pubblico=True, stato="pubblicato")
        .order_by(Project.created_at.desc())
        .all()
    )

    project_cards = [build_project_card(p) for p in projects]

    return render_template("cantieri.html", projects=project_cards)


@main_bp.route("/cantieri/<slug>")
def dettaglio_cantiere(slug):
    project = Project.query.filter_by(slug=slug, visibile_pubblico=True).first()

    if not project:
        abort(404)

    project_data = build_project_card(project)
    return render_template("cantiere_dettaglio.html", project=project_data)


@main_bp.route("/preventivi")
def preventivi():
    return render_template("preventivi.html")


@main_bp.route("/tecnici")
def tecnici():
    technicians = (
        Technician.query
        .filter_by(visibile_pubblico=True)
        .order_by(Technician.ordine_visualizzazione.asc(), Technician.id.asc())
        .all()
    )
    return render_template("tecnici.html", technicians=technicians)


@main_bp.route("/login")
def login():
    if session.get("logged_in"):
        return redirect(url_for("main.dashboard"))
    return render_template("login.html")


@main_bp.route("/dashboard")
def dashboard():
    if not session.get("logged_in"):
        return redirect(url_for("main.login"))

    projects = Project.query.order_by(Project.created_at.desc()).all()
    return render_template("dashboard.html", projects=projects)