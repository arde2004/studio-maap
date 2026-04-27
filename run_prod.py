from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    db.create_all()

    email = "admin@studiomaap.it"
    username = "admin"
    password = "1234"

    existing = User.query.filter(
        (User.email == email) | (User.username == username)
    ).first()

    if not existing:
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
    else:
        print("Utente admin già esistente.")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
