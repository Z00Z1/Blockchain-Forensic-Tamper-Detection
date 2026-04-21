from flask import Flask
from routes.evidence_routes import evidence_bp
from routes.case_routes import case_bp
from routes.investigator_routes import investigator_bp
from routes.auth_routes import auth_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


app.register_blueprint(evidence_bp)
app.register_blueprint(case_bp)
app.register_blueprint(investigator_bp)
app.register_blueprint(auth_bp)

@app.route("/")
def home():
    return "Forensic Evidence Backend Running"

if __name__ == "__main__":
    app.run(debug=True)
