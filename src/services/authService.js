// 从localStorage加载用户数据，如果没有则初始化默认用户
const loadUsers = () => {
  const storedUsers = localStorage.getItem('users');
  if (storedUsers) {
    return JSON.parse(storedUsers);
  }
  
  const defaultUsers = [
    {
      id: 1,
      username: 'cxy14',
      password: 'cxy0512', // 实际项目中密码应该加密存储
      role: 'admin',
      name: '系统管理员'
    },
    {
      id: 2,
      username: 'member1',
      password: 'member1',
      role: 'student',
      name: '成员1'
    },
    {
      id: 3,
      username: 'admin1',
      password: 'admin1',
      role: 'admin',
      name: '管理员1'
    }
  ];
  
  localStorage.setItem('users', JSON.stringify(defaultUsers));
  return defaultUsers;
};

let users = loadUsers();

// 模拟当前用户
let currentUser = null;

export const authService = {
  login(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return false;
    
    // 确保用户有status字段，默认为active
    if (!user.status) {
      user.status = 'active';
      localStorage.setItem('users', JSON.stringify(users));
    }
    
    // 只允许active状态的用户登录
    if (user.status === 'active') {
      currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  },

  logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
  },

  getCurrentUser() {
    if (!currentUser && localStorage.getItem('currentUser')) {
      currentUser = JSON.parse(localStorage.getItem('currentUser'));
    }
    return currentUser;
  },

  hasRole(role) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const roles = {
      student: 1,
      admin: 2,
      author: 3
    };
    
    return roles[user.role] >= roles[role];
  },

  isAuthor() {
    const user = this.getCurrentUser();
    return user && user.username === 'cxy14';
  },

  getUsersByAuthor(authorUsername) {
    return users.filter(user => user.createdBy === authorUsername);
  },

  updateUserRole(username, newRole) {
    if (!this.isAuthor()) return false;
    
    const user = users.find(u => u.username === username);
    if (user && newRole !== 'author') {
      user.role = newRole;
      localStorage.setItem('users', JSON.stringify(users));
      return true;
    }
    return false;
  },

  changePassword(username, oldPassword, newPassword) {
    const user = users.find(u => u.username === username);
    if (!user || user.password !== oldPassword || user.status !== 'active') return false;
    
    user.password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  },

  deleteAccount(username) {
    const user = users.find(u => u.username === username);
    if (!user) return false;
    
    user.status = 'deleted';
    localStorage.setItem('users', JSON.stringify(users));
    
    if (this.getCurrentUser()?.username === username) {
      this.logout();
    }
    return true;
  },

  banUser(username) {
    if (!this.isAuthor()) return false;
    
    const user = users.find(u => u.username === username);
    if (!user || user.username === 'cxy14') return false;
    
    user.status = 'banned';
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  },

  restoreUser(username) {
    if (!this.isAuthor()) return false;
    
    const user = users.find(u => u.username === username);
    if (!user) return false;
    
    user.status = 'active';
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  },

  permanentlyDeleteUser(username) {
    if (!this.isAuthor()) return false;
    
    const index = users.findIndex(u => u.username === username);
    if (index === -1 || users[index].username === 'cxy14') return false;
    
    users.splice(index, 1);
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  },

  deletePublishedWork(workId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    const works = JSON.parse(localStorage.getItem('publishedCodes') || '[]');
    const workIndex = works.findIndex(w => w.id === workId);
    
    if (workIndex === -1) return false;
    
    // 检查权限：作者或管理员
    if (works[workIndex].author === currentUser.username || currentUser.username === 'cxy14') {
      works.splice(workIndex, 1);
      localStorage.setItem('publishedCodes', JSON.stringify(works));
      return true;
    }
    
    return false;
  },

  register(username, password) {
    if (users.some(u => u.username === username)) {
      return { success: false, message: '用户名已存在' };
    }
    
    const newUser = {
      id: users.length + 1,
      username,
      password, // 实际项目中应该加密存储
      role: 'student', // 新用户默认为成员
      name: username,
      status: 'active' // 用户状态: active, deleted, banned
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return { success: true, user: newUser };
  }
};
