extends VBoxContainer

const WORLD = preload("res://main.tscn")
const MENU = preload("res://StartScreen.tscn")

func _on_quit_pressed() -> void:
	get_tree().quit()


func _on_start_pressed() -> void:
	get_tree().change_scene_to_packed(WORLD)
