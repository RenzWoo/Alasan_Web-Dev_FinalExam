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

### Prerequisites

- Python 3.7+
- Web browser (Chrome, Firefox, Safari, etc.)

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

# Run the backend server
uvicorn main:app --reload
```

Backend will run at: **http://localhost:8000**

### Step 2: Run Frontend

**Option 1: Simple HTTP Server**
```bash
# From project root
python -m http.server 3000
```
Then open: **http://localhost:3000**

**Option 2: Direct File Access**
- Simply open `index.html` in your browser
- (CORS is enabled in backend for development)

## 🎯 Features

### Core Features
- ✅ **User Authentication** - Login and signup
- ✅ **Create Posts** - Share your thoughts
- ✅ **Like/Unlike Posts** - Show appreciation
- ✅ **Comment System** - Engage in discussions
- ✅ **User Profiles** - View your stats and posts
- ✅ **Brainrot Detection** - Auto-filter low-quality content

### Brainrot Keywords (Banned)
Posts and comments containing these words are automatically blocked:
- skibidi
- rizz
- gyat
- sigma
- ohio
- fanum tax
- griddy

### Delete Features
- 🗑️ **Delete Own Posts** - Remove your posts anytime
- 🗑️ **Delete Own Comments** - Remove your comments
- 🗑️ **Delete Account** - Permanently delete your account and all data

## 👤 Demo Account

Login with:
- **Email:** john@example.com
- **Password:** password123

Or create your own account!

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

## 🛠️ Technology Stack

### Frontend
- HTML5
- CSS3 (Custom styling)
- Vanilla JavaScript
- Axios (HTTP client)

### Backend
- FastAPI (Python web framework)
- SQLModel (ORM)
- SQLite (Database)
- Uvicorn (ASGI server)

## 🔧 Development

### Backend Development

```bash
# Activate virtual environment
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Run with auto-reload
uvicorn main:app --reload

# Run on different port
uvicorn main:app --reload --port 8080
```

### Database

- **Type:** SQLite
- **Location:** `backend/brainrotbgone.db`
- **Reset Database:** Delete the `.db` file and restart backend

### Default Data

The database initializes with:
- 2 demo users (john_doe, jane_smith)
- 2 sample posts
- 1 sample comment

## 📝 Usage Guide

### Creating an Account
1. Click "Sign up" on login page
2. Enter username, email, and password
3. Click "Sign Up"

### Creating a Post
1. Login and navigate to feed
2. Type your content in the post composer
3. Click "Post" button (or Ctrl+Enter)
4. ⚠️ Avoid brainrot keywords!

### Interacting with Posts
- **Like:** Click heart icon
- **Comment:** Click comment icon, type, and press Enter
- **Delete Post:** Click trash icon (only on your posts)
- **Delete Comment:** Hover over your comment and click trash icon

### Managing Your Account
1. Click profile icon in navbar
2. View your stats and posts
3. Click "🗑️ Delete Account" to permanently delete

## ⚠️ Important Notes

### Security Warnings
- ⚠️ Passwords stored in **plain text** (NOT production-ready)
- ⚠️ CORS allows **all origins** (development only)
- ⚠️ No JWT authentication (sessions via sessionStorage)

### For Production Use
- Implement password hashing (bcrypt)
- Add JWT token authentication
- Configure specific CORS origins
- Use environment variables
- Add rate limiting
- Implement proper error logging

## 🐛 Troubleshooting

### Backend won't start
- Check if port 8000 is available
- Verify all files exist (main.py, models.py, database.py)
- Ensure virtual environment is activated
- Check Python version (3.7+)

### Frontend can't connect
- Verify backend is running at http://localhost:8000
- Check browser console for errors
- Clear browser cache and sessionStorage
- Verify `API_BASE_URL` in main.js

### Database errors
- Delete `brainrotbgone.db`
- Restart backend server
- Default data will reinitialize

### Posts not showing
- Check browser console for API errors
- Verify you're logged in
- Try logging out and back in

## 📜 License

This project is for educational purposes.

## 👥 Contributing

This is a learning project. Feel free to fork and modify!

## 🎓 Learning Outcomes

This project demonstrates:
- Full-stack web development
- RESTful API design
- Database relationships
- Frontend-Backend communication
- CRUD operations
- User authentication
- Content moderation
- Modern web technologies

---

**Built with ❤️ for quality content**
