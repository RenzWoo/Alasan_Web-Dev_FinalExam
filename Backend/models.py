from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    password: str
    bio: str = Field(default="New user")
    followers: int = Field(default=0)
    following: int = Field(default=0)
    
    posts: List["Post"] = Relationship(back_populates="user")
    comments: List["Comment"] = Relationship(back_populates="user")


class Post(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    content: str
    likes: int = Field(default=0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    user: Optional[User] = Relationship(back_populates="posts")
    comments: List["Comment"] = Relationship(back_populates="post")
    liked_by: List["PostLike"] = Relationship(back_populates="post")


class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="post.id")
    user_id: int = Field(foreign_key="user.id")
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    post: Optional[Post] = Relationship(back_populates="comments")
    user: Optional[User] = Relationship(back_populates="comments")


class PostLike(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="post.id")
    user_id: int = Field(foreign_key="user.id")
    
    post: Optional[Post] = Relationship(back_populates="liked_by")


# Request/Response Models
class UserCreate(SQLModel):
    username: str
    email: str
    password: str


class UserLogin(SQLModel):
    email: str
    password: str


class UserResponse(SQLModel):
    id: int
    username: str
    email: str
    bio: str
    followers: int
    following: int


class PostCreate(SQLModel):
    content: str


class PostResponse(SQLModel):
    id: int
    user_id: int
    username: str
    content: str
    likes: int
    timestamp: datetime
    comments: List["CommentResponse"] = []
    is_liked: bool = False


class CommentCreate(SQLModel):
    content: str


class CommentResponse(SQLModel):
    id: int
    user_id: int
    username: str
    content: str
    timestamp: datetime