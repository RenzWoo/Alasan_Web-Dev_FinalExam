// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = 'http://localhost:8000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// ============================================
// SESSION MANAGEMENT
// ============================================

const AppState = {
    get currentUser() {
        const user = sessionStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },
    set currentUser(user) {
        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            sessionStorage.removeItem('currentUser');
        }
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => {
        errorEl.classList.remove('show');
    }, 5000);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function requireAuth() {
    const currentUser = AppState.currentUser;
    if (!currentUser) {
        window.location.href = '../../index.html';
        return false;
    }
    return true;
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showError('loginError', 'Please fill in all fields');
        return;
    }
    
    try {
        const response = await axios.post('/auth/login', {
            email: email,
            password: password
        });
        
        AppState.currentUser = response.data;
        window.location.href = 'frontend/pages/feed.html';
    } catch (error) {
        if (error.response && error.response.status === 401) {
            showError('loginError', 'Invalid email or password');
        } else {
            showError('loginError', 'An error occurred. Please try again.');
        }
        console.error('Login error:', error);
    }
}

async function handleSignup() {
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showError('signupError', 'All fields are required');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('signupError', 'Passwords do not match');
        return;
    }
    
    try {
        const response = await axios.post('/auth/signup', {
            username: username,
            email: email,
            password: password
        });
        
        AppState.currentUser = response.data;
        window.location.href = 'feed.html';
    } catch (error) {
        if (error.response && error.response.data && error.response.data.detail) {
            showError('signupError', error.response.data.detail);
        } else {
            showError('signupError', 'An error occurred. Please try again.');
        }
        console.error('Signup error:', error);
    }
}

function handleLogout() {
    AppState.currentUser = null;
    window.location.href = '../../index.html';
}

// ============================================
// POST FUNCTIONS
// ============================================

function updateComposerAvatar() {
    const currentUser = AppState.currentUser;
    const composerAvatar = document.getElementById('composerAvatar');
    if (currentUser && composerAvatar) {
        composerAvatar.textContent = currentUser.username[0].toUpperCase();
    }
}

async function handleCreatePost() {
    const content = document.getElementById('newPostContent').value.trim();
    const currentUser = AppState.currentUser;
    
    if (!content || !currentUser) return;
    
    try {
        await axios.post('/posts', 
            { content: content },
            { params: { user_id: currentUser.id } }
        );
        
        document.getElementById('newPostContent').value = '';
        await renderPosts();
    } catch (error) {
        if (error.response && error.response.status === 400) {
            const warning = document.getElementById('atomizedWarning');
            warning.classList.add('show');
            setTimeout(() => {
                warning.classList.remove('show');
            }, 3000);
            document.getElementById('newPostContent').value = '';
        } else {
            console.error('Error creating post:', error);
        }
    }
}

async function handleLike(postId) {
    const currentUser = AppState.currentUser;
    if (!currentUser) return;
    
    try {
        await axios.post(`/posts/${postId}/like`, null, {
            params: { user_id: currentUser.id }
        });
        
        // Re-render based on current page
        if (document.getElementById('postsFeed')) {
            await renderPosts();
        }
        if (document.getElementById('profilePosts')) {
            await updateProfilePage();
        }
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const commentInput = document.getElementById(`comment-input-${postId}`);
    
    if (commentsSection.style.display === 'none' || !commentsSection.style.display) {
        commentsSection.style.display = 'block';
        if (commentInput) commentInput.focus();
    } else {
        commentsSection.style.display = 'none';
    }
}

async function handleAddComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const content = commentInput.value.trim();
    const currentUser = AppState.currentUser;
    
    if (!content || !currentUser) return;
    
    try {
        await axios.post(`/posts/${postId}/comments`,
            { content: content },
            { params: { user_id: currentUser.id } }
        );
        
        commentInput.value = '';
        
        // Re-render based on current page
        if (document.getElementById('postsFeed')) {
            await renderPosts();
            // Re-open comments section
            document.getElementById(`comments-${postId}`).style.display = 'block';
        }
        if (document.getElementById('profilePosts')) {
            await updateProfilePage();
            // Re-open comments section
            const profileComments = document.getElementById(`comments-${postId}`);
            if (profileComments) profileComments.style.display = 'block';
        }
    } catch (error) {
        if (error.response && error.response.status === 400) {
            const warning = document.getElementById('commentAtomizedWarning');
            warning.classList.add('show');
            setTimeout(() => {
                warning.classList.remove('show');
            }, 3000);
            commentInput.value = '';
        } else {
            console.error('Error adding comment:', error);
        }
    }
}

