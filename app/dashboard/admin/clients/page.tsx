'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { renderToString } from 'react-dom/server';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminApi, AdminMerchant } from '@/lib/api/admin';
import Swal from 'sweetalert2';
import {
  Users,
  Search,
  Edit2,
  Calendar,
  Monitor,
  Tv,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Select, MenuItem } from '@mui/material';

export default function AdminClientsPage() {
  const PAGE_SIZE_OPTIONS = [10, 15, 20, 25];
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMerchant, setEditingMerchant] = useState<AdminMerchant | null>(null);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getMerchants();
      setMerchants(data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to fetch merchants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMerchant) return;

    try {
      const dataToSave = {
        status: editingMerchant.status,
        maxScreens: editingMerchant.maxScreens,
        maxDevices: editingMerchant.maxDevices,
        serviceEndDate: editingMerchant.serviceEndDate,
        services: editingMerchant.services,
        additionalFeatures: editingMerchant.additionalFeatures,
        allowedCommodities: editingMerchant.allowedCommodities,
      };

      const updated = await adminApi.updateMerchant(editingMerchant._id, dataToSave);
      setMerchants(merchants.map((m) => (m._id === updated._id ? updated : m)));
      setEditingMerchant(null);
      fetchMerchants();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to update merchant', 'error');
    }
  };

  const handleResetPassword = async (id: string) => {
    const { value: newPassword } = await Swal.fire({
      title: 'Reset Password',
      html: `
        <div class="relative w-full text-left mt-3">
          <label class="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
          <div class="relative">
            <input id="swal-new-password" type="password" class="w-full px-3.5 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter new password (min 8 chars)" minlength="8" autocapitalize="off" autocorrect="off" />
            <button id="swal-toggle-password" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center transition-colors cursor-pointer">
              ${renderToString(<Eye className="w-4 h-4" />)}
            </button>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Reset Password',
      didOpen: () => {
        const popup = Swal.getPopup();
        const input = popup?.querySelector('#swal-new-password') as HTMLInputElement;
        const toggleBtn = popup?.querySelector('#swal-toggle-password') as HTMLButtonElement;
        let isVisible = false;
        if (input && toggleBtn) {
          toggleBtn.addEventListener('click', () => {
            isVisible = !isVisible;
            input.type = isVisible ? 'text' : 'password';
            toggleBtn.innerHTML = renderToString(
              isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
            );
          });
        }
      },
      preConfirm: () => {
        const input = Swal.getPopup()?.querySelector('#swal-new-password') as HTMLInputElement;
        const val = input?.value || '';
        if (!val || val.length < 8) {
          Swal.showValidationMessage('Password must be at least 8 characters!');
          return false;
        }
        return val;
      },
    });

    if (newPassword) {
      try {
        await adminApi.resetPassword(id, newPassword);
        Swal.fire('Success', 'Password reset successfully', 'success');
      } catch (err: any) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to reset password', 'error');
      }
    }
  };

  const filteredMerchants = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return merchants;
    return merchants.filter(
      (m) =>
        m.username?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.companyName?.toLowerCase().includes(q)
    );
  }, [merchants, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMerchants.length / itemsPerPage));

  const paginatedMerchants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMerchants.slice(start, start + itemsPerPage);
  }, [filteredMerchants, currentPage, itemsPerPage]);

  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_100%_0%,#3b82f6,transparent_30%),radial-gradient(circle_at_0%_100%,#60a5fa,transparent_30%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between z-10">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <Users className="h-6 w-6 text-blue-600" />
                <span>Client Management</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-2xl">
                Manage all registered merchants, approve statuses, and enforce limits.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none w-72 transition-all shadow-sm"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading clients...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">#</th>
                    <th className="px-6 py-4 font-semibold">Company / Username / Email</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Service Start Date</th>
                    <th className="px-6 py-4 font-semibold">Service End Date</th>
                    <th className="px-6 py-4 font-semibold">Screens Limit</th>
                    <th className="px-6 py-4 font-semibold">Devices Limit</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMerchants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-slate-300" />
                          <span className="text-slate-500 font-medium">
                            No clients found{search ? ` for "${search}"` : ''}.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMerchants.map((merchant, idx) => (
                      <tr key={merchant._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{merchant.companyName}</div>
                          {merchant.username && (
                            <div className="text-blue-500 text-xs font-medium">
                              @{merchant.username}
                            </div>
                          )}
                          <div className="text-slate-500 text-xs">{merchant.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                            ${
                              merchant.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : merchant.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {merchant.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {merchant.createdAt
                              ? new Date(merchant.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {merchant.serviceEndDate
                              ? new Date(merchant.serviceEndDate).toLocaleDateString()
                              : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Monitor className="w-3.5 h-3.5" />
                            {merchant.maxScreens || 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Tv className="w-3.5 h-3.5" />
                            {merchant.maxDevices || 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setEditingMerchant(merchant)}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredMerchants.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-slate-700">
                    {(currentPage - 1) * itemsPerPage + 1}–
                    {Math.min(currentPage * itemsPerPage, filteredMerchants.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-700">{filteredMerchants.length}</span>{' '}
                  client{filteredMerchants.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-500 whitespace-nowrap">
                    Rows per page:
                  </label>
                  <div className="relative flex items-center">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg pl-2.5 pr-8 py-1.5 bg-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none cursor-pointer shadow-sm transition-all"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>

                {getPageNumbers().map((page, i) =>
                  page === '...' ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 py-1.5 text-slate-400 text-sm select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`min-w-[36px] px-3 py-1.5 text-sm font-semibold rounded-lg border transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">
                Manage {editingMerchant.companyName}
              </h2>
              <button
                onClick={() => setEditingMerchant(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 pb-0 space-y-8 max-h-[80vh] overflow-y-auto">
              {/* User Details Grid */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 grid grid-cols-2 gap-4 text-sm relative">
                <div>
                  <span className="text-slate-500 font-medium">Company:</span>{' '}
                  <span className="text-slate-800 font-semibold">
                    {editingMerchant.companyName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Email:</span>{' '}
                  <span className="text-slate-800 font-semibold">{editingMerchant.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Phone:</span>{' '}
                  <span className="text-slate-800 font-semibold">
                    {editingMerchant.phone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">WhatsApp:</span>{' '}
                  <span className="text-slate-800 font-semibold">
                    {editingMerchant.whatsapp || 'N/A'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 font-medium">Address:</span>{' '}
                  <span className="text-slate-800 font-semibold">
                    {editingMerchant.address || 'N/A'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleResetPassword(editingMerchant._id)}
                  className="absolute top-4 right-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5"
                >
                 Reset Password
                 </button>
              </div>

              {/* Grid 1: Status & Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                    Account & Limits
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-orange-50/80 border border-orange-200 p-4 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                      <label className="flex items-center gap-2 text-sm font-bold text-orange-900 mb-2">
                        Account Status
                      </label>
                      <Select
                        value={editingMerchant.status}
                        onChange={(e) =>
                          setEditingMerchant({
                            ...editingMerchant,
                            status: e.target.value as string,
                          })
                        }
                        fullWidth
                        size="small"
                        sx={{
                          borderRadius: '0.75rem',
                          height: '42px',
                          fontSize: '0.875rem',
                          backgroundColor: '#fff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fed7aa' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fdba74' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#f97316',
                            borderWidth: '2px',
                          },
                        }}
                      >
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Suspended">Suspended</MenuItem>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Registration Date (Start)
                        </label>
                        <input
                          type="date"
                          value={
                            editingMerchant.createdAt
                              ? new Date(editingMerchant.createdAt).toISOString().split('T')[0]
                              : ''
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Service End Date
                        </label>
                        <input
                          type="date"
                          value={
                            editingMerchant.serviceEndDate
                              ? new Date(editingMerchant.serviceEndDate).toISOString().split('T')[0]
                              : ''
                          }
                          onChange={(e) =>
                            setEditingMerchant({
                              ...editingMerchant,
                              serviceEndDate: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Max Screens Allowed
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editingMerchant.maxScreens || 1}
                          onChange={(e) =>
                            setEditingMerchant({
                              ...editingMerchant,
                              maxScreens: parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Max Devices Allowed
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editingMerchant.maxDevices || 1}
                          onChange={(e) =>
                            setEditingMerchant({
                              ...editingMerchant,
                              maxDevices: parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid 2: Subscriptions & Features */}
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                    Service Subscriptions
                  </h3>
                  <div className="space-y-3">
                    {['tvDisplay', 'website', 'mobileApp'].map((service) => (
                      <label key={service} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            editingMerchant.services?.[
                              service as keyof typeof editingMerchant.services
                            ] || false
                          }
                          onChange={(e) =>
                            setEditingMerchant({
                              ...editingMerchant,
                              services: {
                                ...editingMerchant.services,
                                [service]: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          {service === 'tvDisplay'
                            ? 'TV View'
                            : service === 'website'
                              ? 'Website'
                              : 'Mobile App'}
                        </span>
                      </label>
                    ))}
                  </div>

                  <h3 className="text-base font-bold text-slate-800 mt-6 mb-4 pb-2 border-b border-slate-100">
                    Commodity Access
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['Gold', 'Silver', 'Copper', 'Platinum'].map((commodity) => {
                      const isChecked = editingMerchant.allowedCommodities?.includes(commodity);
                      return (
                        <label key={commodity} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked || false}
                            onChange={(e) => {
                              const arr = editingMerchant.allowedCommodities || [];
                              setEditingMerchant({
                                ...editingMerchant,
                                allowedCommodities: e.target.checked
                                  ? [...arr, commodity]
                                  : arr.filter((c) => c !== commodity),
                              });
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-700">{commodity}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Grid 3: Additional Features */}
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                  Additional Features
                </h3>
                <div className="grid grid-cols-2 mb-2 md:grid-cols-3 gap-4">
                  {[
                    'Chatbot',
                    'Digital Marketing',
                    '24x7 Chat',
                    'Shop',
                    'Users',
                    'Market Closing',
                  ].map((feature) => {
                    const isChecked = editingMerchant.additionalFeatures?.includes(feature);
                    return (
                      <label
                        key={feature}
                        className="flex items-center gap-3 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked || false}
                          onChange={(e) => {
                            const arr = editingMerchant.additionalFeatures || [];
                            setEditingMerchant({
                              ...editingMerchant,
                              additionalFeatures: e.target.checked
                                ? [...arr, feature]
                                : arr.filter((f) => f !== feature),
                            });
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">{feature}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className=" mt-6 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white p-4">
                <button
                  type="button"
                  onClick={() => setEditingMerchant(null)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-xl transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
