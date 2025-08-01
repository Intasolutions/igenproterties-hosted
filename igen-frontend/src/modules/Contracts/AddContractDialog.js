import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import API from '../../api/axios';

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
    document: null,
  });

  const [vendors, setVendors] = useState([]);
  const [costCentres, setCostCentres] = useState([]);
  const [entities, setEntities] = useState([]);
  const [companies, setCompanies] = useState([]);

  const userRole = localStorage.getItem('role');
  const userCompanyId = localStorage.getItem('company_id');

  useEffect(() => {
    API.get('vendors/').then(res => setVendors(res.data));
    API.get('cost-centres/').then(res => setCostCentres(res.data));
    API.get('entities/').then(res => setEntities(res.data));
    if (userRole === 'SUPER_USER') {
      API.get('companies/').then(res => setCompanies(res.data));
    }
  }, [userRole]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
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
      document: null,
    });
  };

  const handleSubmit = () => {
    const requiredFields = ['vendor', 'cost_centre', 'entity', 'contract_date', 'start_date', 'end_date'];
    for (let field of requiredFields) {
      if (!formData[field]) {
        alert(`Please provide a valid ${field.replace('_', ' ')}.`);
        return;
      }
    }

    const payload = new FormData();
    payload.append('vendor', formData.vendor);
    payload.append('cost_centre', formData.cost_centre);
    payload.append('entity', formData.entity);
    payload.append('description', formData.description || '');
    payload.append('contract_date', formData.contract_date);
    payload.append('start_date', formData.start_date);
    payload.append('end_date', formData.end_date);

    if (formData.document) {
      payload.append('document', formData.document);
    }

    const companyId = userRole === 'SUPER_USER' ? formData.company : userCompanyId;

    if (!companyId) {
      alert('Company information is missing.');
      return;
    }

    payload.append('company', companyId);

    API.post('contracts/', payload)
      .then(() => {
        onContractAdded();
        resetForm();
        handleClose();
      })
      .catch(err => {
        console.error('Error:', err);
        const error = err.response?.data;
        if (error) {
          alert("Error: " + JSON.stringify(error, null, 2));
        } else {
          alert('Unexpected error occurred.');
        }
      });
  };

  return (
    <Dialog open={open} onClose={() => { resetForm(); handleClose(); }} fullWidth maxWidth="sm">
      <DialogTitle>Create New Contract</DialogTitle>
      <DialogContent dividers>

        {userRole === 'SUPER_USER' && (
          <FormControl fullWidth margin="dense">
            <InputLabel id="company-label">Company</InputLabel>
            <Select
              labelId="company-label"
              value={formData.company}
              onChange={(e) => handleDropdownChange('company', e.target.value)}
              required
            >
              <MenuItem value="">Select Company</MenuItem>
              {companies.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl fullWidth margin="dense">
          <InputLabel id="vendor-label">Vendor</InputLabel>
          <Select
            labelId="vendor-label"
            value={formData.vendor}
            onChange={(e) => handleDropdownChange('vendor', e.target.value)}
            required
          >
            <MenuItem value="">Select Vendor</MenuItem>
            {vendors.map(v => (
              <MenuItem key={v.id} value={v.id}>{v.vendor_name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel id="cost-centre-label">Cost Centre</InputLabel>
          <Select
            labelId="cost-centre-label"
            value={formData.cost_centre}
            onChange={(e) => handleDropdownChange('cost_centre', e.target.value)}
            required
          >
            <MenuItem value="">Select Cost Centre</MenuItem>
            {costCentres.map(c => (
              <MenuItem key={c.cost_centre_id} value={c.cost_centre_id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel id="entity-label">Entity</InputLabel>
          <Select
            labelId="entity-label"
            value={formData.entity}
            onChange={(e) => handleDropdownChange('entity', e.target.value)}
            required
          >
            <MenuItem value="">Select Entity</MenuItem>
            {entities.map(e => (
              <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          fullWidth
          margin="dense"
          multiline
        />

        <TextField
          type="date"
          label="Contract Date"
          name="contract_date"
          value={formData.contract_date}
          onChange={handleChange}
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          type="date"
          label="Start Date"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          type="date"
          label="End Date"
          name="end_date"
          value={formData.end_date}
          onChange={handleChange}
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          type="file"
          name="document"
          onChange={handleChange}
          fullWidth
          margin="dense"
          inputProps={{ accept: ".pdf,.jpg,.jpeg,.png" }}
        />

      </DialogContent>
      <DialogActions>
        <Button onClick={() => { resetForm(); handleClose(); }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>Save Contract</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddContractDialog;
