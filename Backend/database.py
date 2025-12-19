from sqlmodel import SQLModel, create_engine, Session
from models import User, Post, Comment
from datetime import datetime, timedelta

# SQLite database
sqlite_file_name = "brainrotbgone.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, echo=True, connect_args={"check_same_thread": False})


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


def init_default_data():
    """Initialize database with default users and posts"""
    with Session(engine) as session:
        # Check if data already exists
        existing_user = session.query(User).first()
        if existing_user:
            return
        
        # Create default users
        user1 = User(
            username="john_doe",
            email="john@example.com",
            password="password123",  # In production, this should be hashed
            bio="Quality content creator",
            followers=234,
            following=189
        )
        user2 = User(
            username="jane_smith",
            email="jane@example.com",
            password="pass456",  # In production, this should be hashed
            bio="Tech enthusiast | Coffee lover",
            followers=567,
            following=234
        )
        
        session.add(user1)
        session.add(user2)
        session.commit()
        session.refresh(user1)
        session.refresh(user2)
        
        # Create default posts
        post1 = Post(
            user_id=user1.id,
            content="Just finished reading a great book on philosophy. Highly recommend!",
            likes=45,
            timestamp=datetime.utcnow() - timedelta(hours=1)
        )
        post2 = Post(
            user_id=user2.id,
            content="Beautiful sunset today. Nature is amazing! 🌅",
            likes=89,
            timestamp=datetime.utcnow() - timedelta(hours=2)
        )
        
        session.add(post1)
        session.add(post2)
        session.commit()
        session.refresh(post1)
        session.refresh(post2)
        
        # Create default comment
        comment1 = Comment(
            post_id=post1.id,
            user_id=user2.id,
            content="Which book was it? I love philosophy!",
            timestamp=datetime.utcnow() - timedelta(minutes=50)
        )
        
        session.add(comment1)
        session.commit()
        
        print("Default data initialized successfully!")