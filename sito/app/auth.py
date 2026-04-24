from flask import Blueprint, request, jsonify, session, redirect, url_for
from werkzeug.security import check_password_hash
from app.models import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}

    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({
            "ok": False,
            "messaggio": "Inserisci username e password."
        }), 400

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({
            "ok": False,
            "messaggio": "Utente non trovato."
        }), 401

    if not user.attivo:
        return jsonify({
            "ok": False,
            "messaggio": "Utente disattivato."
        }), 403

    if not check_password_hash(user.password_hash, password):
        return jsonify({
            "ok": False,
            "messaggio": "Password non corretta."
        }), 401

    session["user_id"] = user.id
    session["username"] = user.username
    session["ruolo"] = user.ruolo
    session["logged_in"] = True

    return jsonify({
        "ok": True,
        "redirect": url_for("main.dashboard")
    })


@auth_bp.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"ok": True})


def is_logged_in():
    return bool(session.get("logged_in"))


def is_admin():
    return session.get("ruolo") == "admin"