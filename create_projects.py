from app import create_app, db
from app.models import Project, User

app = create_app()

with app.app_context():
    admin = User.query.filter_by(username="admin").first()

    if not admin:
        print("Admin non trovato.")
    else:
        progetti = [
            {
                "titolo": "Ristrutturazione Milano",
                "slug": "ristrutturazione-milano",
                "categoria": "Ristrutturazione",
                "luogo": "Milano",
                "descrizione_breve": "Intervento residenziale con nuova distribuzione interna.",
                "descrizione_completa": "Cantiere dimostrativo iniziale.",
                "stato": "pubblicato",
                "visibile_pubblico": True,
                "in_evidenza": True
            },
            {
                "titolo": "Cantiere Lodi",
                "slug": "cantiere-lodi",
                "categoria": "Direzione lavori",
                "luogo": "Lodi",
                "descrizione_breve": "Supervisione tecnica e coordinamento operativo.",
                "descrizione_completa": "Secondo cantiere dimostrativo iniziale.",
                "stato": "pubblicato",
                "visibile_pubblico": True,
                "in_evidenza": False
            }
        ]

        for item in progetti:
            existing = Project.query.filter_by(slug=item["slug"]).first()
            if existing:
                continue

            p = Project(
                titolo=item["titolo"],
                slug=item["slug"],
                categoria=item["categoria"],
                luogo=item["luogo"],
                descrizione_breve=item["descrizione_breve"],
                descrizione_completa=item["descrizione_completa"],
                stato=item["stato"],
                visibile_pubblico=item["visibile_pubblico"],
                in_evidenza=item["in_evidenza"],
                created_by=admin.id
            )
            db.session.add(p)

        db.session.commit()
        print("Progetti demo creati correttamente.")