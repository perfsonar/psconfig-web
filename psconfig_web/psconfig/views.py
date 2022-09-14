# -*- coding: utf-8 -*-
"""pSConfig views."""
from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import login_required

from psconfig_web.psconfig.forms import (
    AddressForm,
    ArchiveForm,
    GroupForm,
    HostForm,
    TaskForm,
    TestForm,
)
from psconfig_web.psconfig.models import Address, Archive, Group, Host, Task, Test
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


@blueprint.route("/addresses/", methods=["GET", "POST"])
@login_required
def addresses():
    """List and add addresses."""

    addresses = Address.query.all()

    form = AddressForm(request.form)
    if form.validate_on_submit():
        Address.create(
            name=form.name.data,
            address=form.address1.data,
            labels=form.labels.data,
            remote_addresses=form.remote_addresses.data,
            lead_bind_address=form.lead_bind_address.data,
            pscheduler_address=form.pscheduler_address.data,
            tags=form.tags.data,
            no_agent=form.no_agent.data,
            disabled=form.disabled.data,
        )
        flash("Address added.", "success")
        return redirect(url_for("psconfig.addresses"))
    else:
        flash_errors(form)
    return render_template("psconfig/addresses.html", form=form, addresses=addresses)


@blueprint.route("/archives/", methods=["GET", "POST"])
@login_required
def archives():
    """List and add archives."""

    archives = Archive.query.all()

    form = ArchiveForm(request.form)
    if form.validate_on_submit():
        Archive.create(
            name=form.name.data,
            archiver=form.archiver.data,
            data=form.data.data,
            transform=form.transform.data,
            ttl=form.ttl.data,
        )
        flash("Archive added.", "success")
        return redirect(url_for("psconfig.archives"))
    else:
        flash_errors(form)
    return render_template("psconfig/archives.html", form=form, archives=archives)


@blueprint.route("/groups/", methods=["GET", "POST"])
@login_required
def groups():
    """List and add groups."""

    groups = Group.query.all()

    form = GroupForm(request.form, type="mesh")
    form.addresses.query = Address.query.order_by(Address.name)
    if form.validate_on_submit():
        Group.create(
            name=form.name.data,
            default_address_label=form.default_address_label.data,
            unidirectional=form.unidirectional.data,
            type=form.type.data,
            excludes_self=form.excludes_self.data,
            excludes=form.excludes.data,
            addresses=form.addresses.data,
        )
        flash("Group added.", "success")
        return redirect(url_for("psconfig.groups"))
    else:
        flash_errors(form)
    return render_template("psconfig/groups.html", form=form, groups=groups)


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


@blueprint.route("/tasks/", methods=["GET", "POST"])
@login_required
def tasks():
    """List and add tasks."""

    tasks = Task.query.all()

    form = TaskForm(request.form)
    form.group.query = Group.query.order_by(Group.name)
    form.test.query = Test.query.order_by(Test.name)
    if form.validate_on_submit():
        Task.create(
            name=form.name.data,
            scheduled_by=form.scheduled_by.data,
            tools=form.tools.data,
            priority=form.priority.data,
            reference=form.reference.data,
            disabled=form.disabled.data,
            group=form.group.data,
            test=form.test.data,
        )
        flash("Task added.", "success")
        return redirect(url_for("psconfig.tasks"))
    else:
        flash_errors(form)
    return render_template("psconfig/tasks.html", form=form, tasks=tasks)


@blueprint.route("/tests/", methods=["GET", "POST"])
@login_required
def tests():
    """List and add tests."""

    tests = Test.query.all()

    form = TestForm(request.form)
    if form.validate_on_submit():
        Test.create(
            name=form.name.data,
            type=form.type.data,
            spec=form.spec.data,
        )
        flash("Test added.", "success")
        return redirect(url_for("psconfig.tests"))
    else:
        flash_errors(form)
    return render_template("psconfig/tests.html", form=form, tests=tests)
