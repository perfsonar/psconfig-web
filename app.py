from flask import Flask, render_template
from sqlalchemy.dialects.postgresql import *
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://psconfig:psconfig@localhost:5432/psconfig'
app.config['SECRET_KEY'] = 'Y\xfd\xb8\xc5\x12\x1e\x1f\xca\x88\x86\xc2\x19\x123v\x05\xae\x80\xa5q\x89\xc0\x190'

db = SQLAlchemy(app)

class Template(db.Model):
    __tablename__ = 'templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    includes = db.Column(db.String)
    _meta = db.Column(db.JSON)

@app.route("/")
def show_templates():
    return render_template("index.html", templates=Template.query.all())

@app.route("/template/<template_id>")
def show_config(template_id):
    return render_template("config-template.html", template_id=template_id)

@app.route("/add/template", methods=['POST'])
def add_template():
    #Add template
    return "Template added sucessfully"

@app.route("/add/address", methods=['POST'])
def add_address():
    #Add address
    return "Address added successfully"

app.run(debug=True, host="127.0.0.1", port=3000)