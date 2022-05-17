from sqlalchemy import create_engine, Column, ForeignKey, Table
from sqlalchemy.dialects.postgresql import *
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

engine = create_engine('postgresql://psconfig:psconfig@localhost:5432/psconfig')

Base = declarative_base()

# Association Tables

templates_hosts = Table('templates_hosts', Base.metadata,
    Column('templates_id', ForeignKey('templates.id'), primary_key=True),
    Column('hosts_id', ForeignKey('hosts.id'), primary_key=True)
)

templates_addresses = Table('templates_addresses', Base.metadata,
    Column('templates_id', ForeignKey('templates.id'), primary_key=True),
    Column('addresses_id', ForeignKey('addresses.id'), primary_key=True)
)

templates_groups = Table('templates_groups', Base.metadata,
    Column('templates_id', ForeignKey('templates.id'), primary_key=True),
    Column('groups_id', ForeignKey('groups.id'), primary_key=True)
)

templates_tasks = Table('templates_tasks', Base.metadata,
    Column('templates_id', ForeignKey('templates.id'), primary_key=True),
    Column('tasks_id', ForeignKey('tasks.id'), primary_key=True)
)

templates_tests = Table('templates_tests', Base.metadata,
    Column('templates_id', ForeignKey('templates.id'), primary_key=True),
    Column('tests_id', ForeignKey('tests.id'), primary_key=True)
)

groups_addresses = Table('groups_addresses', Base.metadata,
    Column('groups_id', ForeignKey('groups.id'), primary_key=True),
    Column('addresses_id', ForeignKey('addresses.id'), primary_key=True),
    Column('b_address', BOOLEAN)
)

tasks_archives = Table('tasks_archives', Base.metadata,
    Column('tasks_id', ForeignKey('tasks.id'), primary_key=True),
    Column('archives_id', ForeignKey('archives.id'), primary_key=True)
)

class Template(Base):
    __tablename__ = 'templates'
    
    id = Column(BIGINT, primary_key=True)
    name = Column(VARCHAR)
    includes = Column(VARCHAR)
    _meta = Column(JSONB)
    
    addresses = relationship("Address", secondary=templates_addresses)
    groups = relationship("Group", secondary=templates_groups)
    hosts = relationship("Host", secondary=templates_hosts)
    tasks = relationship("Task", secondary=templates_tasks)
    tests = relationship("Test", secondary=templates_tests)
    
    def __repr__(self):
        return f"Template(id={self.id!r}, name={self.name!r}, includes={self.includes!r}, _meta={self._meta!r})"

# Required properties

class Address(Base):
    __tablename__ = 'addresses'
    
    id = Column(BIGINT, primary_key=True)
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

    host = Column(ForeignKey('hosts.id'))
    
    def __repr__(self):
        return f"Address(id={self.id!r}, name={self.name!r}, address={self.address!r}, _meta={self._meta!r})"

class Group(Base):
    __tablename__ = 'groups'
    
    id = Column(BIGINT, primary_key=True)
    name = Column(VARCHAR)
    default_address_label = Column(VARCHAR)
    unidirectional = Column(BOOLEAN)
    type = Column(VARCHAR, nullable=False)
    excludes_self = Column(VARCHAR)
    excludes = Column(JSONB)
    _meta = Column(JSONB)
    
    addresses = relationship("Address", secondary=groups_addresses)

class Task(Base):
    __tablename__ = 'tasks'
    
    id = Column(BIGINT, primary_key=True)
    name = Column(VARCHAR)
    scheduled_by = Column(INTEGER)
    disabled = Column(BOOLEAN)
    tools = Column(ARRAY(VARCHAR))
    priority = Column(INTEGER)
    reference = Column(JSONB)
    _meta = Column(JSONB)
    
    archives = relationship("Archive", secondary=tasks_archives)
    group = Column(ForeignKey('groups.id'))
    schedule = Column(ForeignKey('schedules.id'))
    test = Column(ForeignKey('tests.id'))

class Test(Base):
    __tablename__ = 'tests'
    
    id = Column(BIGINT, primary_key=True)
    name = Column(VARCHAR)
    type = Column(VARCHAR, nullable=False)
    spec = Column(JSONB, nullable=False)
    _meta = Column(JSONB)

# Optional properties

class Archive(Base):
    __tablename__ = 'archives'

    id = Column(BIGINT, primary_key=True)
    name = Column(VARCHAR)
    archiver = Column(VARCHAR, nullable=False)
    data = Column(JSONB, nullable=False)
    transform = Column(JSONB)
    ttl = Column(INTERVAL)
    _meta = Column(JSONB)
    

class Host(Base):
    __tablename__ = 'hosts'
    
    id = Column(BIGINT, primary_key=True)
    name = Column(VARCHAR)
    tags = Column(ARRAY(VARCHAR))
    no_agent = Column(BOOLEAN)
    disabled = Column(BOOLEAN)
    _meta = Column(JSONB)
    
    addresses = relationship("Address")

class Schedule(Base):
    __tablename__ = 'schedules'
    
    id = Column(BIGINT, primary_key=True)
    name = Column(VARCHAR)
    start = Column(VARCHAR)
    slip = Column(INTERVAL)
    sliprand = Column(BOOLEAN)
    repeat = Column(INTERVAL)
    until = Column(VARCHAR)
    max_runs = Column(INTEGER)
    _meta = Column(JSONB)

Base.metadata.create_all(engine)

def create_session():
    session = sessionmaker(bind=engine)
    return session()

if __name__ == "__main__":
    session = create_session()
    
    test_template = Template(name="Test Template")
    session.add(test_template)
    session.commit()
    
    address = Address(name="123.456.789.012", address="123.456.789.012")
    session.add(address)
    session.commit()