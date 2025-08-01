import React, { useEffect, useState } from 'react';
import {
  Button, TextField, Dialog, DialogActions, DialogContent,
  DialogTitle, Snackbar, MenuItem, Typography, Box, Select, InputLabel, FormControl
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import API from '../../api/axios';

const Alert = React.forwardRef((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const vendorTypeOptions = [
  { value: 'Contractor', label: 'Contractor' },
  { value: 'Supplier', label: 'Supplier' },
  { value: 'Consultant', label: 'Consultant' }
];


const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const initialForm = {
    vendor_name: '',
    vendor_type: '',
    pan_number: '',
    gst_number: '',
    contact_person: '',
    email: '',
    phone_number: '',
    bank_name: '',
    bank_account: '',
    ifsc_code: '',
    address: '',
    notes: '',
    company_id: ''
  };

  const [form, setForm] = useState(initialForm);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchVendors = async () => {
    try {
      const res = await API.get('/vendors/');
      setVendors(res.data);
    } catch (err) {
      console.error(err);
      showSnackbar('Failed to fetch vendors.', 'error');
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await API.get('/companies/');
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
      showSnackbar('Failed to load companies.', 'error');
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchCompanies();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isValidPAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  const isValidIFSC = (ifsc) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());

  const handleSubmit = async () => {
    if (!isValidPAN(form.pan_number)) {
      showSnackbar('Invalid PAN (e.g. ABCDE1234F)', 'error');
      return;
    }
    if (!isValidIFSC(form.ifsc_code)) {
      showSnackbar('Invalid IFSC (e.g. HDFC0001234)', 'error');
      return;
    }

    const payload = {
      ...form,
      is_active: true
    };

    try {
      if (editingIndex !== null) {
        await API.put(`/vendors/${vendors[editingIndex].id}/`, payload);
        showSnackbar('Vendor updated successfully!');
      } else {
        await API.post('/vendors/', payload);
        showSnackbar('Vendor created successfully!');
      }

      setOpen(false);
      setForm(initialForm);
      setEditingIndex(null);
      fetchVendors();
    } catch (err) {
      console.error(err.response?.data || err);
      showSnackbar('Error saving vendor. Please try again.', 'error');
    }
  };

  const handleEdit = (index) => {
    const vendor = vendors[index];
    setForm({ ...vendor, company_id: vendor.company?.id || '' });
    setEditingIndex(index);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await API.delete(`/vendors/${id}/`);
        showSnackbar('Vendor deleted.');
        fetchVendors();
      } catch (err) {
        console.error(err);
        showSnackbar('Error deleting vendor.', 'error');
      }
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>Vendor Management</Typography>
      <Button variant="contained" onClick={() => { setForm(initialForm); setEditingIndex(null); setOpen(true); }}>
        + Add New Vendor
      </Button>

      <table style={{ width: '100%', marginTop: 20, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>#</th><th>Name</th><th>Type</th><th>PAN</th><th>GST</th><th>Phone</th>
            <th>Email</th><th>Bank</th><th>IFSC</th><th>Address</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v, i) => (
            <tr key={v.id}>
              <td>{i + 1}</td>
              <td>{v.vendor_name}</td>
              <td>{v.vendor_type}</td>
              <td>{v.pan_number}</td>
              <td>{v.gst_number}</td>
              <td>{v.phone_number}</td>
              <td>{v.email}</td>
              <td>{v.bank_name}</td>
              <td>{v.ifsc_code}</td>
              <td>{v.address}</td>
              <td>
                <Button onClick={() => handleEdit(i)}>✏️</Button>
                <Button onClick={() => handleDelete(v.id)}>🗑️</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingIndex !== null ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
            <TextField name="vendor_name" label="Vendor Name" value={form.vendor_name || ''} onChange={handleChange} fullWidth required />
            <FormControl fullWidth required>
              <InputLabel>Vendor Type</InputLabel>
              <Select
                name="vendor_type"
                value={form.vendor_type || ''}
                onChange={handleChange}
                label="Vendor Type"
              >
                {vendorTypeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField name="pan_number" label="PAN Number" value={form.pan_number || ''} onChange={handleChange} fullWidth />
            <TextField name="gst_number" label="GST Number" value={form.gst_number || ''} onChange={handleChange} fullWidth />
            <TextField name="contact_person" label="Contact Person" value={form.contact_person || ''} onChange={handleChange} fullWidth />
            <TextField name="email" label="Email Address" value={form.email || ''} onChange={handleChange} fullWidth />
            <TextField name="phone_number" label="Phone Number" value={form.phone_number || ''} onChange={handleChange} fullWidth />
            <TextField name="bank_name" label="Bank Name" value={form.bank_name || ''} onChange={handleChange} fullWidth />
            <TextField name="bank_account" label="Bank Account No." value={form.bank_account || ''} onChange={handleChange} fullWidth />
            <TextField name="ifsc_code" label="IFSC Code" value={form.ifsc_code || ''} onChange={handleChange} fullWidth />
            <TextField name="address" label="Address" value={form.address || ''} onChange={handleChange} fullWidth />
            <TextField name="notes" label="Notes" value={form.notes || ''} onChange={handleChange} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Company</InputLabel>
              <Select
                name="company_id"
                value={form.company_id || ''}
                onChange={handleChange}
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorManagement;
