# BrainRotBGone 🗑️

A social media platform that filters out "brainrot" content and promotes quality interactions.

## 📁 Project Structure

```
project-root/
├── index.html                    # Login page (root level)
├── frontend/
│   ├── pages/
│   │   ├── feed.html            # Main feed page
│   │   ├── profile.html         # User profile page
│   │   └── signup.html          # Registration page
│   ├── css/
│   │   └── style.css            # All styles
│   └── js/
│       └── main.js              # Frontend logic with Axios
└── backend/
    ├── main.py                  # FastAPI application
    ├── models.py                # Database models
    ├── database.py              # Database configuration
    ├── requirements.txt         # Python dependencies
    └── brainrotbgone.db        # SQLite database (auto-generated)
```

## 🚀 Setup Instructions

### Step 1: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: backend server
- In terminal run: `uvicorn main:app --reload`

### Step 3: Run Frontend

**Option 1: Direct File Access**
- Simply open `index.html` in your browser

**Option 2: Simple HTTP Server**
```bash
# From project root
python -m http.server 3000
```

### Brainrot Keywords (Banned)
Posts and comments containing these words are automatically blocked:
- skibidi
- rizz
- gyat
- sigma
- ohio
- fanum tax
- griddy

## 📡 API Documentation

Once the backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Main Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

#### Users
- `GET /api/users/{user_id}` - Get user profile
- `DELETE /api/users/{user_id}` - Delete user account

#### Posts
- `GET /api/posts` - Get all posts
- `GET /api/users/{user_id}/posts` - Get user's posts
- `POST /api/posts` - Create new post
- `POST /api/posts/{post_id}/like` - Toggle like
- `DELETE /api/posts/{post_id}` - Delete post

#### Comments
- `POST /api/posts/{post_id}/comments` - Add comment
- `DELETE /api/comments/{comment_id}` - Delete comment


---
