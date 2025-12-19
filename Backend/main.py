from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from database import create_db_and_tables, get_session, init_default_data
from models import (
    User, Post, Comment, PostLike,
    UserCreate, UserLogin, UserResponse,
    PostCreate, PostResponse,
    CommentCreate, CommentResponse
)

app = FastAPI(title="BrainRotBGone API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Brainrot keywords
BRAINROT_KEYWORDS = ['skibidi', 'rizz', 'gyat', 'sigma', 'ohio', 'fanum tax', 'griddy']


def detect_brainrot(content: str) -> bool:
    """Check if content contains brainrot keywords"""
    lower_content = content.lower()
    return any(keyword in lower_content for keyword in BRAINROT_KEYWORDS)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    init_default_data()


# ============================================
# AUTHENTICATION ENDPOINTS
# ============================================

@app.post("/api/auth/login", response_model=UserResponse)
def login(user_login: UserLogin, session: Session = Depends(get_session)):
    """Login user"""
    statement = select(User).where(
        User.email == user_login.email,
        User.password == user_login.password
    )
    user = session.exec(statement).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return user


@app.post("/api/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_create: UserCreate, session: Session = Depends(get_session)):
    """Register new user"""
    # Check if email exists
    statement = select(User).where(User.email == user_create.email)
    existing_email = session.exec(statement).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Check if username exists
    statement = select(User).where(User.username == user_create.username)
    existing_username = session.exec(statement).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    new_user = User(
        username=user_create.username,
        email=user_create.email,
        password=user_create.password,  # In production, hash this
        bio="New user",
        followers=0,
        following=0
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return new_user


# ============================================
# USER ENDPOINTS
# ============================================

@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, session: Session = Depends(get_session)):
    """Get user by ID"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

# DELETE USER
@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session)):
    """Delete a user account and all their posts"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete all user's likes first (no foreign key constraints)
    statement = select(PostLike).where(PostLike.user_id == user_id)
    user_likes = session.exec(statement).all()
    for like in user_likes:
        session.delete(like)
    
    # Delete all user's comments
    statement = select(Comment).where(Comment.user_id == user_id)
    user_comments = session.exec(statement).all()
    for comment in user_comments:
        session.delete(comment)
    
    # Delete all comments on user's posts
    statement = select(Post).where(Post.user_id == user_id)
    user_posts = session.exec(statement).all()
    for post in user_posts:
        # Delete comments on this post
        post_comments = select(Comment).where(Comment.post_id == post.id)
        comments = session.exec(post_comments).all()
        for comment in comments:
            session.delete(comment)
        
        # Delete likes on this post
        post_likes = select(PostLike).where(PostLike.post_id == post.id)
        likes = session.exec(post_likes).all()
        for like in likes:
            session.delete(like)
        
        # Delete the post
        session.delete(post)
    
    # Finally delete the user
    session.delete(user)
    session.commit()
    
    return {"message": "Account deleted successfully"}


# ============================================
# POST ENDPOINTS
# ============================================

@app.get("/api/posts", response_model=List[PostResponse])
def get_posts(current_user_id: int = None, session: Session = Depends(get_session)):
    """Get all posts with user information"""
    statement = select(Post).order_by(Post.timestamp.desc())
    posts = session.exec(statement).all()
    
    result = []
    for post in posts:
        # Get username
        user = session.get(User, post.user_id)
        username = user.username if user else "Unknown"
        
        # Get comments with usernames
        comments_data = []
        for comment in post.comments:
            comment_user = session.get(User, comment.user_id)
            comments_data.append(CommentResponse(
                id=comment.id,
                user_id=comment.user_id,
                username=comment_user.username if comment_user else "Unknown",
                content=comment.content,
                timestamp=comment.timestamp
            ))
        
        # Check if current user liked this post
        is_liked = False
        if current_user_id:
            statement = select(PostLike).where(
                PostLike.post_id == post.id,
                PostLike.user_id == current_user_id
            )
            like = session.exec(statement).first()
            is_liked = like is not None
        
        result.append(PostResponse(
            id=post.id,
            user_id=post.user_id,
            username=username,
            content=post.content,
            likes=post.likes,
            timestamp=post.timestamp,
            comments=comments_data,
            is_liked=is_liked
        ))
    
    return result


@app.get("/api/users/{user_id}/posts", response_model=List[PostResponse])
def get_user_posts(user_id: int, current_user_id: int = None, session: Session = Depends(get_session)):
    """Get all posts by a specific user"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    statement = select(Post).where(Post.user_id == user_id).order_by(Post.timestamp.desc())
    posts = session.exec(statement).all()
    
    result = []
    for post in posts:
        # Get comments with usernames
        comments_data = []
        for comment in post.comments:
            comment_user = session.get(User, comment.user_id)
            comments_data.append(CommentResponse(
                id=comment.id,
                user_id=comment.user_id,
                username=comment_user.username if comment_user else "Unknown",
                content=comment.content,
                timestamp=comment.timestamp
            ))
        
        # Check if current user liked this post
        is_liked = False
        if current_user_id:
            statement = select(PostLike).where(
                PostLike.post_id == post.id,
                PostLike.user_id == current_user_id
            )
            like = session.exec(statement).first()
            is_liked = like is not None
        
        result.append(PostResponse(
            id=post.id,
            user_id=post.user_id,
            username=user.username,
            content=post.content,
            likes=post.likes,
            timestamp=post.timestamp,
            comments=comments_data,
            is_liked=is_liked
        ))
    
    return result


@app.post("/api/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(post_create: PostCreate, user_id: int, session: Session = Depends(get_session)):
    """Create new post"""
    # Check for brainrot
    if detect_brainrot(post_create.content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brainrot content detected"
        )
    
    # Get user
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create post
    new_post = Post(
        user_id=user_id,
        content=post_create.content,
        likes=0,
        timestamp=datetime.utcnow()
    )
    
    session.add(new_post)
    session.commit()
    session.refresh(new_post)
    
    return PostResponse(
        id=new_post.id,
        user_id=new_post.user_id,
        username=user.username,
        content=new_post.content,
        likes=new_post.likes,
        timestamp=new_post.timestamp,
        comments=[],
        is_liked=False
    )


@app.post("/api/posts/{post_id}/like")
def toggle_like(post_id: int, user_id: int, session: Session = Depends(get_session)):
    """Toggle like on a post"""
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    statement = select(PostLike).where(
        PostLike.post_id == post_id,
        PostLike.user_id == user_id
    )
    existing_like = session.exec(statement).first()
    
    if existing_like:
        # Unlike
        session.delete(existing_like)
        post.likes -= 1
        is_liked = False
    else:
        # Like
        new_like = PostLike(post_id=post_id, user_id=user_id)
        session.add(new_like)
        post.likes += 1
        is_liked = True
    
    session.add(post)
    session.commit()
    
    return {"likes": post.likes, "is_liked": is_liked}


# DELETE POST
@app.delete("/api/posts/{post_id}")
def delete_post(post_id: int, user_id: int, session: Session = Depends(get_session)):
    """Delete a post (only by post owner)"""
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user owns the post
    if post.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own posts"
        )
    
    session.delete(post)
    session.commit()
    
    return {"message": "Post deleted successfully"}

# ============================================
# COMMENT ENDPOINTS
# ============================================

@app.post("/api/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    comment_create: CommentCreate,
    user_id: int,
    session: Session = Depends(get_session)
):
    """Create new comment"""
    # Check for brainrot
    if detect_brainrot(comment_create.content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brainrot content detected"
        )
    
    # Check if post exists
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Get user
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create comment
    new_comment = Comment(
        post_id=post_id,
        user_id=user_id,
        content=comment_create.content,
        timestamp=datetime.utcnow()
    )
    
    session.add(new_comment)
    session.commit()
    session.refresh(new_comment)
    
    return CommentResponse(
        id=new_comment.id,
        user_id=new_comment.user_id,
        username=user.username,
        content=new_comment.content,
        timestamp=new_comment.timestamp
    )

@app.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: int, user_id: int, session: Session = Depends(get_session)):
    """Delete a comment (only by comment owner)"""
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user owns the comment
    if comment.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments"
        )
    
    session.delete(comment)
    session.commit()
    
    return {"message": "Comment deleted successfully"}


# ============================================
# HEALTH CHECK
# ============================================

@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "BrainRotBGone API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)