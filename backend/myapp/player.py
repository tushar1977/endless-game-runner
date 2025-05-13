from flask import Blueprint, jsonify
from myapp import dbconnect

player = Blueprint("player", __name__)

db = dbconnect()


@player.route("/")
def add_player():
    return jsonify({"message": "Hi"})


@player.route("/godot/<int:score>", methods=["POST"])
def godot(score):
    return jsonify({"high_score": score})


@player.route("/<string:wallet>/<int:score>", methods=["POST"])
def add(wallet, score):
    player = db["player"]
    existing_player = player.find_one({"wallet_address": wallet})

    if not existing_player:
        new_player = {
            "wallet_address": wallet,
            "player": "Unknown",
            "score": score,
        }
        player.insert_one(new_player)
        return jsonify({"message": "New player created!"}), 201
    elif existing_player.get("score", 0) < score:
        player.update_one(
            {"wallet_address": wallet},
            {"$set": {"score": score}},
        )
        return jsonify({"message": "Player score updated!"}), 200
    else:
        return jsonify(
            {
                "message": "Score not updated - current score is higher",
                "current_score": existing_player.get("score"),
                "submitted_score": score,
            }
        ), 200
