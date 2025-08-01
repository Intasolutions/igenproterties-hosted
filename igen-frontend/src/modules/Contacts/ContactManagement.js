// ContactManagement.js

import React, { useState, useEffect, useMemo } from 'react';
import API from '../../api/axios';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Card, CardContent, Typography, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Tooltip, Snackbar, Alert, Slide, Select, MenuItem, InputLabel, FormControl,
  Checkbox, ListItemText, OutlinedInput
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const stakeholderOptions = [
  'Landlord', 'Tenant', 'Vendor', 'Buyer', 'Seller', 'Broker', 'Key Holder', 'Project Stakeholder', 'Other'
];

const defaultForm = {
  full_name: '',
  type: 'Individual',
  stakeholder_types: [],
  phone: '',
  alternate_phone: '',
  email: '',
  address: '',
  pan: '',
  gst: '',
  notes: '',
  linked_properties: []
};

export default function ContactManagement() {
  const [contacts, setContacts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStakeholder, setSelectedStakeholder] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetchContacts();
    fetchProperties();
  }, []);

  const fetchContacts = async () => {
    try {
      const params = {};
      if (selectedStakeholder) params.stakeholder_types = selectedStakeholder;
      const res = await API.get('contacts/', { params });
      setContacts(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      showSnackbar('Error fetching contacts', 'error');
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await API.get('properties/');
      setProperties(res.data);
    } catch (err) {
      showSnackbar('Failed to load properties', 'error');
    }
  };

  const handleAddOrUpdate = async () => {
    if (!form.full_name || !form.phone || form.stakeholder_types.length === 0) {
      showSnackbar('Full name, Phone, and Stakeholder Type(s) are required', 'warning');
      return;
    }
    if (form.type === 'Company' && !form.gst) {
      showSnackbar('GST number is required for Company type', 'warning');
      return;
    }

    const payload = {
      ...form,
      linked_property_ids: form.linked_properties,
    };

    try {
      if (editingId) {
        await API.put(`contacts/${editingId}/`, payload);
        showSnackbar('Contact updated');
      } else {
        await API.post('contacts/', payload);
        showSnackbar('Contact added');
      }
      fetchContacts();
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error('Save failed', err);
      showSnackbar('Save failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await API.delete(`contacts/${id}/`);
      showSnackbar('Contact deleted');
      fetchContacts();
    } catch (err) {
      showSnackbar('Delete failed', 'error');
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) return showSnackbar('Select a CSV file first', 'warning');
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      await API.post('contacts/bulk_upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showSnackbar('Bulk upload successful');
      fetchContacts();
    } catch (err) {
      showSnackbar('Bulk upload failed', 'error');
    }
  };

  const handleExport = () => {
    const headers = ['Full Name', 'Phone', 'Email', 'Address', 'Notes'];
    const rows = contacts.map(c => [c.full_name, c.phone, c.email, c.address, c.notes]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'contacts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(c =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [search, contacts]);

  return (
    <div className="p-[35px]">
      <Typography variant="h5" fontWeight={600}>Contact Management</Typography>

      <div className="flex justify-between items-center my-6 gap-4 flex-wrap">
        <TextField
          label="Search by Name or Email"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FormControl size="small" style={{ minWidth: 200 }}>
          <InputLabel>Stakeholder Filter</InputLabel>
          <Select
            value={selectedStakeholder}
            onChange={(e) => setSelectedStakeholder(e.target.value)}
            displayEmpty
            input={<OutlinedInput label="Stakeholder Filter" />}
          >
            <MenuItem value="">All</MenuItem>
            {stakeholderOptions.map(type => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <div className="flex gap-2">
          <Button variant="contained" startIcon={<UploadFileIcon />} component="label">
            Upload CSV
            <input type="file" hidden accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>Export</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setOpen(true); resetForm(); }}>Add Contact</Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Stakeholder Type(s)</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Alternate</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>PAN</TableCell>
                  <TableCell>GST</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Linked Properties</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContacts.map((c, index) => (
                  <TableRow key={c.contact_id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{c.full_name}</TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell>{(c.stakeholder_types || []).join(', ')}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.alternate_phone}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.address}</TableCell>
                    <TableCell>{c.pan}</TableCell>
                    <TableCell>{c.gst}</TableCell>
                    <TableCell>{c.notes}</TableCell>
                    <TableCell>
                      {(c.linked_properties || []).map(p => typeof p === 'object' ? p.name : (properties.find(x => x.id === p)?.name || p)).join(', ')}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => { setForm(c); setEditingId(c.contact_id); setOpen(true); }}>
                          <EditIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(c.contact_id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth TransitionComponent={Transition}>
        <DialogTitle>{editingId ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        <DialogContent dividers style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <TextField label="Full Name" fullWidth margin="normal" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} label="Type">
              <MenuItem value="Individual">Individual</MenuItem>
              <MenuItem value="Company">Company</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Stakeholder Type(s)</InputLabel>
            <Select
              multiple
              value={form.stakeholder_types}
              onChange={(e) => setForm({ ...form, stakeholder_types: e.target.value })}
              input={<OutlinedInput label="Stakeholder Type(s)" />}
              renderValue={(selected) => selected.join(', ')}
            >
              {stakeholderOptions.map(option => (
                <MenuItem key={option} value={option}>
                  <Checkbox checked={form.stakeholder_types.includes(option)} />
                  <ListItemText primary={option} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Phone" fullWidth margin="normal" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="Alternate Phone" fullWidth margin="normal" value={form.alternate_phone} onChange={(e) => setForm({ ...form, alternate_phone: e.target.value })} />
          <TextField label="Email" fullWidth margin="normal" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Address" fullWidth margin="normal" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <TextField label="PAN" fullWidth margin="normal" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
          {form.type === 'Company' && (
            <TextField label="GST" fullWidth margin="normal" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />
          )}
          <TextField label="Notes" fullWidth multiline rows={2} margin="normal" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Linked Properties</InputLabel>
            <Select
              multiple
              value={form.linked_properties}
              onChange={(e) => setForm({ ...form, linked_properties: e.target.value })}
              input={<OutlinedInput label="Linked Properties" />}
              renderValue={(selected) => selected.map(id => {
                const p = properties.find(x => x.id === id);
                return p?.name || id;
              }).join(', ')}
            >
              {properties.map(prop => (
                <MenuItem key={prop.id} value={prop.id}>
                  <Checkbox checked={form.linked_properties.includes(prop.id)} />
                  <ListItemText primary={prop.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddOrUpdate}>{editingId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}
