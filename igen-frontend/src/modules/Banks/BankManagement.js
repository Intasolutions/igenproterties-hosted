import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select,
  Card, CardContent, Typography, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert,
  Tooltip,Slide
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { TablePagination } from '@mui/material';
import SearchBar from '../../components/SearchBar';
import ConfirmDialog from '../../components/ConfirmDialog';




const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />; 
});


export default function BankManagement() {
  const [banks, setBanks] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(5);
const [searchQuery, setSearchQuery] = useState('');
const [confirmOpen, setConfirmOpen] = useState(false);
const [selectedBank, setSelectedBank] = useState(null);





const handleChangePage = (event, newPage) => {
  setPage(newPage);
};

const handleChangeRowsPerPage = (event) => {
  setRowsPerPage(parseInt(event.target.value, 10));
  setPage(0);
};



  const [form, setForm] = useState({
    company_id: '',
    account_name: '',
    account_number: '',
    bank_name: '',
    ifsc: '',
  });

  const [editForm, setEditForm] = useState({
    id: '',
    company_id: '',
    account_name: '',
    account_number: '',
    bank_name: '',
    ifsc: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});

  const fetchBanks = async () => {
    try {
     const res = await API.get('banks/?include_inactive=true'); 
      setBanks(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Error fetching banks', severity: 'error' });
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await API.get('companies/');
      setCompanies(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Error fetching companies', severity: 'error' });
    }
  };

  useEffect(() => {
    fetchBanks();
    fetchCompanies();
  }, []);

const validateForm = (data) => {
  const errors = {};

  if (!data.company_id) errors.company_id = 'Company is required';
  if (!data.account_name) errors.account_name = 'Account name is required';
  if (!data.account_number) {
    errors.account_number = 'Account number is required';
  } else if (!/^\d{9,18}$/.test(data.account_number)) {
    errors.account_number = 'Account number must be 9 to 18 digits';
  }

  if (!data.bank_name) errors.bank_name = 'Bank name is required';

  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!data.ifsc) {
    errors.ifsc = 'IFSC is required';
  } else if (!ifscRegex.test(data.ifsc.toUpperCase())) {
    errors.ifsc = 'Invalid IFSC code format';
  }

  return errors;
};


  const handleAddBank = async () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    try {
      await API.post('banks/', form);
      setSnackbar({ open: true, message: 'Bank added successfully!', severity: 'success' });
      fetchBanks();
      setOpen(false);
      setForm({ company_id: '', account_name: '', account_number: '', bank_name: '', ifsc: '' });
      setFormErrors({});
    } catch {
      setSnackbar({ open: true, message: 'Failed to add bank', severity: 'error' });
    }
  };

const openEditModal = (bank) => {
  setEditForm({
    id: bank.id,
    company_id: bank.company?.id || '',
    account_name: bank.account_name,
    account_number: bank.account_number,
    bank_name: bank.bank_name,
    ifsc: bank.ifsc,
  });
  setEditFormErrors({}); // ✅ Clear old errors
  setEditOpen(true);
};

const handleAddDialogOpen = () => {
  setFormErrors({});
  setForm({ company_id: '', account_name: '', account_number: '', bank_name: '', ifsc: '' });
  setOpen(true);
};


  const handleEditBank = async () => {
    const errors = validateForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }
    try {
      await API.put(`banks/${editForm.id}/`, editForm);
      setSnackbar({ open: true, message: 'Bank updated successfully!', severity: 'success' });
      fetchBanks();
      setEditOpen(false);
    } catch {
      setSnackbar({ open: true, message: 'Failed to update bank', severity: 'error' });
    }
  };

const handleConfirmToggle = (bank) => {
  setSelectedBank(bank);
  setConfirmOpen(true);
};

