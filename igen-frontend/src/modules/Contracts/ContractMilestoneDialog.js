import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
  Select, FormControl, InputLabel
} from '@mui/material';
import { format } from 'date-fns';
import API from '../../api/axios';

const STATUS_OPTIONS = ['Pending', 'Completed', 'Paid', 'Cancelled'];

const ContractMilestoneDialog = ({ open, handleClose, contract }) => {
  const [milestones, setMilestones] = useState([]);
  const [formData, setFormData] = useState({
    milestone_name: '',
    due_date: '',
    amount: '',
    status: 'Pending',
    remarks: '',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (contract?.id && open) {
      API.get(`contract-milestones/?contract=${contract.id}`)
        .then(res => setMilestones(res.data))
        .catch(err => console.error('Error fetching milestones:', err));
    }
  }, [contract, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      milestone_name: '',
      due_date: '',
      amount: '',
      status: 'Pending',
      remarks: '',
    });
    setEditingId(null);
  };

  const fetchMilestones = () => {
    if (!contract?.id) return;
    API.get(`contract-milestones/?contract=${contract.id}`)
      .then(res => setMilestones(res.data))
      .catch(err => console.error('Milestone reload failed:', err));
  };

  const handleSave = () => {
    if (!formData.milestone_name || !formData.due_date || !formData.amount) {
      alert("Please fill all required fields: name, due date, and amount.");
      return;
    }

    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      alert("Please enter a valid numeric amount.");
      return;
    }

    if (formData.status === "Paid" && parsedAmount <= 0) {
      alert("Milestone must have a positive amount before marking as Paid.");
      return;
    }

    const payload = {
      ...formData,
      contract: contract.id,
      amount: parsedAmount,
    };

    const request = editingId
      ? API.patch(`contract-milestones/${editingId}/`, payload)
      : API.post('contract-milestones/', payload);

    request
      .then(() => {
        fetchMilestones();
        resetForm();
      })
      .catch(err => {
        console.error('Error saving milestone:', err);
        alert('Failed to save milestone.');
      });
  };

  const handleEdit = (milestone) => {
    setFormData({
      milestone_name: milestone.milestone_name,
      due_date: milestone.due_date,
      amount: milestone.amount,
      status: milestone.status,
      remarks: milestone.remarks || ''
    });
    setEditingId(milestone.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      API.delete(`contract-milestones/${id}/`)
        .then(() => {
          setMilestones(prev => prev.filter(m => m.id !== id));
          if (editingId === id) resetForm();
        })
        .catch(err => {
          console.error('Delete failed:', err);
          alert('Failed to delete milestone.');
        });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        Manage Milestones for {contract?.vendor_name || contract?.vendor?.vendor_name || 'Contract'}
      </DialogTitle>
      <DialogContent dividers>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {milestones.length > 0 ? milestones.map(m => (
              <TableRow key={m.id}>
                <TableCell>{m.milestone_name}</TableCell>
                <TableCell>{m.due_date ? format(new Date(m.due_date), 'dd/MM/yyyy') : '—'}</TableCell>
                <TableCell>{m.amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                <TableCell>{m.status}</TableCell>
                <TableCell>{m.remarks || '—'}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleEdit(m)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(m.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} align="center">No milestones found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-4">
          <TextField
            label="Milestone Name"
            name="milestone_name"
            value={formData.milestone_name}
            onChange={handleChange}
            fullWidth
            margin="dense"
            required
          />
          <TextField
            type="date"
            label="Due Date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            fullWidth
            margin="dense"
            required
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {STATUS_OPTIONS.map(status => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            fullWidth
            margin="dense"
            multiline
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          resetForm();
          handleClose();
        }}>Close</Button>
        <Button variant="contained" onClick={handleSave}>
          {editingId ? 'Update' : 'Add'} Milestone
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractMilestoneDialog;