async function handleDeletePost(postId) {
    const currentUser = AppState.currentUser;
    if (!currentUser) return;
    
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    try {
        await axios.delete(`/posts/${postId}`, {
            params: { user_id: currentUser.id }
        });
        
        // Re-render based on current page
        if (document.getElementById('postsFeed')) {
            await renderPosts();
        }
        if (document.getElementById('profilePosts')) {
            await updateProfilePage();
        }
    } catch (error) {
        if (error.response && error.response.status === 403) {
            alert('You can only delete your own posts');
        } else {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        }
    }
}

async function handleDeleteComment(commentId, postId) {
    const currentUser = AppState.currentUser;
    if (!currentUser) return;
    
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }
    
    try {
        await axios.delete(`/comments/${commentId}`, {
            params: { user_id: currentUser.id }
        });
        
        // Re-render based on current page
        if (document.getElementById('postsFeed')) {
            await renderPosts();
            // Re-open comments section
            document.getElementById(`comments-${postId}`).style.display = 'block';
        }
        if (document.getElementById('profilePosts')) {
            await updateProfilePage();
            // Re-open comments section
            const profileComments = document.getElementById(`comments-${postId}`);
            if (profileComments) profileComments.style.display = 'block';
        }
    } catch (error) {
        if (error.response && error.response.status === 403) {
            alert('You can only delete your own comments');
        } else {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment');
        }
    }
}

async function handleDeleteAccount() {
    const currentUser = AppState.currentUser;
    if (!currentUser) return;
    
    // Simple yes/no confirmation
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }
    
    try {
        await axios.delete(`/users/${currentUser.id}`);
        
        alert('Your account has been deleted successfully');
        AppState.currentUser = null;
        window.location.href = '../../index.html';
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again.');
    }
}

