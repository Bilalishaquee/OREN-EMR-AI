import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Search, 
  Edit, 
  Copy, 
  Trash, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  X,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Globe,
  Lock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface FormTemplate {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  isPublic: boolean;
  language: string;
  items: any[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const FormTemplateList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isActive: 'all',
    isPublic: 'all',
    createdBy: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => {
    fetchTemplates();
  }, [currentPage, filters]);
  
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (filters.isActive !== 'all') {
        params.append('isActive', filters.isActive === 'active' ? 'true' : 'false');
      }
      
      if (filters.isPublic !== 'all') {
        params.append('isPublic', filters.isPublic === 'public' ? 'true' : 'false');
      }
      
      if (filters.createdBy !== 'all') {
        params.append('createdBy', filters.createdBy);
      }
      
      const response = await axios.get(`/api/form-templates?${params.toString()}`);
      setTemplates(response.data);
      
      // For simplicity, we're not implementing server-side pagination in this example
      // In a real app, you would get total pages from the API response
      setTotalPages(Math.ceil(response.data.length / 10));
    } catch (error) {
      console.error('Error fetching form templates:', error);
      toast.error('Failed to load form templates');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTemplates();
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      isActive: 'all',
      isPublic: 'all',
      createdBy: 'all'
    });
    setSearchTerm('');
  };
  
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const confirmDelete = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowDeleteModal(true);
  };
  
  const deleteTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      await axios.delete(`/api/form-templates/${selectedTemplate}`);
      toast.success('Form template deleted successfully');
      fetchTemplates();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };
  
  const duplicateTemplate = async (templateId: string) => {
    try {
      await axios.post(`/api/form-templates/${templateId}/duplicate`);
      toast.success('Form template duplicated successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };
  
  // Calculate displayed templates based on current page
  const displayedTemplates = templates.slice((currentPage - 1) * 10, currentPage * 10);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Form Templates</h1>
              <p className="text-sm text-gray-600">Create and manage your form templates</p>
            </div>
            <Link
              to="/forms/templates/new"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span>New Template</span>
            </Link>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search templates by name or description..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center justify-center px-5 py-3 border rounded-lg font-medium transition-all ${
                  showFilters
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {showFilters && (
                  <X className="w-4 h-4 ml-2" />
                )}
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      
        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="isActive" className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="isActive"
                  name="isActive"
                  value={filters.isActive}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="isPublic" className="block text-sm font-semibold text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  id="isPublic"
                  name="isPublic"
                  value={filters.isPublic}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                >
                  <option value="all">All Visibility</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              
              {user?.role === 'admin' && (
                <div>
                  <label htmlFor="createdBy" className="block text-sm font-semibold text-gray-700 mb-2">
                    Created By
                  </label>
                  <select
                    id="createdBy"
                    name="createdBy"
                    value={filters.createdBy}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                  >
                    <option value="all">All Users</option>
                    <option value={user.id}>My Templates</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={fetchTemplates}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      
        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-96 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading templates...</p>
          </div>
        ) : (
          <>
            {displayedTemplates.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Template
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Questions
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Created By
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedTemplates.map((template) => (
                        <tr 
                          key={template._id} 
                          className="hover:bg-blue-50/50 transition-colors duration-150 group"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                <FileText className="h-6 w-6 text-white" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900 mb-1">{template.title}</div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  {template.description ? (
                                    <>
                                      <span className="truncate max-w-xs">
                                        {template.description.length > 60 ? 
                                          `${template.description.substring(0, 60)}...` : 
                                          template.description}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400 italic">No description</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <FileText className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="font-medium">{template.items.length}</span>
                              <span className="ml-1 text-gray-500">questions</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex flex-col gap-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                template.isActive 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                {template.isActive ? (
                                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1.5" />
                                )}
                                {template.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                template.isPublic 
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {template.isPublic ? (
                                  <Globe className="w-3 h-3 mr-1.5" />
                                ) : (
                                  <Lock className="w-3 h-3 mr-1.5" />
                                )}
                                {template.isPublic ? 'Public' : 'Private'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="font-medium">
                                {template.createdBy ? 
                                  `${template.createdBy.firstName} ${template.createdBy.lastName}` : 
                                  'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{new Date(template.updatedAt).toLocaleDateString('en-GB', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                              })}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center gap-2">
                              <Link
                                to={`/forms/templates/${template._id}/edit`}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-150"
                                title="Edit template"
                              >
                                <Edit className="h-5 w-5" />
                              </Link>
                              <button
                                onClick={() => duplicateTemplate(template._id)}
                                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-150"
                                title="Duplicate template"
                              >
                                <Copy className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => confirmDelete(template._id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-150"
                                title="Delete template"
                              >
                                <Trash className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="flex justify-center mb-4">
                    <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <FileText className="h-10 w-10 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || Object.values(filters).some(v => v !== 'all')
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by creating your first form template.'}
                  </p>
                  <Link
                    to="/forms/templates/new"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Template
                  </Link>
                </div>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg transition-all ${
                      currentPage === 1
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                      <span className="font-semibold text-gray-900">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium transition-all ${
                          currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all ${
                            currentPage === page
                              ? 'z-10 bg-blue-600 border-blue-600 text-white shadow-md'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium transition-all ${
                          currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowDeleteModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12">
                      <Trash className="h-7 w-7 text-red-600 sm:h-6 sm:w-6" />
                    </div>
                    <div className="mt-4 text-center sm:mt-0 sm:ml-5 sm:text-left">
                      <h3 className="text-xl font-bold text-gray-900 mb-2" id="modal-title">
                        Delete Form Template
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Are you sure you want to delete this form template? This action cannot be undone and all associated data will be permanently removed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-5 py-2.5 bg-red-600 text-base font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors sm:ml-0 sm:w-auto sm:text-sm"
                    onClick={deleteTemplate}
                  >
                    Delete Template
                  </button>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center rounded-lg border border-gray-300 shadow-sm px-5 py-2.5 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormTemplateList;