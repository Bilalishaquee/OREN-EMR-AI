import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Home,
  TrendingUp,
  ArrowRight,
  Eye
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    patientCount: 0,
    appointmentsToday: 0,
    appointmentsUpcoming: 0,
    overdueFollowups: 0
  });
  const [billingStats, setBillingStats] = useState({
    billedThisMonth: 0,
    collectedThisMonth: 0,
    outstanding: 0,
    statusCounts: {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      partial: 0
    }
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState({
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
        const nextWeek = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0];
        
        // Fetch patients count
        const patientsResponse = await axios.get('/api/patients?limit=1');
        
        // Fetch today's appointments
        const todayAppointmentsResponse = await axios.get(`/api/appointments?startDate=${today}&endDate=${tomorrow}`);
        
        // Fetch upcoming appointments
        const upcomingAppointmentsResponse = await axios.get(`/api/appointments?startDate=${tomorrow}&endDate=${nextWeek}`);
        
        // Fetch billing summary
        const billingSummaryResponse = await axios.get('/api/billing/summary/dashboard');
        
        // Fetch recent appointments
        const recentAppointmentsResponse = await axios.get('/api/appointments?limit=5');
        
        // Calculate appointment stats
        const allAppointments = [...todayAppointmentsResponse.data, ...upcomingAppointmentsResponse.data];
        const appointmentStatsCounts = {
          scheduled: allAppointments.filter(a => a.status === 'scheduled').length,
          completed: allAppointments.filter(a => a.status === 'completed').length,
          cancelled: allAppointments.filter(a => a.status === 'cancelled').length,
          noShow: allAppointments.filter(a => a.status === 'no-show').length
        };
        
        setStats({
          patientCount: patientsResponse.data.totalPatients || 0,
          appointmentsToday: todayAppointmentsResponse.data.length,
          appointmentsUpcoming: upcomingAppointmentsResponse.data.length,
          overdueFollowups: 0 // This would require additional logic to determine
        });
        
        setBillingStats(billingSummaryResponse.data);
        setRecentAppointments(recentAppointmentsResponse.data.slice(0, 5));
        setAppointmentStats(appointmentStatsCounts);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Chart data
  const appointmentChartData = {
    labels: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
    datasets: [
      {
        label: 'Appointments',
        data: [
          appointmentStats.scheduled,
          appointmentStats.completed,
          appointmentStats.cancelled,
          appointmentStats.noShow
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const billingChartData = {
    labels: ['Billed', 'Collected', 'Outstanding'],
    datasets: [
      {
        label: 'Amount ($)',
        data: [
          billingStats.billedThisMonth,
          billingStats.collectedThisMonth,
          billingStats.outstanding
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <Home className="w-8 h-8 mr-3 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
        </div>
        <p className="text-gray-500 text-lg ml-11">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
              <Users className="h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total Patients</p>
            <p className="text-3xl font-bold text-gray-900 mb-4">{stats.patientCount}</p>
            <Link to="/patients" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              View all patients
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
              <Calendar className="h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Today's Appointments</p>
            <p className="text-3xl font-bold text-gray-900 mb-4">{stats.appointmentsToday}</p>
            <Link to="/appointments" className="inline-flex items-center text-sm font-semibold text-green-600 hover:text-green-800 transition-colors">
              View schedule
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
              <Clock className="h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Upcoming Appointments</p>
            <p className="text-3xl font-bold text-gray-900 mb-4">{stats.appointmentsUpcoming}</p>
            <Link to="/appointments" className="inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
              View upcoming
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
              <DollarSign className="h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Outstanding Balance</p>
            <p className="text-3xl font-bold text-gray-900 mb-4">${billingStats.outstanding.toFixed(2)}</p>
            <Link to="/billing" className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-800 transition-colors">
              View billing
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Appointment Status Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <Activity className="w-6 h-6 mr-2 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Appointment Status</h2>
          </div>
          <div className="h-64">
            <Doughnut 
              data={appointmentChartData} 
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 15,
                      font: {
                        size: 12,
                        weight: '500'
                      }
                    }
                  },
                },
              }} 
            />
          </div>
        </div>

        {/* Billing Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Monthly Billing Overview</h2>
          </div>
          <div className="h-64">
            <Bar 
              data={billingChartData} 
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '$' + value.toLocaleString();
                      }
                    }
                  },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Recent Appointments</h2>
            </div>
            <Link to="/appointments" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recentAppointments.length > 0 ? (
                recentAppointments.map((appointment: any) => (
                  <tr key={appointment._id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {appointment.patient?.firstName && appointment.patient?.lastName
                          ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                          : 'Unknown Patient'}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(appointment.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.time?.start} - {appointment.time?.end}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {appointment.type || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border ${
                        appointment.status === 'completed' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : appointment.status === 'scheduled' 
                          ? 'bg-blue-100 text-blue-800 border-blue-200' 
                          : appointment.status === 'cancelled' 
                          ? 'bg-red-100 text-red-800 border-red-200' 
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}>
                        {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <Link 
                        to={`/appointments/${appointment._id}/edit`} 
                        className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-500">No recent appointments</p>
                      <p className="text-xs text-gray-400 mt-1">Schedule an appointment to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center mb-6">
          <Activity className="w-6 h-6 mr-2 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/forms/questionnaires"
            className="flex items-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200 shadow-sm hover:shadow-md"
          >
            <div className="p-3 rounded-lg bg-blue-600 text-white mr-4">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-blue-700 font-semibold">Add New Patient</span>
          </Link>
          <Link
            to="/appointments/new"
            className="flex items-center p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 border border-green-200 shadow-sm hover:shadow-md"
          >
            <div className="p-3 rounded-lg bg-green-600 text-white mr-4">
              <Calendar className="h-6 w-6" />
            </div>
            <span className="text-green-700 font-semibold">Schedule Appointment</span>
          </Link>
          <Link
            to="/billing/new"
            className="flex items-center p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl hover:from-amber-100 hover:to-amber-200 transition-all duration-200 border border-amber-200 shadow-sm hover:shadow-md"
          >
            <div className="p-3 rounded-lg bg-amber-600 text-white mr-4">
              <DollarSign className="h-6 w-6" />
            </div>
            <span className="text-amber-700 font-semibold">Create Invoice</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;