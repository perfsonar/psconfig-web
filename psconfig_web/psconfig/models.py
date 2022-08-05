# -*- coding: utf-8 -*-
"""pSConfig models."""
from sqlalchemy.dialects.postgresql import *

from psconfig_web.database import Column, PkModel, db, reference_col, relationship

# Alias common SQLAlchemy names
ForeignKey = db.ForeignKey
Table = db.Table

# Association Tables

addresses_contexts = Table(
    "addresses_contexts",
    Column("addresses_id", ForeignKey("addresses.id"), primary_key=True),
    Column("contexts_id", ForeignKey("contexts.id"), primary_key=True),
)

groups_address_classes = Table(
    "groups_address_classes",
    Column("groups_id", ForeignKey("groups.id"), primary_key=True),
    Column("address_classes_id", ForeignKey("address_classes.id"), primary_key=True),
    Column("b_address", BOOLEAN),
)

groups_addresses = Table(
    "groups_addresses",
    Column("groups_id", ForeignKey("groups.id"), primary_key=True),
    Column("addresses_id", ForeignKey("addresses.id"), primary_key=True),
    Column("b_address", BOOLEAN),
)

hosts_archives = Table(
    "hosts_archives",
    Column("hosts_id", ForeignKey("hosts.id"), primary_key=True),
    Column("archives_id", ForeignKey("archives.id"), primary_key=True),
)

subtasks_archives = Table(
    "subtasks_archives",
    Column("subtasks_id", ForeignKey("subtasks.id"), primary_key=True),
    Column("archives_id", ForeignKey("archives.id"), primary_key=True),
)

tasks_archives = Table(
    "tasks_archives",
    Column("tasks_id", ForeignKey("tasks.id"), primary_key=True),
    Column("archives_id", ForeignKey("archives.id"), primary_key=True),
)

templates_address_classes = Table(
    "templates_address_classes",
    Column("templates_id", ForeignKey("templates.id"), primary_key=True),
    Column("address_classes_id", ForeignKey("address_classes.id"), primary_key=True),
)

templates_addresses = Table(
    "templates_addresses",
    Column("templates_id", ForeignKey("templates.id"), primary_key=True),
    Column("addresses_id", ForeignKey("addresses.id"), primary_key=True),
)

templates_archives = Table(
    "templates_archives",
    Column("templates_id", ForeignKey("templates.id"), primary_key=True),
    Column("archives_id", ForeignKey("archives.id"), primary_key=True),
)

templates_contexts = Table(
    "templates_contexts",
    Column("templates_id", ForeignKey("templates.id"), primary_key=True),
    Column("contexts_id", ForeignKey("contexts.id"), primary_key=True),
)

templates_groups = Table(
    "templates_groups",
    Column("templates_id", ForeignKey("templates.id"), primary_key=True),
    Column("groups_id", ForeignKey("groups.id"), primary_key=True),
)

templates_hosts = Table(
    "templates_hosts",
    Column("templates_id", ForeignKey("templates.id"), primary_key=True),
    Column("hosts_id", ForeignKey("hosts.id"), primary_key=True),
)

templates_schedules = Table(
    "templates_schedules",
    Column("templates_id", ForeignKey("templates.id"), primary_key=True),
    Column("schedules_id", ForeignKey("schedules.id"), primary_key=True),
)

templates_subtasks = Table(
    "templates_subtasks",
    Column("templates_id", ForeignKey("templates.id"), primary_key=True),
    Column("subtasks_id", ForeignKey("subtasks.id"), primary_key=True),
)

templates_tasks = Table(
    "templates_tasks",
    Column("templates_id", ForeignKey("templates.id"), primary_key=True),
    Column("tasks_id", ForeignKey("tasks.id"), primary_key=True),
)

templates_tests = Table(
    "templates_tests",
    Column("templates_id", ForeignKey("templates.id"), primary_key=True),
    Column("tests_id", ForeignKey("tests.id"), primary_key=True),
)

# The Root Object


class Template(PkModel):
    """A pSConfig template."""

    __tablename__ = "templates"
    name = Column(VARCHAR, nullable=False, unique=True)
    includes = Column(ARRAY(VARCHAR))
    _meta = Column(JSONB)

    addresses = relationship("Address", secondary=templates_addresses)
    groups = relationship("Group", secondary=templates_groups)
    hosts = relationship("Host", secondary=templates_hosts)
    tasks = relationship("Task", secondary=templates_tasks)
    tests = relationship("Test", secondary=templates_tests)

    def __init__(self, name, **kwargs):
        """Create instance."""
        super().__init__(name=name, **kwargs)

    def __repr__(self):
        """Represent instance as a unique string."""
        return f"<Template({self.name})>"


