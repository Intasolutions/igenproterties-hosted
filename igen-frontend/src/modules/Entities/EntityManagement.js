// EntityManagement.js — Complete BRD-compliant with Formik + Yup, search, pagination, modern dialog styling, inactive highlighting, and name uniqueness check

import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Snackbar, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Card, CardContent, IconButton, Tooltip, FormControl, FormLabel,
  TablePagination, ToggleButton, ToggleButtonGroup, Chip, Stack, Slide
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ExportCsvButton from '../../components/ExportCsvButton'; // update path as needed
import FolderIcon from '@mui/icons-material/Folder';
import HomeIcon from '@mui/icons-material/Home';
import ConfirmDialog from '../../components/ConfirmDialog';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EntitySchema = Yup.object().shape({
  company: Yup.string().required('Company is required'),
  name: Yup.string().required('Entity Name is required'),
  entity_type: Yup.string().oneOf(['Property', 'Project', 'Internal']).required(),
  linked_property: Yup.string().when('entity_type', {
    is: 'Property',
    then: schema => schema.required('Linked Property is required'),
    otherwise: schema => schema.notRequired(),
  }),
  linked_project: Yup.string().when('entity_type', {
    is: 'Project',
    then: schema => schema.required('Linked Project is required'),
    otherwise: schema => schema.notRequired(),
  }),
  status: Yup.string().oneOf(['Active', 'Inactive']),
  remarks: Yup.string(),
});

