extends VBoxContainer

const WORLD = preload("res://main.tscn")

var url = "http://localhost:4000/api/player/godot"
var player_wallet_address = ""
var iframe_loaded = false

func _ready():
	$Label2.text = "Score: " + str(Score.score)
	
	JavaScriptBridge.eval("""
	window.addEventListener('message', (event) => {
		if (event.data.type === 'WALLET_ADDRESS') {
			console.log('Received wallet address in game:', event.data.address);
			godot._on_wallet_address_received(event.data.address);
		}
	});
	""", true)
	
	if JavaScriptBridge.eval("typeof window !== 'undefined'", true):
		JavaScriptBridge.eval("window.godot = this;", true)

func _on_retry_pressed() -> void:
	Score.score = 0
	get_tree().change_scene_to_packed(WORLD)
	
func _on_quit_pressed() -> void:
	get_tree().quit()

func _on_mint_nft_pressed():
	print("Mint NFT button pressed")
	
	if player_wallet_address == "":
		print("Wallet address not set. Cannot mint NFT.")
		# Show an error message to the player
		$error.text = "Please connect your wallet first!"
		$error.show()
		return
	
	var http_request = $mint_nft/HTTPRequest
	var data = {
		"score": Score.score,
		"wallet_address": player_wallet_address
	}
	print(player_wallet_address)
	var body = JSON.stringify(data)
	var headers = PackedStringArray(["Content-Type: application/json"])
	http_request.request(url, headers, HTTPClient.METHOD_POST, body)
	
	_send_mint_request_to_react()

func _on_http_request_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
	print("HTTP request completed")
	print("Result:", result)
	print("Response Code:", response_code)
	
	if result == HTTPRequest.RESULT_SUCCESS:
		if response_code == 200 or response_code == 201:
			var response_json = body.get_string_from_utf8()
			print("Score submitted to server:", response_json)
			$error.text = "Score saved!"
			$error.show()
		else:
			print("Error submitting score:", body.get_string_from_utf8())
			$error.text = "Error saving score: " + str(response_code)
			$error.show()
	else:
		print("Error connecting to server")
		$error.text = "Error connecting to server"
		$error.show()

func _on_iframe_loaded():
	iframe_loaded = true
	if player_wallet_address != "":
		_send_wallet_address_to_react()
		
func _on_wallet_address_received(address):
	player_wallet_address = address
	print("Wallet Address received in Godot: ", player_wallet_address)
	
	# Update UI to show the wallet is connected
	$Wallet.text = "Wallet: " + address.substr(0, 6) + "..." + address.substr(address.length() - 4)
	$Wallet.show()
	
	if iframe_loaded:
		_send_wallet_address_to_react()

func _send_wallet_address_to_react():
	# Send the wallet address back to React to confirm receipt
	if JavaScriptBridge.eval("typeof window !== 'undefined'", true):
		JavaScriptBridge.eval("""
		window.parent.postMessage({
			type: 'WALLET_ADDRESS_RECEIVED', 
			address: '""" + player_wallet_address + """'
		}, '*');
		""", true)
		print("Sent wallet address confirmation to React")

func _send_mint_request_to_react():
	if JavaScriptBridge.eval("typeof window !== 'undefined'", true):
		JavaScriptBridge.eval("""
		window.parent.postMessage({
			type: 'MINT_NFT_REQUEST', 
			score: """ + str(Score.score) + """
		}, '*');
		console.log('Sent mint NFT request to React with score: """ + str(Score.score) + """');
		""", true)
		print("Sent mint request to React with score: ", Score.score)
		$Wallet.text = "Minting NFT..."
		$Wallet.show()
