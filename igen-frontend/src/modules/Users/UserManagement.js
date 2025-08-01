'use client';

import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select, Checkbox,
  ListItemText, Typography, Paper, Chip, IconButton, Tooltip,
  Snackbar, Alert, Card, CardContent, TableContainer, Table, TableHead, TableBody, TableCell, TableRow
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InputAdornment from '@mui/material/InputAdornment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { motion, AnimatePresence } from 'framer-motion';
import { Stack } from '@mui/material';
import { TablePagination } from '@mui/material';
import SearchBar from '../../components/SearchBar';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  const [form, setForm] = useState({
    user_id: '',
    full_name: '',
    role: 'ACCOUNTANT',
    password: '',
    confirm_password: '',
    company_ids: [],
  });

  const [editForm, setEditForm] = useState({
    id: '',
    full_name: '',
    role: '',
    company_ids: [],
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const validateUserId = (id) => {
    if (!id) return 'User ID is required';
    return '';
  };

  const validateName = (name) => {
    if (!name) return 'Full name is required';
    if (!/^[A-Za-z\s]+$/.test(name)) return 'Only letters and spaces allowed';
    return '';
  };

  const validatePassword = (pass) => {
    if (!pass) return 'Password is required';
    if (pass.length < 6) return 'Must be at least 6 characters';
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(pass)) return 'Must include letters and numbers';
    return '';
  };

  const validateConfirmPassword = (pass, confirm) => {
    if (!confirm) return 'Confirm password is required';
    if (pass !== confirm) return 'Passwords do not match';
    return '';
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const roleOptions = [
    { value: 'SUPER_USER', label: 'Super User' },
    { value: 'CENTER_HEAD', label: 'Center Head' },
    { value: 'ACCOUNTANT', label: 'Accountant' },
    { value: 'PROPERTY_MANAGER', label: 'Property Manager' },
  ];

  const fetchUsers = async () => {
    try {
      const res = await API.get('users/');
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        console.error('Unexpected users response:', res.data);
        showSnackbar('Unexpected response format when fetching users', 'error');
      }
    } catch (err) {
      console.error('Fetch error:', err.response?.data);
      showSnackbar('Error fetching users', 'error');
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await API.get('companies/');
      if (Array.isArray(res.data)) {
        setCompanies(res.data);
      } else {
        console.error('Unexpected companies response:', res.data);
        showSnackbar('Unexpected response format when fetching companies', 'error');
      }
    } catch (err) {
      console.error('Fetch companies error:', err.response?.data);
      showSnackbar('Error fetching companies', 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const handleAddUser = async () => {
    const { user_id, password, full_name, confirm_password, company_ids } = form;

    const idError = validateUserId(user_id);
    const nameError = validateName(full_name);
    const passError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirm_password);

    if (idError || nameError || passError || confirmError || !Array.isArray(company_ids) || company_ids.length === 0) {
      showSnackbar('Please correct the highlighted errors', 'error');
      return;
    }

    try {
      await API.post('users/', form);
      showSnackbar('User added successfully!', 'success');
      fetchUsers();
      setOpen(false);
      setForm({
        user_id: '',
        full_name: '',
        role: 'ACCOUNTANT',
        password: '',
        confirm_password: '',
        company_ids: [],
      });
    } catch (err) {
      console.error('Add error:', err.response?.data);
      showSnackbar('Failed to add user: ' + (err.response?.data?.detail || 'Unknown error'), 'error');
    }
  };

  const openEditModal = (user) => {
    setEditForm({
      id: user.id,
      full_name: user.full_name,
      role: user.role,
      company_ids: Array.isArray(user.companies) ? user.companies.map(c => c.id) : [],
    });
    setEditOpen(true);
  };

  const handleEditUser = async () => {
    if (!editForm.full_name || !editForm.role || !Array.isArray(editForm.company_ids) || editForm.company_ids.length === 0) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }
    try {
      await API.put(`users/${editForm.id}/`, editForm);
      showSnackbar('User updated successfully!', 'success');
      fetchUsers();
      setEditOpen(false);
    } catch (err) {
      console.error('Edit error:', err.response?.data);
      showSnackbar('Failed to update user', 'error');
    }
  };

  const deactivateUser = async (id) => {
    try {
      await API.delete(`users/${id}/`);
      showSnackbar('User deactivated successfully!', 'success');
      fetchUsers();
    } catch (err) {
      console.error('Deactivate error:', err.response?.data);
      showSnackbar('Failed to deactivate user', 'error');
    }
  };

  const openResetDialog = (id) => {
    setResetUserId(id);
    setNewPassword('');
    setConfirmPassword('');
    setResetDialogOpen(true);
  };

  const handlePasswordReset = async () => {
    if (!newPassword) {
      showSnackbar('Password cannot be empty', 'error');
      return;
    }
    try {
   await API.post(`users/${resetUserId}/reset-password/`, {
  password: newPassword,
  confirm_password: confirmPassword, // if your API needs it
});

      showSnackbar('Password reset successfully!', 'success');
      setResetDialogOpen(false);
    } catch (err) {
      console.error('Reset error:', err.response?.data);
      showSnackbar('Failed to reset password: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Unknown error'), 'error');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredUsers = users.filter((u) =>
  u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
);




  return (
    <div className='p-[35px]'>
       
      <Typography variant="h5" gutterBottom>User Management</Typography>
      <div className="flex justify-between items-center mb-4 mt-6">
          <div className="flex-1 max-w-sm">
<SearchBar
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  label="Search User"
  placeholder="Enter name to search"
/>

  

          </div>
<div className='flex gap-3'>
  <Button
  variant="contained"
  startIcon={<PersonAddIcon />}
  onClick={() => {
    // ⬅️ CLEAR form before showing Add User dialog
    setForm({
      user_id: '',
      full_name: '',
      role: 'ACCOUNTANT',
      password: '',
      company_ids: [],
    });
    setOpen(true);
    setEditOpen(false); // just to be safe
  }}
  sx={{ borderRadius: 2, px: 3, py: 1.5, fontSize:13 }}
>
  Add User
</Button>
</div>
</div>



            <Card sx={{ boxShadow: 3, borderRadius: 3, mt: 3 }}>
  <CardContent>
   
     <TableContainer component={Paper} elevation={1}>
  <Table size="small">
    <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
      <TableRow>
        <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>User ID</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>Companies</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((u, index) => (
        <TableRow key={u.id} hover>
          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
          <TableCell>{u.full_name}</TableCell>
          <TableCell>{u.user_id}</TableCell>
         <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Chip label={u.role} size="small" />
  <Chip
    label={u.is_active ? 'Active' : 'Inactive'}
    size="small"
    sx={{
      bgcolor: u.is_active ? '#d0f0c0' : '#fff8dc',
      color: u.is_active ? '#388e3c' : '#f57c00',
      fontWeight: 500
    }}
  />
</TableCell>

          <TableCell>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {u.companies.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  size="small"
                  sx={{ backgroundColor: '#f1f1f1', fontSize: 12 }}
                />
              ))}
            </div>
          </TableCell>
          <TableCell align="center">
            <Tooltip title="Reset Password" arrow>
              <IconButton onClick={() => openResetDialog(u.id)}>
                <LockResetIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit User" arrow>
              <IconButton onClick={() => openEditModal(u)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={u.is_active ? "Deactivate User" : "Already Deactivated"} arrow>
  <span>
    <IconButton
      onClick={() => deactivateUser(u.id)}
      disabled={!u.is_active}
    >
      <DeleteIcon color={u.is_active ? 'error' : 'disabled'} />
    </IconButton>
  </span>
</Tooltip>

          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
  </CardContent>
</Card>


   
      <TablePagination
  component="div"
  count={filteredUsers.length}
  page={page}
  onPageChange={handleChangePage}
  rowsPerPage={rowsPerPage}
  onRowsPerPageChange={handleChangeRowsPerPage}
    rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
  sx={{ mt: 2 }}
/>


      {/* Add/Edit Dialog */}


<Dialog open={open || editOpen} onClose={() => { setOpen(false); setEditOpen(false); }} fullWidth maxWidth="sm"
  PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>
  <DialogTitle sx={{ fontSize: 20, fontWeight: 600, pb: 0 }}>
    {open ? 'Add New User' : 'Edit User'}
  </DialogTitle>

  <DialogContent sx={{ pt: 2 }}>
    <Stack spacing={3}>
      {open && (
        <>
          <TextField
            label="User ID"
            variant="outlined"
            fullWidth
            value={form.user_id}
            onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            helperText={validateUserId(form.user_id)}
            error={!!validateUserId(form.user_id)}
          />

          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            helperText={validateName(form.full_name)}
            error={!!validateName(form.full_name)}
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            helperText={validatePassword(form.password)}
            error={!!validatePassword(form.password)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

<TextField
  label="Confirm Password"
  type={showPassword ? 'text' : 'password'}
  variant="outlined"
  fullWidth
  value={form.confirm_password}
  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
  helperText={validateConfirmPassword(form.password, form.confirm_password)}
  error={!!validateConfirmPassword(form.password, form.confirm_password)}
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    )
  }}
/>

{(form.confirm_password?.length ?? 0) > 0 && (
  <div style={{ marginTop: 4 }}>
    <div
      style={{
        height: 6,
        borderRadius: 3,
        backgroundColor:
          form.confirm_password.length < 6
            ? '#f44336'
            : /(?=.*[A-Za-z])(?=.*\d)/.test(form.confirm_password)
            ? '#4caf50'
            : '#ff9800',
        transition: 'background-color 0.3s ease'
      }}
    />
    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
      {form.confirm_password.length < 6
        ? 'Too short'
        : /(?=.*[A-Za-z])(?=.*\d)/.test(form.confirm_password)
        ? 'Strong password'
        : 'Try adding letters and numbers'}
    </Typography>
  </div>
)}



          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Companies</InputLabel>
            <Select
              label="Companies"
              multiple
              value={form.company_ids}
              onChange={(e) => setForm({ ...form, company_ids: e.target.value })}
              renderValue={(selected) =>
                companies
                  .filter((c) => selected.includes(c.id))
                  .map((c) => c.name)
                  .join(', ')
              }
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  <Checkbox checked={form.company_ids.includes(company.id)} />
                  <ListItemText primary={company.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}

      {editOpen && (
        <>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            value={editForm.full_name}
            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
          />

          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Companies</InputLabel>
            <Select
              label="Companies"
              multiple
              value={editForm.company_ids}
              onChange={(e) => setEditForm({ ...editForm, company_ids: e.target.value })}
              renderValue={(selected) =>
                companies
                  .filter((c) => selected.includes(c.id))
                  .map((c) => c.name)
                  .join(', ')
              }
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  <Checkbox checked={editForm.company_ids.includes(company.id)} />
                  <ListItemText primary={company.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}
     </Stack>
  </DialogContent>

  <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2, pt: 1 }}>
    <Button variant="outlined" onClick={() => { setOpen(false); setEditOpen(false); }}>
      Cancel
    </Button>
    <Button
      variant="contained"
      color="primary"
      onClick={open ? handleAddUser : handleEditUser}
    >
      {open ? 'Add' : 'Done'}
    </Button>
  </DialogActions>
</Dialog>
      {/* Reset Password Dialog */}
<Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)} maxWidth="xs" fullWidth
  PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>

  <DialogTitle sx={{ fontWeight: 600, fontSize: 18 }}>
    Reset Password
  </DialogTitle>

  <DialogContent sx={{ pt: 1 }}>
    <TextField
      label="New Password"
      type={showPassword ? 'text' : 'password'}
      fullWidth
      variant="outlined"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      autoFocus
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        )
      }}
      helperText="At least 6 characters with letters and numbers"
    />

    <TextField
      label="Confirm Password"
      type={showPassword ? 'text' : 'password'}
      fullWidth
      variant="outlined"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      sx={{ mt: 2 }}
      error={confirmPassword && newPassword !== confirmPassword}
      helperText={
        confirmPassword && newPassword !== confirmPassword
          ? 'Passwords do not match'
          : 'Re-enter the password to confirm'
      }
    />

    {newPassword.length > 0 && (
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor:
              newPassword.length < 6
                ? '#f44336'
                : /(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)
                ? '#4caf50'
                : '#ff9800',
            transition: 'background-color 0.3s ease'
          }}
        />
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          {newPassword.length < 6
            ? 'Too short'
            : /(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)
            ? 'Strong password'
            : 'Try adding numbers and letters'}
        </Typography>
      </div>
    )}
  </DialogContent>

  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button onClick={() => {
  setResetDialogOpen(false);
  setNewPassword('');
  setConfirmPassword('');
}} variant="outlined">
  Cancel
</Button>

    <Button
      onClick={handlePasswordReset}
      variant="contained"
      color="primary"
      disabled={
        newPassword.length < 6 ||
        !/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword) ||
        confirmPassword !== newPassword
      }
    >
      Reset
    </Button>
  </DialogActions>
</Dialog>


    
     <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', backgroundColor: snackbar.severity === 'success' ? '#4caf50' : snackbar.severity === 'error' ? '#f44336' : '#2196f3' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
