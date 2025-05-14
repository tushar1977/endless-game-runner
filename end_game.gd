extends VBoxContainer

const WORLD = preload("res://main.tscn")
var url = "https://meowfacts.herokuapp.com/"

func _ready():
	$Label2.text = "Score: " + str(Score.score)
	Score.score = 0
	
func _on_retry_pressed() -> void:
	get_tree().change_scene_to_packed(WORLD)
	
func _on_quit_pressed() -> void:
	get_tree().quit()


func _on_mint_nft_pressed():
	print("Mint NFT button pressed")
	var http_request = $mint_nft/HTTPRequest
	http_request.request(url)

func _on_http_request_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
	print("HTTP request completed")
	print(body.get_string_from_utf8())
