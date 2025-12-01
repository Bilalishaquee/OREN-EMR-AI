# OrenEMR - Electronic Medical Records System

A comprehensive Electronic Medical Records (EMR) system designed specifically for hand surgery, peripheral nerve surgery, and microsurgery practices. This system includes patient management, AI-powered clinical note generation, appointment scheduling, billing integration, and more.

## 🚀 Features

### Core Functionality
- **Patient Management**: Complete patient records with demographics, medical history, and intake forms
- **Clinical Notes**: AI-powered note generation for:
  - Progress Notes
  - Consultation Notes
  - ER Operative Reports
  - OR Operative Reports
- **Appointment Scheduling**: Calendar integration with Google Calendar sync
- **Billing & Payments**: Integration with Stripe for invoicing and payments
- **Form Builder**: Dynamic patient intake form builder with multiple question types
- **Task Management**: Task assignment and tracking system
- **Notifications**: Real-time notification system
- **Reports**: Generate and export various medical reports

### AI-Powered Features
- **OpenAI Integration**: Uses GPT-4 for intelligent clinical note generation
- **Template-Based Generation**: Structured note templates with automatic patient data population
- **Context-Aware**: Pulls patient history, previous notes, and visit information for comprehensive notes

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **React Quill** for rich text editing
- **Chart.js** for data visualization

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **OpenAI API** for AI note generation
- **Stripe** for payment processing
- **Google Calendar API** for calendar sync
- **Multer** for file uploads

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Git**

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd OREN-EMR-AI
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

## ⚙️ Environment Variables

### Frontend Environment Variables

Create a `.env` file in the root directory (if needed):

```env
VITE_API_URL=https://oren-emr-ai-1.onrender.com
```

### Backend Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/orenemr

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Google Calendar API Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=https://oren-emr-ai-1.onrender.com/api/google-calendar/callback

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Frontend URL
FRONTEND_URL=https://oren-emr-ai-ashen.vercel.app/
```

### Getting API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Add it to your `.env` file

#### Google Calendar API
See [README-GOOGLE-CALENDAR.md](./README-GOOGLE-CALENDAR.md) for detailed setup instructions.

#### Stripe API
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in
3. Navigate to Developers > API keys
4. Copy your Secret key and Publishable key
5. Add them to your `.env` file

## 🚀 Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev:all
```

Or run them separately:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server
```

The application will be available at:
- **Frontend**: https://oren-emr-ai-ashen.vercel.app/
- **Backend API**: https://oren-emr-ai-1.onrender.com

### Production Build

```bash
# Build frontend
npm run build

# Start server
cd server
npm start
```

## 📁 Project Structure

```
OREN-EMR-AI/
├── server/                 # Backend server
│   ├── index.js           # Server entry point
│   ├── models/            # MongoDB models
│   │   ├── Patient.js
│   │   ├── Note.js
│   │   ├── Appointment.js
│   │   └── ...
│   ├── routes/            # API routes
│   │   ├── patients.js
│   │   ├── notes.js
│   │   ├── appointments.js
│   │   └── ...
│   ├── services/          # Business logic services
│   │   ├── aiNoteGenerationService.js
│   │   ├── emailService.js
│   │   └── ...
│   ├── middleware/        # Express middleware
│   └── utils/            # Utility functions
│
├── src/                   # Frontend React application
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   │   ├── patients/
│   │   ├── notes/
│   │   ├── appointments/
│   │   └── ...
│   ├── contexts/         # React contexts
│   ├── utils/           # Frontend utilities
│   └── App.tsx          # Main app component
│
├── package.json          # Frontend dependencies
└── README.md            # This file
```

## 🔑 Key Features

### AI-Powered Note Generation

The system uses OpenAI's GPT-4 to generate clinical notes based on:
- Patient demographics and medical history
- Previous clinical notes
- Current visit information
- Procedure-specific templates

**Supported Note Types:**
- **Progress Notes**: SOAP format notes for office follow-ups
- **Consultation Notes**: Comprehensive consultation documentation
- **ER Operative Reports**: Emergency room operative reports
- **OR Operative Reports**: Operating room operative reports

### Patient Management

- Complete patient profiles with demographics
- Medical history tracking
- Dynamic intake forms
- Patient notes and documentation
- Visit history

### Appointment Scheduling

- Calendar view with color-coded appointments
- Google Calendar synchronization
- Appointment reminders
- Doctor assignment

### Billing Integration

- Stripe integration for payment processing
- Invoice generation
- Payment tracking
- Email notifications for invoices and payment reminders

## 🔐 Authentication

The system uses JWT (JSON Web Tokens) for authentication. Users are assigned roles:
- **Admin**: Full system access
- **Doctor**: Access to assigned patients and notes

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create new note
- `GET /api/notes/:id` - Get note by ID
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/notes/generate` - Generate AI note

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

## 🧪 Development

### Code Style
- ESLint is configured for code quality
- TypeScript for type safety
- Follow React best practices

### Testing
```bash
# Run linter
npm run lint
```

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify network connectivity

**OpenAI API Errors**
- Verify `OPENAI_API_KEY` is set correctly
- Check API key permissions
- Ensure sufficient API credits

**Port Already in Use**
- Change `PORT` in server `.env` file
- Kill process using the port: `lsof -ti:5000 | xargs kill`

**CORS Errors**
- Verify `FRONTEND_URL` matches your frontend URL
- Check CORS configuration in `server/index.js`

## 📚 Additional Documentation

- [Google Calendar Setup](./README-GOOGLE-CALENDAR.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Authors

- OrenEMR Development Team

## 🙏 Acknowledgments

- OpenAI for AI note generation capabilities
- All open-source contributors whose libraries made this project possible

---

For support or questions, please contact the development team.