# Required Properties


class Address(PkModel):
    __tablename__ = "addresses"

    name = Column(VARCHAR, nullable=False)
    address = Column(VARCHAR, nullable=False)
    labels = Column(JSONB)
    remote_addresses = Column(JSONB)
    lead_bind_address = Column(VARCHAR)
    pscheduler_address = Column(VARCHAR)
    tags = Column(ARRAY(VARCHAR))
    disabled = Column(BOOLEAN)
    no_agent = Column(BOOLEAN)
    _meta = Column(JSONB)

    host = Column(ForeignKey("hosts.id"))

    def __repr__(self):
        """Represent instance as a unique string."""
        return f"Address(id={self.id!r}, name={self.name!r}, address={self.address!r}, _meta={self._meta!r})"


class Group(PkModel):
    __tablename__ = "groups"

    name = Column(VARCHAR, nullable=False)
    default_address_label = Column(VARCHAR)
    unidirectional = Column(BOOLEAN)
    type = Column(VARCHAR, nullable=False)
    excludes_self = Column(VARCHAR)
    excludes = Column(JSONB)
    _meta = Column(JSONB)

    addresses = relationship("Address", secondary=groups_addresses)


class Task(PkModel):
    __tablename__ = "tasks"

    name = Column(VARCHAR, nullable=False)
    scheduled_by = Column(INTEGER)
    disabled = Column(BOOLEAN)
    tools = Column(ARRAY(VARCHAR))
    priority = Column(INTEGER)
    reference = Column(JSONB)
    _meta = Column(JSONB)

    archives = relationship("Archive", secondary=tasks_archives)
    group = Column(ForeignKey("groups.id"), nullable=False)
    schedule = Column(ForeignKey("schedules.id"))
    test = Column(ForeignKey("tests.id"), nullable=False)


class Test(PkModel):
    __tablename__ = "tests"

    name = Column(VARCHAR, nullable=False)
    type = Column(VARCHAR, nullable=False)
    spec = Column(JSONB, nullable=False)
    _meta = Column(JSONB)


# Optional Properties


class AddressClass(PkModel):
    __tablename__ = "address_classes"

    name = Column(VARCHAR, nullable=False)
    data_source = Column(VARCHAR, nullable=False)
    match_filter = Column(JSONB)
    exclude_filter = Column(JSONB)
    _meta = Column(JSONB)


class Archive(PkModel):
    __tablename__ = "archives"

    name = Column(VARCHAR, nullable=False)
    archiver = Column(VARCHAR, nullable=False)
    data = Column(JSONB, nullable=False)
    transform = Column(JSONB)
    ttl = Column(INTERVAL)
    _meta = Column(JSONB)


class Context(PkModel):
    __tablename__ = "contexts"

    name = Column(VARCHAR, nullable=False)
    context = Column(VARCHAR, nullable=False)
    data = Column(JSONB, nullable=False)
    _meta = Column(JSONB)


class Host(PkModel):
    __tablename__ = "hosts"

    name = Column(VARCHAR, nullable=False)
    tags = Column(ARRAY(VARCHAR))
    no_agent = Column(BOOLEAN)
    disabled = Column(BOOLEAN)
    _meta = Column(JSONB)

    addresses = relationship("Address")
    archives = relationship("Archive", secondary=hosts_archives)


class Schedule(PkModel):
    __tablename__ = "schedules"

    name = Column(VARCHAR, nullable=False)
    start = Column(VARCHAR)
    slip = Column(INTERVAL)
    sliprand = Column(BOOLEAN)
    repeat = Column(INTERVAL)
    until = Column(VARCHAR)
    max_runs = Column(INTEGER)
    _meta = Column(JSONB)


class Subtask(PkModel):
    __tablename__ = "subtasks"

    name = Column(VARCHAR, nullable=False)
    scheduled_offset = Column(JSONB)
    disabled = Column(BOOLEAN)
    tools = Column(ARRAY(VARCHAR))
    reference = Column(JSONB)
    _meta = Column(JSONB)

    test = Column(ForeignKey("tests.id"))
    archives = relationship("Archive", secondary=subtasks_archives)
