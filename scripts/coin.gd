extends Area3D

signal collected(coin)

func _ready():
	connect("body_entered", Callable(self, "_on_body_entered"))


func _on_body_entered(body):
	if body.name == "Player":
		emit_signal("collected", self)
