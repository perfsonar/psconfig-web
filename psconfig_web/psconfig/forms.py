# -*- coding: utf-8 -*-
"""pSConfig forms."""
from flask_wtf import FlaskForm
from wtforms import (
    BooleanField,
    Field,
    IntegerField,
    SelectField,
    StringField,
    TextAreaField,
    widgets,
)
from wtforms.validators import DataRequired, IPAddress
from wtforms_sqlalchemy.fields import QuerySelectField, QuerySelectMultipleField

from .models import Address, Archive, Group, Host, Task, Test


class TagListField(Field):
    """A comma-separated list of tags."""

    widget = widgets.TextInput()

    def _value(self):
        if self.data:
            return ", ".join(self.data)
        else:
            return ""

    def process_formdata(self, valuelist):
        """."""
        if valuelist:
            self.data = [x.strip() for x in valuelist[0].split(",")]
        else:
            self.data = []


class BetterTagListField(TagListField):
    """A better comma-separated list of tags."""

    def __init__(self, label=None, validators=None, remove_duplicates=True, **kwargs):
        """."""
        super(BetterTagListField, self).__init__(label, validators, **kwargs)
        self.remove_duplicates = remove_duplicates

    def process_formdata(self, valuelist):
        """."""
        super(BetterTagListField, self).process_formdata(valuelist)
        if self.remove_duplicates:
            self.data = list(self._remove_duplicates(self.data))

    @classmethod
    def _remove_duplicates(cls, seq):
        """Remove duplicates in a case insensitive, but case preserving manner."""
        d = {}
        for item in seq:
            if item.lower() not in d:
                d[item.lower()] = True
                yield item


class AddressForm(FlaskForm):
    """Address form."""

    name = StringField("Name", validators=[DataRequired()])
    address1 = StringField(
        "Address",
        validators=[
            DataRequired(),
            IPAddress(ipv6=True, message="Not a valid IP address"),
        ],
    )
    labels = TextAreaField("Labels")
    remote_addresses = TextAreaField("Remote Addresses")
    lead_bind_address = StringField("Lead Bind Address")
    pscheduler_address = StringField("pScheduler Address")
    tags = BetterTagListField("Tags")
    no_agent = BooleanField("No Agent")
    disabled = BooleanField("Disabled")

    def __init__(self, *args, **kwargs):
        """Create instance."""
        super(AddressForm, self).__init__(*args, **kwargs)
        self.address = None

    def validate(self):
        """Validate the form."""
        initial_validation = super(AddressForm, self).validate()
        if not initial_validation:
            return False
        address = Address.query.filter_by(name=self.name.data).first()
        if address:
            self.name.errors.append("Address already exists")
            return False
        return True


class ArchiveForm(FlaskForm):
    """Archive form."""

    name = StringField("Name", validators=[DataRequired()])
    archiver = StringField("Archiver", validators=[DataRequired()])
    data = TextAreaField("Data")
    transform = TextAreaField("Transform")
    ttl = StringField("TTL")

    def __init__(self, *args, **kwargs):
        """Create instance."""
        super(ArchiveForm, self).__init__(*args, **kwargs)
        self.archive = None

    def validate(self):
        """Validate the form."""
        initial_validation = super(ArchiveForm, self).validate()
        if not initial_validation:
            return False
        archive = Archive.query.filter_by(name=self.name.data).first()
        if archive:
            self.name.errors.append("Archive already exists")
            return False
        return True


class GroupForm(FlaskForm):
    """Group form."""

    name = StringField("Name", validators=[DataRequired()])
    default_address_label = StringField("Default Address Label")
    unidirectional = BooleanField("Unidirectional")
    type = SelectField(
        "Type", choices=[("disjoint", "Disjoint"), ("list", "List"), ("mesh", "Mesh")]
    )
    excludes_self = SelectField(
        "Excludes Self",
        choices=[
            ("", ""),
            ("host", "Host"),
            ("address", "Address"),
            ("disabled", "Disabled"),
        ],
    )
    excludes = TextAreaField("Excludes")

    addresses = QuerySelectMultipleField("Addresses", get_label="name")

    def __init__(self, *args, **kwargs):
        """Create instance."""
        super(GroupForm, self).__init__(*args, **kwargs)
        self.group = None

    def validate(self):
        """Validate the form."""
        initial_validation = super(GroupForm, self).validate()
        if not initial_validation:
            return False
        group = Group.query.filter_by(name=self.name.data).first()
        if group:
            self.name.errors.append("Group already exists")
            return False
        return True


class HostForm(FlaskForm):
    """Host form."""

    name = StringField("Name", validators=[DataRequired()])
    tags = BetterTagListField("Tags")
    no_agent = BooleanField("No Agent")
    disabled = BooleanField("Disabled")

    def __init__(self, *args, **kwargs):
        """Create instance."""
        super(HostForm, self).__init__(*args, **kwargs)
        self.host = None

    def validate(self):
        """Validate the form."""
        initial_validation = super(HostForm, self).validate()
        if not initial_validation:
            return False
        host = Host.query.filter_by(name=self.name.data).first()
        if host:
            self.name.errors.append("Host already exists")
            return False
        return True


class TaskForm(FlaskForm):
    """Task form."""

    name = StringField("Name", validators=[DataRequired()])
    scheduled_by = IntegerField("Scheduled By")
    tools = BetterTagListField("Tools")
    disabled = BooleanField("Disabled")
    priority = IntegerField("Priority")
    reference = TextAreaField("Reference")

    group = QuerySelectField("Group", get_label="name")
    test = QuerySelectField("Test", get_label="name")

    def __init__(self, *args, **kwargs):
        """Create instance."""
        super(TaskForm, self).__init__(*args, **kwargs)
        self.task = None

    def validate(self):
        """Validate the form."""
        initial_validation = super(TaskForm, self).validate()
        if not initial_validation:
            return False
        task = Task.query.filter_by(name=self.name.data).first()
        if task:
            self.name.errors.append("Task already exists")
            return False
        return True


class TestForm(FlaskForm):
    """Test form."""

    name = StringField("Name", validators=[DataRequired()])
    type = StringField("Type")
    spec = TextAreaField("Spec")

    def __init__(self, *args, **kwargs):
        """Create instance."""
        super(TestForm, self).__init__(*args, **kwargs)
        self.test = None

    def validate(self):
        """Validate the form."""
        initial_validation = super(TestForm, self).validate()
        if not initial_validation:
            return False
        task = Test.query.filter_by(name=self.name.data).first()
        if task:
            self.name.errors.append("Test already exists")
            return False
        return True
