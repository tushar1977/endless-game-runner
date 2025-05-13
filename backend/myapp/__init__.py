from flask import Flask
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()


def dbconnect():
    mongo_uri = os.getenv("MONGO_URI")
    client = MongoClient(mongo_uri)

    return client["test"]


def create_app():
    app = Flask(__name__)

    from .player import player

    app.register_blueprint(player, url_prefix="/api/player")

    return app