const confirmToggleStatus = async () => {
  if (!selectedBank) return;

  const updatedStatus = !selectedBank.is_active;

  try {
    await API.patch(`banks/${selectedBank.id}/`, { is_active: updatedStatus });
    setSnackbar({
      open: true,
      message: updatedStatus ? 'Bank reactivated successfully!' : 'Bank deactivated successfully!',
      severity: 'success',
    });
    fetchBanks();
  } catch {
    setSnackbar({
      open: true,
      message: updatedStatus ? 'Failed to reactivate bank' : 'Failed to deactivate bank',
      severity: 'error',
    });
  } finally {
    setConfirmOpen(false);
    setSelectedBank(null);
  }
};


    const filteredbank = banks.filter((b) =>
 b.account_name.toLowerCase().includes(searchQuery.toLowerCase())
);

  return (
    <div className="p-[35px]">
      <Typography variant="h5" fontWeight="bold">Bank Management</Typography>
      <div className="flex justify-between items-center mb-6 mt-6">
         <div className="flex-1 max-w-sm">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          label="Search User"
          placeholder="Enter Account Name to search"
        />
        
          
        
                  </div>
      <Button variant="contained" color="primary" onClick={handleAddDialogOpen}>Add Bank</Button>

      </div>

      <Card sx={{ boxShadow: 4, borderRadius: 3 }}>
        <CardContent>
       <TableContainer>
  <Table size="small">
    <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
      <TableRow>
        <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>Account Name</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>Account Number</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>Bank Name</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>IFSC</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {filteredbank
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((b, index) => (
         <TableRow
  key={b.id}
  hover
  sx={{
    backgroundColor: b.is_active ? '#e8f5e9' : '#fffde7', // green = active, yellow = inactive
    transition: 'background-color 0.3s ease',
  }}
>

            <TableCell>{page * rowsPerPage + index + 1}</TableCell>
            <TableCell>{b.company?.name}</TableCell>
            <TableCell>{b.account_name}</TableCell>
            <TableCell>{b.account_number}</TableCell>
            <TableCell>{b.bank_name}</TableCell>
            <TableCell>{b.ifsc}</TableCell>
            <TableCell align="center">
          <Tooltip title={b.is_active ? 'Deactivate Bank' : 'Reactivate Bank'} arrow>
  <span>
    <IconButton
      color={b.is_active ? 'error' : 'success'}
      onClick={() => handleConfirmToggle(b)}
    >
      <Delete />
    </IconButton>
  </span>
</Tooltip>
              <Tooltip title="Edit Bank" arrow>
                <IconButton color="primary" onClick={() => openEditModal(b)}>
                  <Edit />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
    </TableBody>
  </Table>

  <TablePagination
    component="div"
    count={filteredbank.length}
    page={page}
    onPageChange={handleChangePage}
    rowsPerPage={rowsPerPage}
    onRowsPerPageChange={handleChangeRowsPerPage}
      rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
  />
</TableContainer>

        </CardContent>
      </Card>

      {/* Add Bank Dialog */}
  <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"  TransitionComponent={Transition} 
       keepMounted 
       PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
  <DialogTitle>Add New Bank</DialogTitle>
  <DialogContent >
    <FormControl fullWidth margin="normal" error={!!formErrors.company_id}>
      <InputLabel id="add-company-label">Company</InputLabel>
      <Select
        labelId="add-company-label"
        value={form.company_id}
        onChange={(e) => setForm({ ...form, company_id: e.target.value })}
        onBlur={() => {
          if (!form.company_id) {
            setFormErrors((prev) => ({ ...prev, company_id: 'Company is required' }));
          } else {
            setFormErrors((prev) => ({ ...prev, company_id: undefined }));
          }
        }}
      >
        {companies.map((company) => (
          <MenuItem key={company.id} value={company.id}>
            {company.name}
          </MenuItem>
        ))}
      </Select>
      {formErrors.company_id && (
        <Typography color="error" variant="caption">{formErrors.company_id}</Typography>
      )}
    </FormControl>

    <TextField
      margin="normal"
      label="Account Name"
      fullWidth
      value={form.account_name}
      onChange={(e) => setForm({ ...form, account_name: e.target.value })}
      onBlur={() => {
        if (!form.account_name) {
          setFormErrors((prev) => ({ ...prev, account_name: 'Account name is required' }));
        } else {
          setFormErrors((prev) => ({ ...prev, account_name: undefined }));
        }
      }}
      error={!!formErrors.account_name}
      helperText={formErrors.account_name}
    />

    <TextField
      margin="normal"
      label="Account Number"
      fullWidth
      value={form.account_number}
      onChange={(e) => setForm({ ...form, account_number: e.target.value })}
      onBlur={() => {
        if (!form.account_number) {
          setFormErrors((prev) => ({ ...prev, account_number: 'Account number is required' }));
        } else {
          setFormErrors((prev) => ({ ...prev, account_number: undefined }));
        }
      }}
      error={!!formErrors.account_number}
      helperText={formErrors.account_number}
    />

    <TextField
      margin="normal"
      label="Bank Name"
      fullWidth
      value={form.bank_name}
      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
      onBlur={() => {
        if (!form.bank_name) {
          setFormErrors((prev) => ({ ...prev, bank_name: 'Bank name is required' }));
        } else {
          setFormErrors((prev) => ({ ...prev, bank_name: undefined }));
        }
      }}
      error={!!formErrors.bank_name}
      helperText={formErrors.bank_name}
    />
<TextField
  label="IFSC"
  fullWidth
  margin="normal"
  value={form.ifsc}
  onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} // auto-uppercase
  onBlur={() => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!form.ifsc) {
      setFormErrors((prev) => ({ ...prev, ifsc: 'IFSC is required' }));
    } else if (!ifscRegex.test(form.ifsc)) {
      setFormErrors((prev) => ({ ...prev, ifsc: 'Invalid IFSC code format' }));
    } else {
      setFormErrors((prev) => ({ ...prev, ifsc: undefined }));
    }
  }}
  error={!!formErrors.ifsc}
  helperText={formErrors.ifsc}
/>

  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="contained" onClick={handleAddBank}>Add</Button>
  </DialogActions>
</Dialog>


      {/* Edit Bank Dialog */}
   <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
  <DialogTitle>Edit Bank</DialogTitle>
  <DialogContent dividers>
    <FormControl fullWidth margin="normal" error={!!editFormErrors.company_id}>
      <InputLabel id="edit-company-label">Company</InputLabel>
      <Select
        labelId="edit-company-label"
        value={editForm.company_id}
        onChange={(e) => setEditForm({ ...editForm, company_id: e.target.value })}
        onBlur={() => {
          if (!editForm.company_id) {
            setEditFormErrors((prev) => ({ ...prev, company_id: 'Company is required' }));
          } else {
            setEditFormErrors((prev) => ({ ...prev, company_id: undefined }));
          }
        }}
      >
        {companies.map((company) => (
          <MenuItem key={company.id} value={company.id}>
            {company.name}
          </MenuItem>
        ))}
      </Select>
      {editFormErrors.company_id && (
        <Typography color="error" variant="caption">{editFormErrors.company_id}</Typography>
      )}
    </FormControl>

    <TextField
      margin="normal"
      label="Account Name"
      fullWidth
      value={editForm.account_name}
      onChange={(e) => setEditForm({ ...editForm, account_name: e.target.value })}
      onBlur={() => {
        if (!editForm.account_name) {
          setEditFormErrors((prev) => ({ ...prev, account_name: 'Account name is required' }));
        } else {
          setEditFormErrors((prev) => ({ ...prev, account_name: undefined }));
        }
      }}
      error={!!editFormErrors.account_name}
      helperText={editFormErrors.account_name}
    />

    <TextField
      margin="normal"
      label="Account Number"
      fullWidth
      value={editForm.account_number}
      onChange={(e) => setEditForm({ ...editForm, account_number: e.target.value })}
      onBlur={() => {
        if (!editForm.account_number) {
          setEditFormErrors((prev) => ({ ...prev, account_number: 'Account number is required' }));
        } else {
          setEditFormErrors((prev) => ({ ...prev, account_number: undefined }));
        }
      }}
      error={!!editFormErrors.account_number}
      helperText={editFormErrors.account_number}
    />

    <TextField
      margin="normal"
      label="Bank Name"
      fullWidth
      value={editForm.bank_name}
      onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })}
      onBlur={() => {
        if (!editForm.bank_name) {
          setEditFormErrors((prev) => ({ ...prev, bank_name: 'Bank name is required' }));
        } else {
          setEditFormErrors((prev) => ({ ...prev, bank_name: undefined }));
        }
      }}
      error={!!editFormErrors.bank_name}
      helperText={editFormErrors.bank_name}
    />

    <TextField
      margin="normal"
      label="IFSC"
      fullWidth
      value={editForm.ifsc}
      onChange={(e) => setEditForm({ ...editForm, ifsc: e.target.value })}
      onBlur={() => {
        if (!editForm.ifsc) {
          setEditFormErrors((prev) => ({ ...prev, ifsc: 'IFSC is required' }));
        } else {
          setEditFormErrors((prev) => ({ ...prev, ifsc: undefined }));
        }
      }}
      error={!!editFormErrors.ifsc}
      helperText={editFormErrors.ifsc}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
    <Button variant="contained" onClick={handleEditBank}>Save</Button>
  </DialogActions>
</Dialog>


      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
<ConfirmDialog
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={confirmToggleStatus}
  title={selectedBank?.is_active ? 'Deactivate Bank' : 'Reactivate Bank'}
  content={`Are you sure you want to ${selectedBank?.is_active ? 'deactivate' : 'reactivate'} this bank: ${selectedBank?.account_name}?`}
/>


    </div>
  );
}
