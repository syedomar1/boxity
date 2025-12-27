from flask import Flask, jsonify
from flask_cors import CORS
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)  # Allow frontend requests

    # Import routes
    from routes.user_routes import user_bp
    app.register_blueprint(user_bp, url_prefix="/api/users")

    @app.route("/")
    def home():
        return jsonify({
            "status": "success",
            "message": "Flask backend is running 🚀"
        })

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
