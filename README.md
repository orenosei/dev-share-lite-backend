# DevShareLite Backend

DevShareLite Backend is a RESTful API built with NestJS and PostgreSQL for a developer knowledge sharing platform.

## 🚀 Features

- **User Authentication**: JWT-based authentication system
- **Post Management**: Create, read, update, delete posts with markdown support
- **Comment System**: Nested comments with like functionality
- **Notification System**: Real-time notifications for user interactions
- **File Upload**: Image upload with Cloudinary integration
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Request validation with class-validator
- **Testing**: Unit and E2E tests with Jest

## 🛠️ Tech Stack

- **Framework**: NestJS 11.0.1
- **Database**: PostgreSQL
- **ORM**: Prisma 6.11.0
- **Authentication**: JWT (@nestjs/jwt)
- **File Upload**: Multer + Cloudinary
- **Validation**: Class Validator & Class Transformer
- **Password Hashing**: bcrypt
- **Testing**: Jest

## 📋 System Requirements

- Node.js 18.0.0 or higher
- PostgreSQL 13 or higher
- npm or yarn

## 🔧 Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd dev-share-lite-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/devshare_lite"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Frontend URL for CORS
FRONTEND_URL="http://localhost:3000"

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Server Port
PORT=4000
```

4. **Database Setup**
```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

## 📝 Scripts

```bash
# Development
npm run start:dev

# Production build
npm run build

# Start production server
npm run start:prod

# Linting
npm run lint

# Testing
npm run test
npm run test:e2e
npm run test:cov

# Prisma commands
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

## 📁 Project Structure

```
src/
├── auth/                   # Authentication module
│   ├── auth.controller.ts  # Auth endpoints
│   ├── auth.service.ts     # Auth business logic
│   ├── auth.guard.ts       # JWT authentication guard
│   └── dtos/               # Auth DTOs
├── user/                   # User management
│   ├── user.controller.ts  # User endpoints
│   ├── user.service.ts     # User business logic
│   └── dtos/               # User DTOs
├── post/                   # Post management
│   ├── post.controller.ts  # Post endpoints
│   ├── post.service.ts     # Post business logic
│   └── dtos/               # Post DTOs
├── comment/                # Comment system
│   ├── comment.controller.ts
│   ├── comment.service.ts
│   └── dtos/
├── notification/           # Notification system
│   ├── notification.controller.ts
│   ├── notification.service.ts
│   └── dtos/
├── services/               # Shared services
│   ├── cloudinary.service.ts
│   └── upload.controller.ts
├── prisma.service.ts       # Prisma database service
├── app.module.ts           # Root application module
└── main.ts                 # Application entry point
```

## 🗄️ Database Schema

### User
- User authentication and profile management
- Fields: id, username, email, password, firstName, lastName, bio, avatarUrl, phone, address

### Post
- Blog posts with markdown content
- Fields: id, title, content, excerpt, featuredImage, authorId, createdAt, updatedAt
- Relations: User (author), Comments, PostLikes, PostImages

### Comment
- Nested comment system
- Fields: id, content, postId, authorId, parentId, createdAt, updatedAt
- Relations: Post, User (author), parent/child comments, CommentLikes

### Notification
- Real-time notification system
- Fields: id, type, message, userId, triggeredById, relatedPostId, isRead, createdAt

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register**: `POST /auth/register`
2. **Login**: `POST /auth/login`
3. **Profile**: `GET /auth/me` (requires JWT token)

### Usage
```bash
# Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Access protected routes
curl -X GET http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user profile
- `DELETE /users/:id` - Delete user

### Posts
- `GET /posts` - Get all posts (with pagination)
- `GET /posts/:id` - Get post by ID
- `POST /posts` - Create new post (auth required)
- `PUT /posts/:id` - Update post (auth required)
- `DELETE /posts/:id` - Delete post (auth required)
- `POST /posts/:id/like` - Like/unlike post (auth required)

### Comments
- `GET /posts/:postId/comments` - Get post comments
- `POST /posts/:postId/comments` - Create comment (auth required)
- `PUT /comments/:id` - Update comment (auth required)
- `DELETE /comments/:id` - Delete comment (auth required)
- `POST /comments/:id/like` - Like/unlike comment (auth required)

### Notifications
- `GET /notifications` - Get user notifications (auth required)
- `PUT /notifications/:id/read` - Mark notification as read (auth required)

### Upload
- `POST /upload/image` - Upload image to Cloudinary (auth required)

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🚀 Deployment

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-super-secure-jwt-secret"
FRONTEND_URL="https://your-frontend-domain.com"
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
PORT=4000
```

### Docker Deployment
```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
```

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## 🔧 Development

### Adding New Features
1. Create module: `nest g module feature-name`
2. Create controller: `nest g controller feature-name`
3. Create service: `nest g service feature-name`
4. Add DTOs in `dtos/` folder
5. Update database schema in `prisma/schema.prisma`
6. Run migrations: `npx prisma migrate dev`

### Database Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration-name

# Reset database (development only)
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

Project Link: [https://github.com/orenosei/dev-share-lite-backend](https://github.com/orenosei/dev-share-lite-backend)
