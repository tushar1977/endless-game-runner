extends VBoxContainer

const WORLD = preload("res://main.tscn")



func _on_retry_pressed() -> void:
	get_tree().change_scene_to_packed(WORLD)


func _on_quit_pressed() -> void:
	get_tree().quit()
