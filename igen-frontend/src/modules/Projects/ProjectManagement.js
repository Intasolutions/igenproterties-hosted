import React, { useState, useEffect, useMemo } from 'react';
import API from '../../api/axios';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Card, CardContent, Typography, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Tooltip, Snackbar, Alert, Slide, MenuItem, Checkbox, ListItemText
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import BulkUploadDialog from '../../components/BulkUploadDialog';
import TablePaginationComponent from '../../components/TablePaginationComponent';
import SearchBar from '../../components/SearchBar';
import ConfirmDialog from '../../components/ConfirmDialog';


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [open, setOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
const [page, setPage] = useState(0);
const[rowsPerPage, setRowsPerPage] = useState(5);
const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
const [targetProject, setTargetProject] = useState(null);



  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    stakeholders: [],
    expected_return: '',
    project_status: 'proposed',
    landmark: '',
    pincode: '',
    city: '',
    district: '',
    state: 'Kerala',
    country: 'India',
    company_id: '',
    property_manager: '',
    key_stakeholder: '',
    project_type: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchContacts();
    fetchProjectManagers();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await API.get('companies/');
      setCompanies(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      showSnackbar('Error fetching companies', 'error');
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await API.get('projects/');
      setProjects(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      showSnackbar('Error fetching projects', 'error');
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await API.get('contacts/');
      setContacts(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      showSnackbar('Error fetching contacts', 'error');
    }
  };

  const fetchProjectManagers = async () => {
    try {
      const res = await API.get('users/?role=PROPERTY_MANAGER');
      setProjectManagers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      showSnackbar('Error fetching property managers', 'error');
    }
  };

const handleAddOrUpdateProject = async () => {
  const errors = {};

  if (!form.name?.trim()) errors.name = 'Project name is required';
  if (!form.start_date) errors.start_date = 'Start date is required';
  if (!form.company_id) errors.company_id = 'Company is required';
  if (!form.project_type) errors.project_type = 'Project type is required';
  if (!form.project_status) errors.project_status = 'Project status is required';
  if (!form.property_manager) errors.property_manager = 'Property manager is required';
  if (!form.city?.trim()) errors.city = 'City is required';
  if (!form.district?.trim()) errors.district = 'District is required';
  if (!form.state?.trim()) errors.state = 'State is required';
  if (!form.country?.trim()) errors.country = 'Country is required';

  setValidationErrors(errors);

  if (Object.keys(errors).length > 0) {
    showSnackbar('Please correct the highlighted fields', 'warning');
    return;
  }
    const payload = {
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date || null,
      project_type: form.project_type || null,
      expected_return: form.expected_return || null,
      project_status: form.project_status || 'proposed',
      landmark: form.landmark || '',
      pincode: form.pincode || '',
      city: form.city || '',
      district: form.district || '',
      state: form.state || '',
      country: form.country || '',
      company: form.company_id || null,

     
  stakeholder_ids: form.stakeholders.filter(Boolean),  // <-- updated key
  property_manager_id: form.property_manager || null,  // <-- updated key
  key_stakeholder_id: form.key_stakeholder || null 
    };

    try {
      if (editingId) {
        await API.put(`projects/${editingId}/`, payload);
        showSnackbar('Project updated');
      } else {
        await API.post('projects/', payload);
        showSnackbar('Project added');
      }

      fetchProjects();
      setOpen(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      console.error("Failed to save project:", err?.response?.data || err.message);
      showSnackbar(err?.response?.data?.detail || 'Failed to save project', 'error');
    }
  };

  const resetForm = () => setForm({
    name: '',
    start_date: '',
    end_date: '',
    stakeholders: [],
    expected_return: '',
    project_status: 'proposed',
    landmark: '',
    pincode: '',
    city: '',
    district: '',
    state: 'Kerala',
    country: 'India',
    company_id: '',
    property_manager: '',
    key_stakeholder: '',
    project_type: ''
  });

  const handleEdit = (project) => {
    setForm({
      ...project,
      company_id: project.company?.id || '',
      property_manager: project.property_manager?.id ?? '',
key_stakeholder: project.key_stakeholder?.contact_id ?? '',
stakeholders: Array.isArray(project.stakeholders) ? project.stakeholders.map(s => s.contact_id ?? '') : []


    });
    setEditingId(project.id);
    setOpen(true);
  };

  const handleUploadCSV = async () => {
    if (!csvFile) {
      showSnackbar('Choose a CSV file first', 'warning');
      return;
    }
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      await API.post('projects/bulk_upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showSnackbar('Bulk upload successful');
      fetchProjects();
    } catch {
      showSnackbar('Bulk upload failed', 'error');
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await API.delete(`projects/${id}/`);
      showSnackbar('Project deleted');
      fetchProjects();
    } catch {
      showSnackbar('Delete failed', 'error');
    }
  };

  const handleToggleActive = (project) => {
  setTargetProject(project);
  setConfirmDialogOpen(true);
};
const confirmToggleActive = async () => {
  if (!targetProject) return;

  try {
    await API.patch(`projects/${targetProject.id}/`, {
      is_active: !targetProject.is_active,
    });
    showSnackbar(`Project ${targetProject.is_active ? 'deactivated' : 'activated'} successfully`);
    fetchProjects();
  } catch {
    showSnackbar('Failed to update status', 'error');
  } finally {
    setConfirmDialogOpen(false);
    setTargetProject(null);
  }
};


  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Start Date', 'End Date', 'Project Type', 'Expected Return', 'Status'];
    const rows = projects.map(p => [
      p.name,
      p.start_date,
      p.end_date,
      p.project_type,
      p.expected_return,
      p.project_status
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'projects.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProjects = useMemo(() => {
  return projects.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
}, [search, projects]);


const paginatedProjects = useMemo(() => {
  const start = page * rowsPerPage;
  const end = rowsPerPage === -1 ? filteredProjects.length : start + rowsPerPage;
  return filteredProjects.slice(start, end);
}, [page, rowsPerPage, filteredProjects]);



  const keralaDistricts = [
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
  'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
  'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
];


const handleFileChange = (e) => {
  const selectedFile = e.target.files?.[0];
  if (selectedFile && selectedFile.size <= 10 * 1024 * 1024) {
    setCsvFile(selectedFile);
  } else {
    showSnackbar('File must be under 10MB', 'warning');
  }
};

const handleBulkUpload = async () => {
  if (!csvFile) return;
  const formData = new FormData();
  formData.append('file', csvFile);
  try {
    await API.post('projects/bulk_upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    showSnackbar('Bulk upload successful');
    fetchProjects();
    setUploadDialogOpen(false);
    setCsvFile(null);
  } catch (error) {
    console.error(error);
    showSnackbar('Bulk upload failed', 'error');
  }
};


  return (
    <div className="p-[35px]">
      <Typography variant="h5" fontWeight={600}>Project Management</Typography>

      <div className="flex justify-between items-center mb-6 mt-6">
        <SearchBar
  label="Search Projects"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>

        <div className="flex gap-3">
        {/* <Button variant="outlined" startIcon={<UploadFileIcon />} component="label">
            Upload CSV
            <input hidden type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
          </Button>
          <Button onClick={handleUploadCSV}>Submit CSV</Button> */}
          <Button
  variant="outlined"
  startIcon={<UploadFileIcon />}
  onClick={() => setUploadDialogOpen(true)}
  sx={{
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 500,
    px: 2,
    bgcolor: '#e3f2fd',
    '&:hover': {
      bgcolor: '#bbdefb',
    },
  }}
>
  Bulk Upload
</Button>

          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}
          color='success'
          sx={{
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 500,
    px: 2,
    bgcolor: '#e8f5e9',
    '&:hover': {
      bgcolor: '#c8e6c9',
    },
  }}
  >Export</Button> 
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            color="primary"
            onClick={() => {
              setOpen(true);
              resetForm();
              setEditingId(null);
            }}
          >
            Add Project
          </Button>
        </div>
      </div>


<Card>
  <CardContent>
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Expected Return</TableCell>
            <TableCell>Manager</TableCell>
            <TableCell>Stakeholder</TableCell>
            <TableCell>City</TableCell>
            <TableCell>District</TableCell>
            <TableCell>State</TableCell>
            <TableCell>Country</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        {paginatedProjects.length > 0 ? paginatedProjects.map((p, i) => (
<TableRow key={p.id} sx={{ backgroundColor: p.is_active ? '#e8f5e9' : '#fffde7' }}>


       <TableCell>{page * rowsPerPage + i + 1}</TableCell>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.start_date}</TableCell>
              <TableCell>{p.end_date || '-'}</TableCell>
              <TableCell>{p.project_type || '-'}</TableCell>
              <TableCell>{p.project_status}</TableCell>
              <TableCell>{p.expected_return || '-'}</TableCell>
              <TableCell>{p.property_manager?.full_name || p.property_manager?.username || '-'}</TableCell>
              <TableCell>{p.key_stakeholder?.full_name || '-'}</TableCell>
              <TableCell>{p.city || '-'}</TableCell>
              <TableCell>{p.district || '-'}</TableCell>
              <TableCell>{p.state || '-'}</TableCell>
              <TableCell>{p.country || '-'}</TableCell>
              <TableCell>
                <Tooltip title="Edit">
                  <IconButton color='primary' onClick={() => handleEdit(p)}><EditIcon /></IconButton>
                </Tooltip>
             <Tooltip title={p.is_active ? 'Deactivate' : 'Activate'}>
  <IconButton onClick={() => handleToggleActive(p)}>
    <DeleteIcon style={{ color: p.is_active ? 'red' : 'green' }} />
  </IconButton>
</Tooltip>

              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={14} align="center">No projects found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePaginationComponent
  count={filteredProjects.length}
  page={page}
  rowsPerPage={rowsPerPage}
  onPageChange={(event, newPage) => setPage(newPage)}
  onRowsPerPageChange={(event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }}
/>

  </CardContent>
</Card>

<Dialog
  open={open}
  onClose={() => {
    setOpen(false);
    resetForm();
    setEditingId(null);
}}
  maxWidth="sm"
  fullWidth
  TransitionComponent={Transition}
    PaperProps={{ sx: { borderRadius: 3, p: 2 } }} 
>
  <DialogTitle>{editingId ? 'Edit Project' : 'Add Project'}</DialogTitle>
<DialogContent  style={{ maxHeight: '70vh', overflowY: 'auto' }}>
  <TextField
    select
    label="Company"
    required
    fullWidth
    margin="normal"
    value={form.company_id}
    onChange={(e) => {
      setForm({ ...form, company_id: e.target.value });
      setValidationErrors({ ...validationErrors, company_id: '' });
    }}
    error={!!validationErrors.company_id}
    helperText={validationErrors.company_id}
  >
    <MenuItem value="">Select Company</MenuItem>
    {companies.map((c) => (
      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
    ))}
  </TextField>

  <TextField
    label="Name"
    required
    fullWidth
    margin="normal"
    value={form.name}
    onChange={(e) => {
      setForm({ ...form, name: e.target.value });
      setValidationErrors({ ...validationErrors, name: '' });
    }}
    error={!!validationErrors.name}
    helperText={validationErrors.name}
  />

  <TextField
    label="Start Date"
    type="date"
    required
    fullWidth
    margin="normal"
    InputLabelProps={{ shrink: true }}
    value={form.start_date}
    onChange={(e) => {
      setForm({ ...form, start_date: e.target.value });
      setValidationErrors({ ...validationErrors, start_date: '' });
    }}
    error={!!validationErrors.start_date}
    helperText={validationErrors.start_date}
  />

  <TextField
    label="End Date"
    type="date"
    fullWidth
    margin="normal"
    InputLabelProps={{ shrink: true }}
    value={form.end_date}
    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
  />

  <TextField
    select
    label="Project Type"
    required
    fullWidth
    margin="normal"
    value={form.project_type}
    onChange={(e) => {
      setForm({ ...form, project_type: e.target.value });
      setValidationErrors({ ...validationErrors, project_type: '' });
    }}
    error={!!validationErrors.project_type}
    helperText={validationErrors.project_type}
  >
    <MenuItem value="">Select Type</MenuItem>
    {['internal', 'construction', 'interior'].map(type => (
      <MenuItem key={type} value={type}>{type}</MenuItem>
    ))}
  </TextField>

  <TextField
    select
    label="Stakeholders"
    fullWidth
    margin="normal"
    SelectProps={{
      multiple: true,
      renderValue: (selected) =>
        contacts
          .filter(c => selected.includes(String(c.contact_id)))
          .map(c => c.full_name || c.email)
          .join(', ')
    }}
    value={form.stakeholders.map(String)}
    onChange={(e) =>
      setForm({
        ...form,
        stakeholders: e.target.value.map(String)
      })
    }
  >
    {contacts.map(c => (
      <MenuItem key={c.contact_id} value={String(c.contact_id)}>
        <Checkbox checked={form.stakeholders.map(String).includes(String(c.contact_id))} />
        <ListItemText primary={c.full_name || c.email || `Contact ${c.contact_id}`} />
      </MenuItem>
    ))}
  </TextField>

  <TextField
    label="Expected Return"
    fullWidth
    margin="normal"
    type="number"
    value={form.expected_return}
    onChange={(e) => setForm({ ...form, expected_return: e.target.value })}
  />

  <Typography variant="subtitle2" sx={{ mt: 2 }}>Address Details</Typography>

  <TextField
    label="Landmark"
    fullWidth
    margin="normal"
    value={form.landmark}
    onChange={(e) => setForm({ ...form, landmark: e.target.value })}
  />

  <TextField
    label="Pincode"
    fullWidth
    margin="normal"
    value={form.pincode}
    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
  />

  <TextField
    label="City"
    required
    fullWidth
    margin="normal"
    value={form.city}
    onChange={(e) => {
      setForm({ ...form, city: e.target.value });
      setValidationErrors({ ...validationErrors, city: '' });
    }}
    error={!!validationErrors.city}
    helperText={validationErrors.city}
  />

<TextField
  select
  label="District"
  required
  fullWidth
  margin="normal"
  value={form.district}
  onChange={(e) => {
    setForm({ ...form, district: e.target.value });
    setValidationErrors({ ...validationErrors, district: '' });
  }}
  error={!!validationErrors.district}
  helperText={validationErrors.district}
>
  <MenuItem value="">Select District</MenuItem>
  {keralaDistricts.map((d) => (
    <MenuItem key={d} value={d}>{d}</MenuItem>
  ))}
</TextField>


  <TextField
    label="State"
    required
    fullWidth
    margin="normal"
    value={form.state}
    onChange={(e) => {
      setForm({ ...form, state: e.target.value });
      setValidationErrors({ ...validationErrors, state: '' });
    }}
    error={!!validationErrors.state}
    helperText={validationErrors.state}
  />

  <TextField
    label="Country"
    required
    fullWidth
    margin="normal"
    value={form.country}
    onChange={(e) => {
      setForm({ ...form, country: e.target.value });
      setValidationErrors({ ...validationErrors, country: '' });
    }}
    error={!!validationErrors.country}
    helperText={validationErrors.country}
  />

  <TextField
    select
    label="Property Manager"
    required
    fullWidth
    margin="normal"
    value={form.property_manager}
    onChange={(e) => {
      setForm({ ...form, property_manager: e.target.value });
      setValidationErrors({ ...validationErrors, property_manager: '' });
    }}
    error={!!validationErrors.property_manager}
    helperText={validationErrors.property_manager}
  >
    <MenuItem value="">Select Manager</MenuItem>
    {projectManagers.map(u => (
      <MenuItem key={u.id} value={u.id}>{u.full_name || u.username} ({u.email})</MenuItem>
    ))}
  </TextField>

  <TextField
    select
    label="Key Stakeholder"
    fullWidth
    margin="normal"
    value={form.key_stakeholder}
    onChange={(e) => setForm({ ...form, key_stakeholder: e.target.value })}
  >
    <MenuItem value="">Select Key Stakeholder</MenuItem>
    {contacts.map(c => (
      <MenuItem key={c.contact_id} value={c.contact_id}>
        {c.full_name || c.email || `Contact ${c.contact_id}`}
      </MenuItem>
    ))}
  </TextField>

  <TextField
    select
    label="Status"
    required
    fullWidth
    margin="normal"
    value={form.project_status}
    onChange={(e) => {
      setForm({ ...form, project_status: e.target.value });
      setValidationErrors({ ...validationErrors, project_status: '' });
    }}
    error={!!validationErrors.project_status}
    helperText={validationErrors.project_status}
  >
    <MenuItem value="">Select Status</MenuItem>
    <MenuItem value="proposed">Proposed</MenuItem>
    <MenuItem value="in_progress">In Progress</MenuItem>
    <MenuItem value="completed">Completed</MenuItem>
  </TextField>
</DialogContent>

  <DialogActions>
   <Button onClick={() => {
  setOpen(false);
  resetForm();
  setEditingId(null);
}}>
  Cancel
</Button>

    <Button variant="contained" onClick={handleAddOrUpdateProject}>
      {editingId ? 'Update' : 'Add'}
    </Button>
  </DialogActions>
</Dialog>

<Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
  <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
</Snackbar>



<BulkUploadDialog
  open={uploadDialogOpen}
  onClose={() => {
    setUploadDialogOpen(false);
    setCsvFile(null);
  }}
  onFileChange={handleFileChange}
  onUpload={handleBulkUpload}
  file={csvFile}
  sampleLink="/sample/project_sample.csv"  // place a sample file in public folder
/>
<ConfirmDialog
  open={confirmDialogOpen}
  title="Confirm Status Change"
  content={`Are you sure you want to ${targetProject?.is_active ? 'deactivate' : 'activate'} this project?`}
  onClose={() => {
    setConfirmDialogOpen(false);
    setTargetProject(null);
  }}
  onConfirm={confirmToggleActive}
/>

    </div>
  );
}
