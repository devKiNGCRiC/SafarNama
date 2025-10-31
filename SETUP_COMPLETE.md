# 🚀 Safarnama Setup Guide - New System Installation

## ✅ Installation Complete!

All dependencies have been successfully installed on your new system.

## 📦 Installed Dependencies Summary

### **Server (Backend) - 30+ packages**
✅ **Express.js** - Web framework
✅ **MongoDB/Mongoose** - Database
✅ **Axios** - HTTP client
✅ **CORS** - Cross-origin resource sharing
✅ **Helmet** - Security headers
✅ **Express-rate-limit** - Rate limiting
✅ **Express-mongo-sanitize** - NoSQL injection prevention
✅ **XSS-clean** - XSS protection
✅ **HPP** - HTTP parameter pollution prevention
✅ **Bcrypt** - Password hashing
✅ **JWT** - Authentication tokens
✅ **Cloudinary** - Image/video hosting
✅ **Multer** - File uploads
✅ **Nodemailer** - Email sending
✅ **Passport** - Social authentication (Google, Facebook)
✅ **Razorpay** - Payment gateway
✅ **Socket.io** - Real-time communication
✅ **Morgan** - HTTP logging
✅ **Nodemon** - Auto-restart server
✅ **Dotenv** - Environment variables

### **Client (Frontend) - 40+ packages**
✅ **React 18** - UI library
✅ **Vite 7** - Build tool (updated from v5)
✅ **React Router DOM** - Navigation
✅ **Redux Toolkit** - State management
✅ **Redux Persist** - Persist state
✅ **Axios** - API calls
✅ **Material-UI (MUI)** - Component library
✅ **React Icons** - Icon library
✅ **Lucide React** - Modern icons
✅ **AOS** - Scroll animations
✅ **React Leaflet** - Maps
✅ **React Helmet Async** - SEO meta tags
✅ **React Hot Toast** - Notifications
✅ **React Toastify** - Toast notifications
✅ **Socket.io Client** - WebSocket client
✅ **Date-fns** - Date utilities
✅ **SASS** - CSS preprocessor
✅ **ESLint** - Code linting
✅ **Prettier** - Code formatting

### **Root**
✅ **Concurrently** - Run client + server simultaneously

## 🔧 VS Code Extensions Recommended

Open VS Code and it will prompt you to install these extensions:

### **Essential Extensions:**
1. **ESLint** - JavaScript linting
2. **Prettier** - Code formatter
3. **MongoDB for VS Code** - Database management
4. **ES7+ React/Redux Snippets** - React shortcuts
5. **Auto Rename Tag** - Auto-rename paired tags
6. **Path Intellisense** - Autocomplete file paths
7. **npm Intellisense** - Autocomplete npm modules
8. **Color Highlight** - Highlight colors in CSS
9. **CSS Peek** - Peek to definition of CSS
10. **Import Cost** - Display import sizes

### **Recommended Extensions:**
- **GitHub Copilot** - AI pair programmer (if you have access)
- **Live Server** - Local development server
- **Code Runner** - Run code snippets
- **Gutter Preview** - Preview images in gutter

## 🎯 Quick Start Commands

### **Start Everything (Recommended)**
```bash
# From project root
npm run dev
```
This runs both client and server concurrently!

### **Or Start Separately:**

**Terminal 1 - Server:**
```bash
cd Server
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

## 🔍 Verify Installation

Run these commands to verify everything works:

```bash
# Check Node version (should be v18+)
node --version

# Check npm version
npm --version

# Check if MongoDB connects
cd Server
node -e "import('./config/db.js')"

# Check if client builds
cd ../client
npm run build
```

## ⚙️ Environment Variables

Make sure your `.env` files are properly configured:

### **Server/.env**
```env
PORT=5000
MONGO_DB=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_email_password
CLIENT_URL=http://localhost:5173
```

### **Client/.env** (if needed)
```env
VITE_API_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### **Issue: Port already in use**
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### **Issue: MongoDB connection failed**
- Check your MongoDB Atlas connection string
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify internet connection

### **Issue: Module not found**
```bash
# Reinstall dependencies
cd Server
rm -rf node_modules package-lock.json
npm install

cd ../client
rm -rf node_modules package-lock.json
npm install
```

### **Issue: CORS errors**
- Verify `CLIENT_URL` in Server/.env matches your client URL
- Check CORS configuration in Server/index.js

## 📊 Vulnerability Status

✅ **Server:** 0 vulnerabilities
✅ **Client:** 0 vulnerabilities (fixed with audit fix)
✅ **Root:** 0 vulnerabilities

## 🚀 Next Steps

1. ✅ Dependencies installed
2. ✅ VS Code configured
3. ⏳ Install recommended extensions
4. ⏳ Start development server
5. ⏳ Test application features
6. ⏳ Continue with Phase 2 (Design System)

## 💻 Development Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm install
cd Server && npm install && cd ..
cd client && npm install && cd ..

# 3. Start development
npm run dev

# 4. Make changes and test

# 5. Commit and push
git add .
git commit -m "Your message"
git push origin main
```

## 📚 Key Scripts

### **Root Level:**
- `npm run dev` - Run both client and server

### **Server:**
- `npm start` - Start server with nodemon
- `npm run create-admin` - Create admin user

### **Client:**
- `npm run dev` - Start dev server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎉 You're All Set!

Your new system is ready for Safarnama development! Run `npm run dev` from the project root to start coding.
