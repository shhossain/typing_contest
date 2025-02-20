function updateUserInterface() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userInfo = document.getElementById('user-info');
    const guestOptions = document.getElementById('guest-options');
    const userOptions = document.getElementById('user-options');
    const logoutBtn = document.getElementById('logout-btn');
    const userAvatar = document.getElementById('user-avatar');

    if (currentUser) {
        guestOptions.style.display = 'none';
        userOptions.style.display = 'block';
        logoutBtn.style.display = 'block';
        
        if (currentUser.profilePic) {
            userAvatar.style.backgroundImage = `url(${currentUser.profilePic})`;
        } else {
            userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        }
        userAvatar.style.display = 'block';
    } else {
        guestOptions.style.display = 'block';
        userOptions.style.display = 'none';
        logoutBtn.style.display = 'none';
        userAvatar.style.display = 'none';
    }
}

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.reload();
});

updateUserInterface();
