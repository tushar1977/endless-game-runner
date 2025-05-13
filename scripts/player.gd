extends CharacterBody3D

@onready var animation_tree: AnimationTree = $AnimationTree

var SPEED = 5.0

const JUMP_VELOCITY = 10
const DEATH = preload("res://DeathScreen.tscn")

var direction_changed: bool
var vertical_action_performed: bool
func _on_obstacle_hit() -> void:
	SPEED = 0.0
	get_tree().paused = true
	get_tree().change_scene_to_packed(DEATH)



func _physics_process(delta: float) -> void:
	# Add gravity.
	if not is_on_floor():
		velocity += get_gravity() * delta * 2

	velocity.z = SPEED
	velocity.x = 0 

	move_and_slide()
	
	for i in range(get_slide_collision_count()):
		var collision = get_slide_collision(i)
		if collision.get_collider().collision_layer == 2:
			_on_obstacle_hit()
	handle_animations()


func restart_game():
	get_tree().reload_current_scene()

func jump() -> void:
	if is_on_floor():
		velocity.y = JUMP_VELOCITY

func handle_animations() -> void:
	animation_tree.set("parameters/conditions/Running", is_on_floor())
	animation_tree.set("parameters/conditions/Jump", not is_on_floor())


func _input(event: InputEvent) -> void:
	
	if event.is_action_pressed("left"):
		get_parent().tween_player(get_parent().current_player_pos - 1)
	elif event.is_action_pressed("right"):
		get_parent().tween_player(get_parent().current_player_pos + 1)
	elif event.is_action_pressed("jump"):
		jump()
	
	if event is InputEventScreenDrag:
		var drag: Vector2 = event.relative
		if not direction_changed:
			if abs(drag.x) > abs(drag.y):
				var direction: int = sign(event.relative.x)
				if get_parent().is_valid_move(get_parent().current_player_pos + direction):
					print(direction)
					direction_changed = true
					get_parent().tween_player(get_parent().current_player_pos + direction)
			else:
				var direction: int = sign(event.relative.y)
				if not vertical_action_performed:
					if direction == -1:
						jump()
	if event is InputEventScreenTouch:
		if !event.pressed:
			direction_changed = false
