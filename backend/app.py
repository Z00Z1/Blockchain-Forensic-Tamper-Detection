from flask import Flask
from routes.evidence_routes import evidence_bp

app = Flask(__name__)

app.register_blueprint(evidence_bp)

@app.route("/")
def home():
    return "Forensic Evidence Backend Running"

if __name__ == "__main__":
    app.run(debug=True)