function renderComments(post) {
    const currentUser = AppState.currentUser;
    
    if (!post.comments || post.comments.length === 0) {
        return '<div class="no-comments">No comments yet. Be the first to comment!</div>';
    }
    
    return post.comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <div class="comment-avatar">${comment.username[0].toUpperCase()}</div>
                <div class="comment-meta">
                    <strong>${comment.username}</strong>
                    <span class="comment-time">${formatTime(comment.timestamp)}</span>
                </div>
                ${comment.user_id === currentUser.id ? `
                    <button class="comment-delete-btn" onclick="handleDeleteComment(${comment.id}, ${post.id})" title="Delete comment">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                ` : ''}
            </div>
            <div class="comment-content">${comment.content}</div>
        </div>
    `).join('');
}

async function renderPosts() {
    const feedContainer = document.getElementById('postsFeed');
    if (!feedContainer) return;
    
    const currentUser = AppState.currentUser;
    if (!currentUser) return;
    
    try {
        const response = await axios.get('/posts', {
            params: { current_user_id: currentUser.id }
        });
        
        const posts = response.data;
        feedContainer.innerHTML = '';
        
        posts.forEach(post => {
            const isLiked = post.is_liked;
            const commentCount = post.comments ? post.comments.length : 0;
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            
            postCard.innerHTML = `
                <div class="post-header">
                    <div class="avatar">${post.username[0].toUpperCase()}</div>
                    <div class="post-meta">
                        <h4>${post.username}</h4>
                        <span class="post-time">${formatTime(post.timestamp)}</span>
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
                <div class="post-actions">
                    <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="handleLike(${post.id})">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>${post.likes}</span>
                    </button>
                    <button class="action-btn" onclick="toggleComments(${post.id})">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>${commentCount}</span>
                    </button>
                    <button class="action-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </button>
                    ${post.user_id === currentUser.id ? `
                        <button class="action-btn delete-btn" onclick="handleDeletePost(${post.id})" title="Delete post">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                <div class="comments-section" id="comments-${post.id}" style="display: none;">
                    <div class="comments-list">
                        ${renderComments(post)}
                    </div>
                    <div class="comment-input-container">
                        <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." class="comment-input">
                        <button class="btn-comment" onclick="handleAddComment(${post.id})">💬</button>
                    </div>
                </div>
            `;
            
            feedContainer.appendChild(postCard);
            
            // Add Enter key support for comment input
            const commentInput = document.getElementById(`comment-input-${post.id}`);
            if (commentInput) {
                commentInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleAddComment(post.id);
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

async function updateProfilePage() {
    const currentUser = AppState.currentUser;
    if (!currentUser) return;
    
    try {
        // Fetch updated user data
        const userResponse = await axios.get(`/users/${currentUser.id}`);
        const userData = userResponse.data;
        
        // Update profile header
        const profileAvatar = document.getElementById('profileAvatar');
        const profileUsername = document.getElementById('profileUsername');
        const profileEmail = document.getElementById('profileEmail');
        const profileBio = document.getElementById('profileBio');
        const profileFollowers = document.getElementById('profileFollowers');
        const profileFollowing = document.getElementById('profileFollowing');
        
        if (profileAvatar) profileAvatar.textContent = userData.username[0].toUpperCase();
        if (profileUsername) profileUsername.textContent = userData.username;
        if (profileEmail) profileEmail.textContent = userData.email;
        if (profileBio) profileBio.textContent = userData.bio;
        if (profileFollowers) profileFollowers.textContent = userData.followers;
        if (profileFollowing) profileFollowing.textContent = userData.following;
        
        // Fetch user posts
        const postsResponse = await axios.get(`/users/${currentUser.id}/posts`, {
            params: { current_user_id: currentUser.id }
        });
        
        const userPosts = postsResponse.data;
        const profilePostCount = document.getElementById('profilePostCount');
        if (profilePostCount) profilePostCount.textContent = userPosts.length;
        
        // Render user posts
        const profilePostsContainer = document.getElementById('profilePosts');
        if (!profilePostsContainer) return;
        
        profilePostsContainer.innerHTML = '';
        
        if (userPosts.length === 0) {
            profilePostsContainer.innerHTML = `
                <div class="no-posts">
                    <p>No posts yet. Start sharing!</p>
                </div>
            `;
        } else {
            userPosts.forEach(post => {
                const isLiked = post.is_liked;
                const commentCount = post.comments ? post.comments.length : 0;
                const postCard = document.createElement('div');
                postCard.className = 'post-card';
                
                postCard.innerHTML = `
                    <div class="post-header">
                        <div class="avatar">${post.username[0].toUpperCase()}</div>
                        <div class="post-meta">
                            <h4>${post.username}</h4>
                            <span class="post-time">${formatTime(post.timestamp)}</span>
                        </div>
                    </div>
                    <div class="post-content">${post.content}</div>
                    <div class="post-actions">
                        <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="handleLike(${post.id})">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${post.likes}</span>
                        </button>
                        <button class="action-btn" onclick="toggleComments(${post.id})">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>${commentCount}</span>
                        </button>
                        <button class="action-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </button>
                        <button class="action-btn delete-btn" onclick="handleDeletePost(${post.id})" title="Delete post">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="comments-section" id="comments-${post.id}" style="display: none;">
                        <div class="comments-list">
                            ${renderComments(post)}
                        </div>
                        <div class="comment-input-container">
                            <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." class="comment-input">
                            <button class="btn-comment" onclick="handleAddComment(${post.id})">💬</button>
                        </div>
                    </div>
                `;
                
                profilePostsContainer.appendChild(postCard);
                
                // Add Enter key support for comment input
                const commentInput = document.getElementById(`comment-input-${post.id}`);
                if (commentInput) {
                    commentInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            handleAddComment(post.id);
                        }
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error updating profile:', error);
    }
}

// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
    
    // Public pages (don't require authentication)
    const publicPages = ['index.html', 'signup.html', ''];
    
    // Check authentication for protected pages
    if (!publicPages.includes(filename)) {
        if (!requireAuth()) {
            return;
        }
    }
    
    // Page-specific initialization
    if (filename === 'feed.html') {
        renderPosts();
        updateComposerAvatar();
        
        // Add keyboard shortcut for posting
        const postContent = document.getElementById('newPostContent');
        if (postContent) {
            postContent.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    handleCreatePost();
                }
            });
        }
    }
    
    if (filename === 'profile.html') {
        updateProfilePage();
    }
    
    if (filename === 'index.html' || filename === '') {
        // Add Enter key support for login
        const loginPassword = document.getElementById('loginPassword');
        if (loginPassword) {
            loginPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }
        
        const loginEmail = document.getElementById('loginEmail');
        if (loginEmail) {
            loginEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }
    }
    
    if (filename === 'signup.html') {
        // Add Enter key support for signup
        const signupConfirm = document.getElementById('signupConfirmPassword');
        if (signupConfirm) {
            signupConfirm.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSignup();
                }
            });
        }
    }
});