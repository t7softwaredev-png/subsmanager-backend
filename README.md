# SubsManager Backend

Node.js + Express + Prisma + PostgreSQL (Supabase) backend for the SubsManager subscription tracking app.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and update with your Supabase credentials:
```bash
cp .env.example .env
```

Update `.env`:
```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
```

### 3. Run migrations
```bash
npm run prisma:migrate
```

### 4. Seed templates (Netflix, YouTube, Spotify)
```bash
npm run prisma:seed
```

### 5. Start development server
```bash
npm run dev
```

Server will run on `http://localhost:3000`

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Templates
- `GET /templates` - Get all service templates

### Subscriptions
- `GET /me/subscriptions` - Get user's subscriptions
- `POST /me/subscriptions` - Create new subscription
- `PATCH /me/subscriptions/:id` - Update subscription
- `DELETE /me/subscriptions/:id` - Delete subscription

### Profile
- `GET /me` - Get user profile
- `PATCH /me` - Update user profile

## Database Schema

### User
- id, email, passwordHash, name, createdAt, updatedAt

### ServiceTemplate
- id, name, logoUrl

### UserSubscription
- id, userId, templateId, customName, customLogoUrl, price, billingCycle, startDate, nextRenewalDate, status, notes, createdAt, updatedAt
