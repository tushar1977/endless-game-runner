extends Node3D

@onready var player: CharacterBody3D = $Player
@onready var positions: Array[Marker3D] = [$Marker3D2, $Marker3D3, $Marker3D]  

const PLATFORM = preload("res://city.tscn")
const OBSTACLES = [
	preload("res://1.tscn"),
	preload("res://2.tscn")
]
const COIN_SCENE = preload("res://coin.tscn")

var current_player_pos: int = 1
var current_platform_ref: Node3D
var next_platform_ref: Node3D
var is_next_spawned: bool
var coins: Array[Node3D] = []
var coin_count: int = 0
var difficulty: float = 1.0
var time_elapsed: float = 0.0
var base_speed: float = 5.0 
var speed: float = base_speed
var score: int = 0





func _ready() -> void:
	initialize_player()
	spawn_initial_platforms()

func _process(delta: float) -> void:
	time_elapsed += delta

	
	if int(time_elapsed) % 15 == 0:
		difficulty += 0.05


	
	player.global_position.z += speed * delta

	if current_platform_ref and player.global_position.z > current_platform_ref.global_position.z + 60:
		recycle_platforms()


func initialize_player() -> void:
	player.global_position.x = positions[1].global_position.x
	current_player_pos = 1

func tween_player(new_pos: int) -> void:
	if not is_valid_move(new_pos): return
	current_player_pos = new_pos
	var t: Tween = create_tween()
	t.tween_property(player, "global_position:x", positions[new_pos].global_position.x, 0.1)
	t.play()

func is_valid_move(new_pos: int) -> bool:
	return new_pos >= 0 and new_pos < positions.size()

func spawn_initial_platforms():
	current_platform_ref = PLATFORM.instantiate()
	add_child(current_platform_ref)
	current_platform_ref.global_position = Vector3.ZERO
	spawn_obstacles_on_platform(current_platform_ref)
	spawn_coins(current_platform_ref)

	next_platform_ref = PLATFORM.instantiate()
	add_child(next_platform_ref)
	align_platform(next_platform_ref, current_platform_ref)
	spawn_obstacles_on_platform(next_platform_ref)
	spawn_coins(next_platform_ref)

func recycle_platforms():
	var temp = current_platform_ref
	current_platform_ref = next_platform_ref
	next_platform_ref = temp

	align_platform(next_platform_ref, current_platform_ref)

	spawn_obstacles_on_platform(next_platform_ref)
	spawn_coins(next_platform_ref)

func align_platform(platform: Node3D, reference: Node3D) -> void:
	var start_marker = platform.get_node("start")
	var end_marker = reference.get_node("end")
	var offset = platform.global_transform.origin - start_marker.global_transform.origin
	platform.global_position = end_marker.global_position + offset

func spawn_obstacles_on_platform(platform: Node3D) -> void:
	for child in platform.get_children():
		if child.name.begins_with("Obstacle_"):
			child.queue_free()

	var start_z = platform.get_node("start").global_position.z
	var end_z = platform.get_node("end").global_position.z
	var platform_length = end_z - start_z

	var base_obstacle_count = 2
	var max_extra = int(difficulty * 1.5)
	var group_count = randi_range(base_obstacle_count, base_obstacle_count + max_extra)

	var used_z_positions: Array[float] = []
	var min_gap_z = 6.0
	var attempts = 0
	var max_attempts = group_count * 4  
	var i = 0

	while used_z_positions.size() < group_count and attempts < max_attempts:
		attempts += 1

		var obstacle_scene = OBSTACLES[randi_range(0, OBSTACLES.size() - 1)]
		var obstacle = obstacle_scene.instantiate()
		var random_marker = positions[randi_range(0, positions.size() - 1)]

		var min_z = start_z + 6
		var max_z = end_z - 6
		var spawn_z = lerp(min_z, max_z, randf())

		
		var valid = true
		for z in used_z_positions:
			if abs(z - spawn_z) < min_gap_z:
				valid = false
				break

		if not valid:
			continue

		used_z_positions.append(spawn_z)
		platform.add_child(obstacle)

		obstacle.global_position = Vector3(
			random_marker.global_position.x,
			platform.global_position.y + 0.5,
			spawn_z
		)
		obstacle.name = "Obstacle_%s" % i
		i += 1


func spawn_coins(platform_ref: Node3D):
	
	for child in platform_ref.get_children():
		if child.name.begins_with("Coin_"):
			child.queue_free()

	var start_z = platform_ref.get_node("start").global_position.z
	var end_z = platform_ref.get_node("end").global_position.z
	var base_y = player.global_position.y + 1.5

	var group_start_z = start_z + randf_range(10, 20)
	var coin_spacing = 1.5
	var base_coin_count = 10
	var max_coin_bonus = int(difficulty * 10)
	var coin_count_in_row = randi_range(base_coin_count, base_coin_count + max_coin_bonus)




	var current_lane_index = randi_range(0, positions.size() - 1)

	for i in range(coin_count_in_row):
		if randf() < 0.3:
			var lane_shift = randi_range(-1, 1)
			var new_lane = clamp(current_lane_index + lane_shift, 0, positions.size() - 1)
			current_lane_index = new_lane

		var lane_marker = positions[current_lane_index]
		var lane_x = lane_marker.global_position.x
		var z_pos = group_start_z + i * coin_spacing
		var y_offset = sin(i * 0.8) * 0.2
		var coin_y = base_y + y_offset

		var safe = true
		var over_hurdle = false
		var hurdle_z = 0.0

		for child in platform_ref.get_children():
			if child.name.begins_with("Obstacle_") and abs(child.global_position.z - z_pos) < 1.5 and abs(child.global_position.x - lane_x) < 0.5:
				if "2" in child.scene_file_path or child.scene_file_path.ends_with("2.tscn"):
					over_hurdle = true
					hurdle_z = child.global_position.z
				else:
					safe = false
				break

		if not safe:
			continue

		if over_hurdle:
			
			var arc_center = hurdle_z
			var arc_width = 4.0
			var dist = clamp(z_pos - arc_center, -arc_width / 2, arc_width / 2)
			var arc_height = 1.5
			var parabola_y = -((dist * dist) / (arc_width * 0.25)) + arc_height  # upside down parabola
			coin_y = base_y + parabola_y

		var coin = COIN_SCENE.instantiate()
		platform_ref.add_child(coin)

		coin.global_position = Vector3(
			lane_x,
			coin_y,
			z_pos
		)
		coin.name = "Coin_%s" % str(coin_count)
		coin.connect("collected", Callable(self, "_on_coin_collected"))
		coins.append(coin)
		coin_count += 1


func _on_coin_collected(coin: Node) -> void:
	if coin in coins:
		coins.erase(coin)
	score += 1
	coin.queue_free()
	print("Score: ", score)
