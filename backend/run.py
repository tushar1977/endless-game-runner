from myapp import create_app, dbconnect

app = create_app()

if __name__ == "__main__":
    print(dbconnect())
    app.run(port=4000, debug=True)
