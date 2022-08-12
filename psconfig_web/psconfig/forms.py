# -*- coding: utf-8 -*-
"""pSConfig forms."""
from flask_wtf import FlaskForm
from wtforms import BooleanField, Field, StringField, widgets
from wtforms.validators import DataRequired

from .models import Host


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


class HostForm(FlaskForm):
    """Host form."""

    name = StringField("Name", validators=[DataRequired()])
    tags = BetterTagListField("Tags")
    no_agent = BooleanField("No agent")
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
