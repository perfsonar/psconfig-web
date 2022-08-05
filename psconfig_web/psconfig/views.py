# -*- coding: utf-8 -*-
"""Template views."""
from flask import Blueprint, render_template
from flask_login import login_required

blueprint = Blueprint(
    "template", __name__, url_prefix="/templates", static_folder="../static"
)


@blueprint.route("/")
@login_required
def templates():
    """List templates."""
    return render_template("psconfig/templates.html")


@blueprint.route("/<template>")
def display_json():
    """Show the template in JSON."""
    return render_template("psconfig/templates.html")
