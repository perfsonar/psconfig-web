# -*- coding: utf-8 -*-
"""pSConfig views."""
from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import login_required

from psconfig_web.psconfig.forms import HostForm
from psconfig_web.psconfig.models import Host
from psconfig_web.utils import flash_errors

from .models import *  # noqa

blueprint = Blueprint("psconfig", __name__, static_folder="../static")


# @blueprint.route("/")
# @login_required
# def templates():
#     """List templates."""
#     return render_template("psconfig/templates.html")


# @blueprint.route("/<template>")
# def display_json():
#     """Show the template in JSON."""
#     return render_template("psconfig/templates.html")


@blueprint.route("/hosts/", methods=["GET", "POST"])
@login_required
def hosts():
    """List and add hosts."""

    hosts = Host.query.all()

    form = HostForm(request.form)
    if form.validate_on_submit():
        Host.create(
            name=form.name.data,
            tags=form.tags.data,
            no_agent=form.no_agent.data,
            disabled=form.disabled.data,
        )
        flash("Host added.", "success")
        return redirect(url_for("psconfig.hosts"))
    else:
        flash_errors(form)
    return render_template("psconfig/hosts.html", form=form, hosts=hosts)
