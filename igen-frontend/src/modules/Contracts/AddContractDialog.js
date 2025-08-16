import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, FormControl, InputLabel, Select, Stack, Typography,
  Snackbar, Alert
} from '@mui/material';
import API from '../../api/axios';
import FileUploader from '../../components/FileUploader';

const AddContractDialog = ({ open, handleClose, onContractAdded }) => {
  const [formData, setFormData] = useState({
    vendor: '',
    cost_centre: '',
    entity: '',
    company: '',
    description: '',
    contract_date: '',
    start_date: '',
    end_date: '',
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  const [vendors, setVendors] = useState([]);
  const [costCentres, setCostCentres] = useState([]);
  const [entities, setEntities] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const userRole = localStorage.getItem('role');
  const userCompanyId = localStorage.getItem('company_id');

  useEffect(() => {
    API.get('vendors/')
      .then(res => setVendors(res.data))
      .catch(err => console.error("Error fetching vendors:", err));

    API.get('cost-centres/')
      .then(res => setCostCentres(res.data))
      .catch(err => console.error("Error fetching cost centres:", err));

    API.get('entities/')
      .then(res => setEntities(res.data))
      .catch(err => console.error("Error fetching entities:", err));

    if (userRole === 'SUPER_USER') {
      API.get('companies/')
        .then(res => setCompanies(res.data))
        .catch(err => console.error("Error fetching companies:", err));
    }
  }, [userRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      vendor: '',
      cost_centre: '',
      entity: '',
      company: '',
      description: '',
      contract_date: '',
      start_date: '',
      end_date: '',
    });
    setSelectedFiles([]);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleSubmit = () => {
    const requiredFields = ['vendor', 'cost_centre', 'entity', 'contract_date', 'start_date', 'end_date'];
    for (let field of requiredFields) {
      if (!formData[field]) {
        showSnackbar(`Please provide a valid ${field.replace('_', ' ')}.`, 'error');
        return;
      }
    }

    const companyId = userRole === 'SUPER_USER' ? formData.company : userCompanyId;
    if (!companyId) {
      showSnackbar('Company information is missing.', 'error');
      return;
    }

    const payload = new FormData();
    payload.append('vendor', formData.vendor);
    payload.append('cost_centre', formData.cost_centre);
    payload.append('entity', formData.entity);
    payload.append('description', formData.description || '');
    payload.append('contract_date', formData.contract_date);
    payload.append('start_date', formData.start_date);
    payload.append('end_date', formData.end_date);
    payload.append('company', companyId);

    selectedFiles.forEach((file) => {
      payload.append('document', file);
    });

    API.post('contracts/', payload)
      .then(() => {
        onContractAdded();
        resetForm();
        handleClose();
        showSnackbar('Contract saved successfully!', 'success');
      })
      .catch(err => {
        console.error('Error:', err);
        const error = err.response?.data;
        if (error) {
          showSnackbar(`Error: ${JSON.stringify(error, null, 2)}`, 'error');
        } else {
          showSnackbar('Unexpected error occurred.', 'error');
        }
      });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => { resetForm(); handleClose(); }}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
      >
        <DialogTitle sx={{ fontSize: '1.5rem', pb: 1 }}>
          Create New Contract
        </DialogTitle>

        <DialogContent style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <Typography
            variant="subtitle1"
            sx={{ mb: 1, color: 'primary.main', fontSize: 16 }}
          >
            Contract Details
          </Typography>

          <Stack spacing={2}>
            {userRole === 'SUPER_USER' && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth required>
                  <InputLabel>Company</InputLabel>
                  <Select
                    name="company"
                    value={formData.company}
                    onChange={(e) => handleDropdownChange('company', e.target.value)}
                  >
                    {companies.map((comp) => (
                      <MenuItem key={comp.id} value={comp.id}>
                        {comp.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  placeholder="Enter contract description (optional)"
                />
              </Stack>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Vendor</InputLabel>
                <Select
                  name="vendor"
                  value={formData.vendor}
                  onChange={(e) => handleDropdownChange('vendor', e.target.value)}
                >
                  {vendors.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.vendor_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Cost Centre</InputLabel>
                <Select
                  name="cost_centre"
                  value={formData.cost_centre}
                  onChange={(e) => handleDropdownChange('cost_centre', e.target.value)}
                >
                  {costCentres.map((cc) => (
                    <MenuItem key={cc.cost_centre_id} value={cc.cost_centre_id}>
                      {cc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <FormControl fullWidth required>
              <InputLabel>Entity</InputLabel>
              <Select
                name="entity"
                value={formData.entity}
                onChange={(e) => handleDropdownChange('entity', e.target.value)}
              >
                {entities.map((en) => (
                  <MenuItem key={en.id} value={en.id}>
                    {en.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                type="date"
                label="Contract Date"
                name="contract_date"
                value={formData.contract_date}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                type="date"
                label="Start Date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                type="date"
                label="End Date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Stack>

            <FileUploader
              mode="add"
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              onFilesChange={(files) => setSelectedFiles(files)}
              uploading={false}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { resetForm(); handleClose(); }} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            Save Contract
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddContractDialog;
