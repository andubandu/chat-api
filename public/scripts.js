document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const messageForm = document.getElementById('messageForm');
    const updateProfileForm = document.getElementById('updateProfileForm');
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    const logoutButton = document.getElementById('logoutButton');
    const modal = document.getElementById('modal');
    const editModal = document.getElementById('editModal');
    const modalMessage = document.getElementById('modalMessage');
    const closeButtons = document.getElementsByClassName('close');
    const confirmModal = document.getElementById('confirmModal');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');
    const editMessageForm = document.getElementById('editMessageForm');
    let currentEditMessageId = null;
  
    const apiBaseUrl = window.location.origin;
  
    // Close button functionality for all modals
    Array.from(closeButtons).forEach(button => {
      button.onclick = function() {
        modal.style.display = 'none';
        editModal.style.display = 'none';
        confirmModal.style.display = 'none';
      };
    });
  
    window.onclick = function(event) {
      if (event.target.classList.contains('modal')) {
        modal.style.display = 'none';
        editModal.style.display = 'none';
        confirmModal.style.display = 'none';
      }
    };
  
    function showModal(message) {
      modalMessage.textContent = message;
      modal.style.display = 'block';
    }
  
    function showEditModal(messageId, currentText) {
      currentEditMessageId = messageId;
      document.getElementById('editMessageInput').value = currentText;
      editModal.style.display = 'block';
    }
  
    function showConfirmModal(callback) {
      confirmModal.style.display = 'block';
      confirmYes.onclick = function() {
        confirmModal.style.display = 'none';
        callback();
      };
      confirmNo.onclick = function() {
        confirmModal.style.display = 'none';
      };
    }
  
    if (editMessageForm) {
      editMessageForm.onsubmit = async (e) => {
        e.preventDefault();
        const newMessage = document.getElementById('editMessageInput').value;
        if (newMessage && currentEditMessageId) {
          const token = localStorage.getItem('token');
          const response = await fetch(`${apiBaseUrl}/messages/${currentEditMessageId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: newMessage })
          });
  
          const data = await response.json();
          if (data.error) {
            showModal(data.error);
          } else {
            editModal.style.display = 'none';
            socket.emit('messageEdited', { id: currentEditMessageId, message: newMessage });
            loadMessages();
          }
        }
      };
    }
  
    function checkLoginStatus() {
      const token = localStorage.getItem('token');
      const currentPath = window.location.pathname;
      if (token && currentPath !== '/chat.html' && currentPath !== '/settings.html') {
        window.location.href = 'chat.html';
      } else if (!token && currentPath !== '/login.html' && currentPath !== '/signup.html') {
        window.location.href = 'login.html';
      }
    }
  
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const email = document.getElementById('registerEmail').value;
        const profilePicture = document.getElementById('registerProfilePicture').files[0];
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('email', email);
        if (profilePicture) {
          formData.append('profilePicture', profilePicture);
        }
  
        const response = await fetch(`${apiBaseUrl}/users/register`, {
          method: 'POST',
          body: formData,
        });
  
        const data = await response.json();
        showModal(data.message);
      });
    }
  
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
  
        const response = await fetch(`${apiBaseUrl}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
  
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          window.location.href = 'chat.html';
        } else {
          showModal(data.error);
        }
      });
    }
  
    if (messageForm) {
      const socket = io();
  
      messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = document.getElementById('messageInput').value;
        const attachment = document.getElementById('attachmentInput').files[0];
        const formData = new FormData();
        formData.append('message', message);
        if (attachment) {
          formData.append('attachment', attachment);
        }
  
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBaseUrl}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
  
        const data = await response.json();
        if (data.error) {
          showModal(data.error);
        } else {
          document.getElementById('messageInput').value = '';
          document.getElementById('attachmentInput').value = '';
          loadMessages();
        }
      });
  
      socket.on('message', (data) => {
        displayMessage(data);
      });

      socket.on('messageEdited', (data) => {
        loadMessages();
      });
  
      socket.on('messageDeleted', (data) => {
        loadMessages();
      });
  
      async function loadMessages() {
        console.log('Loading messages...');
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBaseUrl}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!response.ok) {
          console.error('Failed to load messages:', response.statusText);
          return;
        }
  
        const messages = await response.json();
        console.log('Messages loaded:', messages);
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = '';
        messages.reverse().forEach(displayMessage);
      }
  
     async function displayMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bg-white', 'p-4', 'rounded-lg', 'shadow-sm', 'flex', 'items-start', 'gap-3');
    
    const profileImg = document.createElement('img');
    profileImg.src = message.author.profilePicture;
    profileImg.classList.add('w-10', 'h-10', 'rounded-full', 'object-cover');
    profileImg.title = "Profile Picture";
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('flex-1');

    const ipAPI = 'https://ipapi.co/json/';
    const response = await fetch(ipAPI);
    const data = await response.json();
    console.log(data);
    const countryCode = data.country ? data.country : "AQ"; 
    const flagUrl = `https://flagsapi.com/${countryCode}/shiny/64.png`;

    contentDiv.innerHTML = `
      <div class="flex items-center gap-2 mb-1">
        <strong class="text-blue-600">${message.author.username}</strong>
        <img src="${flagUrl}" class="w-5 h-4 rounded-sm" title="${message.author.country || 'Unknown'}" alt="Flag">
        <span class="text-gray-400 text-sm">${new Date(message.timestamp).toLocaleString()}</span>
      </div>
      <p class="text-gray-700 mb-2">${message.message}</p>
    `;

    if (message.attachment) {
        const attachmentContainer = document.createElement('div');
        attachmentContainer.classList.add('relative', 'inline-block', 'max-w-sm', 'mt-2');
        
        const img = document.createElement('img');
        img.src = message.attachment;
        img.classList.add('rounded-lg', 'cursor-pointer', 'max-h-48', 'object-contain');
        img.title = "Click to view full size";
        
        img.onclick = () => {
            const fullSizeContainer = document.createElement('div');
            fullSizeContainer.classList.add(
                'modal', 'fixed', 'inset-0', 'bg-black', 'bg-opacity-75',
                'flex', 'items-center', 'justify-center', 'z-50', 'p-4'
            );
            
            const fullSizeImg = document.createElement('img');
            fullSizeImg.src = message.attachment;
            fullSizeImg.classList.add('max-w-full', 'max-h-full', 'object-contain', 'rounded-lg');
            
            fullSizeContainer.appendChild(fullSizeImg);
            fullSizeContainer.onclick = () => fullSizeContainer.remove();
            document.body.appendChild(fullSizeContainer);
        };
        
        attachmentContainer.appendChild(img);
        contentDiv.appendChild(attachmentContainer);
    }
    
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('flex', 'gap-2', 'mt-2');
    
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.classList.add('text-blue-500', 'hover:text-blue-700', 'transition');
    editBtn.onclick = () => showEditModal(message._id, message.message);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.classList.add('text-red-500', 'hover:text-red-700', 'transition');
    deleteBtn.onclick = () => deleteMessage(message._id);
    
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    contentDiv.appendChild(actionsDiv);
    
    messageDiv.appendChild(profileImg);
    messageDiv.appendChild(contentDiv);
    messagesDiv.appendChild(messageDiv);
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

    
  
      window.deleteMessage = async (id) => {
        showConfirmModal(async () => {
          const token = localStorage.getItem('token');
          const response = await fetch(`${apiBaseUrl}/messages/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
  
          const data = await response.json();
          if (data.error) {
            showModal(data.error);
          } else {
            socket.emit('messageDeleted', { id });
            loadMessages();
          }
        });
      };
  
      loadMessages();
    }
  
    if (updateProfileForm) {
      updateProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('updateUsername').value;
        const email = document.getElementById('updateEmail').value;
        const password = document.getElementById('updatePassword').value;
        const profilePicture = document.getElementById('updateProfilePicture').files[0];
        const formData = new FormData();
        if (username) formData.append('username', username);
        if (email) formData.append('email', email);
        if (password) formData.append('password', password);
        if (profilePicture) formData.append('profilePicture', profilePicture);
  
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBaseUrl}/users/profile`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
  
        const data = await response.json();
        showModal(data.message);
      });
    }
  
    if (deleteAccountButton) {
      deleteAccountButton.addEventListener('click', () => {
        showConfirmModal(async () => {
          const token = localStorage.getItem('token');
          const response = await fetch(`${apiBaseUrl}/users/profile`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
  
          const data = await response.json();
          if (data.error) {
            showModal(data.error);
          } else {
            localStorage.removeItem('token');
            window.location.href = 'signup.html';
          }
        });
      });
    }
  
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
      });
    }
  
    checkLoginStatus();
  });