export default function EntityManagement() {
  const [entities, setEntities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [form, setForm] = useState({
    company: '', name: '', entity_type: 'Property',
    linked_property: '', linked_project: '',
    status: 'Active', remarks: ''
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false, title: '', content: '', id: null, action: null,
  });

  const resetForm = () => setForm({
    company: '', name: '', entity_type: 'Property',
    linked_property: '', linked_project: '',
    status: 'Active', remarks: ''
  });

  const fetchEntities = useCallback(async () => {
    try {
      const res = await API.get('entities/');
      setEntities(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      setSnackbar({ open: true, message: 'Error fetching entities', severity: 'error' });
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await API.get('companies/');
      setCompanies(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Error fetching companies', severity: 'error' });
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await API.get('properties/');
      setProperties(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      setSnackbar({ open: true, message: 'Error fetching properties', severity: 'error' });
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await API.get('projects/');
      setProjects(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      setSnackbar({ open: true, message: 'Error fetching projects', severity: 'error' });
    }
  }, []);

  useEffect(() => {
    fetchEntities(); fetchCompanies(); fetchProperties(); fetchProjects();
  }, [fetchEntities, fetchCompanies, fetchProperties, fetchProjects]);

  const handleConfirm = async () => {
    const { id, action } = confirmDialog;
    try {
      if (action === 'deactivate') {
        await API.patch(`entities/${id}/`, { status: 'Inactive' });
        setSnackbar({ open: true, message: 'Entity deactivated successfully', severity: 'success' });
      }
      fetchEntities();
    } catch {
      setSnackbar({ open: true, message: 'Action failed', severity: 'error' });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const openEditDialog = (entity) => {
    setForm({
      company: entity.company,
      name: entity.name,
      entity_type: entity.entity_type,
      linked_property: entity.linked_property || '',
      linked_project: entity.linked_project || '',
      status: entity.status,
      remarks: entity.remarks,
    });
    setEditId(entity.id || entity.entity_id);
    setIsEditMode(true);
    setOpen(true);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredEntities = entities.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unknown';
  const getPropertyName = (id) => properties.find(p => p.id === id)?.name || 'Unknown';

  const isDuplicateName = (values) => {
  return entities.some(e =>
    e.company === values.company &&
    e.name.trim().toLowerCase() === values.name.trim().toLowerCase() &&
    (!isEditMode || e.id !== editId)
  );
};
const dialogVariants = {
  hidden: { opacity: 0, y: -40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

const handleExportToCSV = () => {
  const headers = ['Company', 'Entity Name', 'Type', 'Status', 'Remarks'];
  
  const rows = filteredEntities.map(e => [
    e.company_name,
    e.name,
    e.entity_type,
    e.status,
    e.remarks || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'entities.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  return (
    <div className="p-[35px]">
      <Typography variant="h5" fontWeight="bold">Entity Management</Typography>
     <div className="flex justify-between items-center mt-6 mb-6 flex-wrap gap-4">
        
      

     <div className="flex-1 max-w-sm">
       <TextField
         label="Search by Name"
         variant="outlined"
         size="small"
         fullWidth
         value={search}
         onChange={(e) => setSearch(e.target.value)}
         placeholder="Type property name..."
         InputProps={{
           startAdornment: (
             <span className="material-icons text-gray-500 mr-2">search</span>
           ),
           sx: {
             borderRadius: 3,
             backgroundColor: '#fafafa',
           }
         }}
       />
     </div>

     <div className='flex gap-3' >
     <ExportCsvButton
  data={filteredEntities.map(e => ({
    Company: e.company_name,
    'Entity Name': e.name,
    Type: e.entity_type,
    Status: e.status,
    Remarks: e.remarks || ''
  }))}
  headers={['Company', 'Entity Name', 'Type', 'Status', 'Remarks']}
  filename="entities.csv"
/>

       <Button variant="contained" color="primary" onClick={() => { resetForm(); setOpen(true); setIsEditMode(false); }}>ADD ENTITY</Button>
       
      </div>
      </div>

      {/* Dialog for Add/Edit */}
    <Dialog
   open={open}
       onClose={() => setOpen(false)}
       maxWidth="sm"
       fullWidth
       TransitionComponent={Transition} 
       keepMounted 
       PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
     >

  <Formik
    initialValues={form}
    enableReinitialize
    validationSchema={EntitySchema}
    onSubmit={async (values, { setSubmitting }) => {
      if (isDuplicateName(values)) {
  setSnackbar({
    open: true,
    message: 'Entity name already exists for this company.',
    severity: 'error',
  });
  return;
}



      const payload = {
        ...values,
        linked_property: values.entity_type === 'Property' ? values.linked_property : null,
        linked_project: values.entity_type === 'Project' ? values.linked_project : null,
      };

      try {
        if (isEditMode) {
          await API.put(`entities/${editId}/`, payload);
          setSnackbar({ open: true, message: 'Entity updated successfully', severity: 'success' });
        } else {
          await API.post('entities/', payload);
          setSnackbar({ open: true, message: 'Entity added successfully', severity: 'success' });
        }
        fetchEntities();
        setOpen(false);
        resetForm();
        setIsEditMode(false);
      } catch (err) {
        const message = err.response?.data?.name?.[0] || 'Failed to save entity';
        setSnackbar({ open: true, message, severity: 'error' });
      } finally {
        setSubmitting(false);
      }
    }}
  >
    {({ values, handleChange, touched, errors }) => (
      <Form>
        <motion.div
          variants={dialogVariants}
          initial="hidden"
          animate="visible"
        >
          <DialogTitle >
            {isEditMode ? 'Edit Entity' : 'Add New Entity'}
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            <TextField
              select
              margin="normal"
              label="Company *"
              name="company"
              fullWidth
              value={values.company}
              onChange={handleChange}
              error={touched.company && !!errors.company}
              helperText={touched.company && errors.company}
            >
              {companies.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              margin="normal"
              label="Entity Name *"
              name="name"
              fullWidth
              value={values.name}
              onChange={handleChange}
              error={touched.name && !!errors.name}
              helperText={touched.name && errors.name}
            />

<FormControl fullWidth sx={{ mt: 2 }}>
  <FormLabel sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
    Entity Type
  </FormLabel>
  <ToggleButtonGroup
    color="primary"
    exclusive
    value={values.entity_type}
    onChange={(e, val) => {
      if (val !== null) {
        handleChange({ target: { name: 'entity_type', value: val } });
      }
    }}
    sx={{
      display: 'flex',
      gap: 2,
      '& .MuiToggleButton-root': {
        flex: 1,
        border: '1px solid #ddd',
        borderRadius: 2,
        padding: '16px 12px',
        fontWeight: 500,
        backgroundColor: '#fafafa',
        textTransform: 'uppercase',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'all 0.2s ease-in-out',
    
        '&.Mui-selected': {
          backgroundColor: 'primary.main',
          color: 'black',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
        },
      },
    }}
  >
    <ToggleButton value="Property"> Property</ToggleButton>
    <ToggleButton value="Project">Project</ToggleButton>
   
  </ToggleButtonGroup>
</FormControl>


            {values.entity_type === 'Property' && (
              <TextField
                select
                margin="normal"
                label="Linked Property *"
                name="linked_property"
                fullWidth
                value={values.linked_property}
                onChange={handleChange}
                error={touched.linked_property && !!errors.linked_property}
                helperText={touched.linked_property && errors.linked_property}
              >
                {properties.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
            )}

            {values.entity_type === 'Project' && (
              <TextField
                select
                margin="normal"
                label="Linked Project *"
                name="linked_project"
                fullWidth
                value={values.linked_project}
                onChange={handleChange}
                error={touched.linked_project && !!errors.linked_project}
                helperText={touched.linked_project && errors.linked_project}
              >
                {projects.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              select
              margin="normal"
              label="Status"
              name="status"
              fullWidth
              value={values.status}
              onChange={handleChange}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>

            <TextField
              margin="normal"
              label="Remarks"
              name="remarks"
              fullWidth
              multiline
              minRows={2}
              value={values.remarks}
              onChange={handleChange}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 600 }}>
              {isEditMode ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </motion.div>
      </Form>
    )}
  </Formik>
</Dialog>

      <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Entity Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEntities.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((e, idx) => (
                  <TableRow
                    key={e.entity_id}
                    sx={{
                      backgroundColor: e.status === 'Active' ? '#e8f5e9' : '#fffde7',
                      transition: 'background-color 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: e.status === 'Active' ? '#c8e6c9' : '#fff9c4'
                      }
                    }}
                  >
                    <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell>{e.company_name}</TableCell> 
                    <TableCell>{e.name}</TableCell>
<TableCell align='center'>
  <Stack spacing={0.5}>
    <Chip
      label={e.entity_type}
      color={e.entity_type === 'Project' ? 'primary' : 'secondary'}
      size="small"
      variant=""
      icon={e.entity_type === 'Project' ? <FolderIcon /> : <HomeIcon />}
    />
    {e.entity_type === 'Project' && e.linked_project && (
      <Typography variant="caption" color="text.secondary">
        {getProjectName(e.linked_project)}
      </Typography>
    )}
    {e.entity_type === 'Property' && e.linked_property && (
      <Typography variant="caption" color="text.secondary">
        {getPropertyName(e.linked_property)}
      </Typography>
    )}
  </Stack>
</TableCell>


                    <TableCell>{e.status}</TableCell>
                    <TableCell>{e.remarks || '-'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit"><IconButton color="primary" onClick={() => openEditDialog(e)}><EditIcon /></IconButton></Tooltip>
                     <Tooltip title="Deactivate">
  <IconButton
    color="error"
    onClick={() =>
      setConfirmDialog({
        open: true,
        title: 'Confirm Deactivation',
        content: 'Are you sure you want to deactivate this entity?',
        id: e.id,
        action: 'deactivate',
      })
    }
  >
    <DeleteIcon />
  </IconButton>
</Tooltip>

                    </TableCell>
                  </TableRow>
                ))}
                {filteredEntities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No entities found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredEntities.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </TableContainer>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
      <ConfirmDialog
  open={confirmDialog.open}
  title={confirmDialog.title}
  content={confirmDialog.content}
  onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
  onConfirm={handleConfirm}
/>
    </div>
  );
}
