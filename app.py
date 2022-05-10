from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def show_templates():
    return render_template("index.html")

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