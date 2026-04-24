from werkzeug.security import generate_password_hash
from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    email = "admin@studiomaap.it"
    username = "admin"
    password = "1234"

    existing = User.query.filter(
        (User.email == email) | (User.username == username)
    ).first()

    if existing:
        print("Utente admin già esistente.")
    else:
        user = User(
            nome="Admin",
            cognome="MAAP",
            email=email,
            username=username,
            password_hash=generate_password_hash(password),
            ruolo="admin",
            attivo=True
        )
        db.session.add(user)
        db.session.commit()
        print("Utente admin creato con successo.")
        print("Username: admin")
        print("Password: 1234")