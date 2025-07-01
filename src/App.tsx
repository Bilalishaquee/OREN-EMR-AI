import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { NotificationProvider } from './contexts/NotificationContext';
import PrivateRoute from './components/PrivateRoute';
import DoctorRoute from './components/DoctorRoute';
import AdminRoute from './components/AdminRoute';
import MainLayout from './components/layouts/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GoogleCalendarCallback from './pages/auth/GoogleCalendarCallback';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Patient Pages
import PatientList from './pages/patients/PatientList';
import PatientForm from './pages/patients/PatientForm';
import PatientWizardForm from './pages/patients/PatientWizardForm';
import PatientDetails from './pages/patients/PatientDetails';
import PatientFormPublic from './pages/patients/PatientFormPublic';
import ThankYouPage from './pages/patients/ThankYouPage';

// Notes Pages
import NotesPage from './pages/notes/NotesPage';
import NoteForm from './pages/notes/NoteForm';
import NotePrintView from './pages/notes/NotePrintView';

// Appointment Pages
import AppointmentList from './pages/appointments/AppointmentList';
import AppointmentForm from './pages/appointments/AppointmentForm';
import AppointmentDetails from './pages/appointments/AppointmentDetails';
import AppointmentCalendar from './pages/appointments/AppointmentCalendar';

// Billing Pages
import BillingList from './pages/billing/BillingList';
import InvoiceDetails from './pages/billing/InvoiceDetails';
import InvoiceForm from './pages/billing/InvoiceForm';

// Task Pages
import TasksPage from './pages/tasks/TasksPage';
import TaskFormPage from './pages/tasks/TaskFormPage';
import TaskDetailPage from './pages/tasks/TaskDetailPage';

// Notification Pages
import NotificationsPage from './pages/notifications/NotificationsPage';

// Report Pages
import UnsettledCaseReport from './pages/reports/UnsettledCaseReport';

// Settings Page
import Settings from './pages/settings/Settings';

// Forms Pages
import QuestionnairesPage from './pages/forms/QuestionnairesPage';
import FormTemplateList from './pages/forms/FormTemplateList';
import FormTemplateBuilder from './pages/forms/FormTemplateBuilder';
import PatientIntakeFormPage from './pages/forms/PatientIntakeFormPage';
import PatientIntakeFormBuilder from './pages/forms/PatientIntakeFormBuilder';
import PatientIntakeFormPreview from './pages/forms/PatientIntakeFormPreview';

// Layout Components
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ✅ Initialize the QueryClient
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TaskProvider>
          <NotificationProvider>
            <Router>
              <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/google-calendar/callback" element={<GoogleCalendarCallback />} />
            
            {/* Public Patient Form Routes */}
            <Route path="/patients/form/:token" element={<PatientFormPublic />} />
            <Route path="/patients/thank-you" element={<ThankYouPage />} />

            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Patient Routes */}
              <Route path="patients" element={<PatientList />} />
              <Route path="patients/new" element={<PatientWizardForm />} />
              <Route path="patients/:id" element={<PatientDetails />} />
              <Route path="patients/:id/edit" element={<PatientForm />} />

              {/* Notes Routes */}
              <Route path="notes" element={<NotesPage />} />
              <Route path="notes/new" element={<NoteForm />} />
              <Route path="notes/:id/edit" element={<NoteForm />} />
              <Route path="notes/:id/print" element={<NotePrintView />} />

              {/* Task Routes */}
              <Route path="tasks" element={<TasksPage />} />
              <Route path="tasks/new" element={<TaskFormPage />} />
              <Route path="tasks/:id" element={<TaskDetailPage />} />
              <Route path="tasks/edit/:id" element={<TaskFormPage />} />

              {/* Notification Routes */}
              <Route path="notifications" element={<NotificationsPage />} />

              {/* Appointment Routes */}
              <Route path="appointments" element={<AppointmentCalendar />} />
              <Route path="appointments/list" element={<AppointmentList />} />
              <Route path="appointments/new" element={<AppointmentForm />} />
              <Route path="appointments/:id" element={<AppointmentDetails />} />
              <Route path="appointments/:id/edit" element={<AppointmentForm />} />

              {/* Billing Routes */}
              <Route path="billing" element={<BillingList />} />
              <Route path="billing/new" element={<InvoiceForm />} />
              <Route path="billing/:id" element={<InvoiceDetails />} />
              <Route path="billing/:id/edit" element={<InvoiceForm />} />

              {/* Report Routes */}
              <Route path="reports/unsettled-cases" element={<UnsettledCaseReport />} />

              {/* Settings Route */}
              <Route path="settings" element={<Settings />} />

              {/* Forms Routes */}
              <Route path="forms/questionnaires" element={<QuestionnairesPage />} />
              <Route path="forms/templates" element={<FormTemplateList />} />
              <Route path="forms/templates/new" element={<FormTemplateBuilder />} />
              <Route path="forms/templates/:id" element={<PatientIntakeFormPage />} />
              <Route path="forms/templates/:id/edit" element={<FormTemplateBuilder />} />
              <Route path="forms/templates/:id/builder" element={<PatientIntakeFormBuilder />} />
              <Route path="forms/templates/:id/preview" element={<PatientIntakeFormPreview />} />

              {/* Admin Routes */}
              <Route path="admin/*" element={<AdminRoute><div>Admin Panel</div></AdminRoute>} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
              <ToastContainer position="top-right" autoClose={3000} />
            </Router>
          </NotificationProvider>
        </TaskProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;