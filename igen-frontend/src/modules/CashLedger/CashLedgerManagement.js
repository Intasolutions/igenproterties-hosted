import React, { useEffect, useState } from 'react';

import API from '../../api/axios';
import {
  Typography, Button, Card, CardContent, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert, FormControlLabel, Checkbox, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip,
  TablePagination
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';


export default function CashLedgerManagement() {
    const [filters, setFilters] = useState({
    cost_centre: '',
    entity: '',
    transaction_type: '',
    spent_by: '',
    chargeable: '',
    search: '',
    ordering: '',
  })
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [costCentres, setCostCentres] = useState([]);
  const [entities, setEntities] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [balance, setBalance] = useState(0);

  const defaultForm = {
    date: '',
    company: '',
    spent_by: '',
    cost_centre: '',
    entity: '',
    transaction_type: '',
    amount: '',
    chargeable: false,
    margin: '',
    balance_amount: '',
    remarks: '',
    document: null
  };

  const [form, setForm] = useState(defaultForm);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchMasterData();
    fetchEntries();
    fetchBalance();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [u, cc, e, t, c] = await Promise.all([
        API.get('users/'),
        API.get('cost-centres/'),
        API.get('entities/'),
        API.get('transaction-types/?direction=DEBIT&status=Active'),
        API.get('companies/')
      ]);
      setUsers(u.data);
      setCostCentres(cc.data);
      setEntities(e.data);
      setTransactionTypes(t.data);
      setCompanies(c.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to fetch master data', severity: 'error' });
    }
  };

  const fetchEntries = async () => {
    try {
      const res = await API.get('cash-ledger/', { params: filters });

      setEntries(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to fetch entries', severity: 'error' });
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await API.get('cash-ledger/balance/');
      setBalance(res.data.current_balance);
    } catch {
      setBalance(0);
    }
  };

  const handleSubmit = async () => {
    if (!form.date || !form.spent_by || !form.cost_centre || !form.entity || !form.transaction_type || !form.amount || !form.company) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'warning' });
      return;
    }
    if (form.chargeable && !form.margin) {
      setSnackbar({ open: true, message: 'Margin is required when chargeable is selected', severity: 'warning' });
      return;
    }

    const payload = new FormData();
    payload.append('date', form.date);
    payload.append('company', parseInt(form.company));
    payload.append('spent_by', parseInt(form.spent_by));
    payload.append('cost_centre', parseInt(form.cost_centre));
    payload.append('entity', parseInt(form.entity));
    payload.append('transaction_type', parseInt(form.transaction_type));
    payload.append('amount', form.amount);
    payload.append('chargeable', form.chargeable);
    if (form.chargeable && form.margin) payload.append('margin', form.margin);
    payload.append('balance_amount', form.balance_amount);
    if (form.remarks) payload.append('remarks', form.remarks);
    if (form.document) payload.append('document', form.document);

    try {
      await API.post('cash-ledger/', payload);
      setSnackbar({ open: true, message: 'Entry added successfully', severity: 'success' });
      setForm(defaultForm);
      setOpen(false);
      fetchEntries();
      fetchBalance();
    } catch {
      setSnackbar({ open: true, message: 'Failed to add entry', severity: 'error' });
    }
  };

  const deactivateEntry = async (id) => {
    try {
      await API.post(`cash-ledger/${id}/deactivate/`);
      setSnackbar({ open: true, message: 'Entry deactivated', severity: 'info' });
      fetchEntries();
      fetchBalance();
    } catch {
      setSnackbar({ open: true, message: 'Failed to deactivate', severity: 'error' });
    }
  };

  const paginated = rowsPerPage > 0 ? entries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : entries;

  return (
    <div className="p-[35px]">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h5" fontWeight="bold">Cash Ledger Register</Typography>
        <div>
          <Typography variant="subtitle1" className="mb-2">Current Balance: ₹ {parseFloat(balance).toLocaleString('en-IN')}</Typography>
          <Button variant="contained" color="primary" onClick={() => setOpen(true)}>Add Entry</Button>
        </div>
      </div>
<Card className="mb-4">
  <CardContent>
    <Typography variant="subtitle1" gutterBottom>Filter Entries</Typography>
<TextField
  select label="Sort By"
  value={filters.ordering}
  onChange={(e) => setFilters({ ...filters, ordering: e.target.value })}
  size="small" fullWidth
>
  <MenuItem value="">Default</MenuItem>
  <MenuItem value="date">Date Asc</MenuItem>
  <MenuItem value="-date">Date Desc</MenuItem>
  <MenuItem value="amount">Amount Asc</MenuItem>
  <MenuItem value="-amount">Amount Desc</MenuItem>
</TextField>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <TextField
        select label="Cost Centre" value={filters.cost_centre}
        onChange={(e) => setFilters({ ...filters, cost_centre: e.target.value })}
        fullWidth size="small"
      >
        <MenuItem value="">All</MenuItem>
        {costCentres.map(c => (
          <MenuItem key={c.cost_centre_id} value={c.cost_centre_id}>{c.name}</MenuItem>
        ))}
      </TextField>

      <TextField
        select label="Entity" value={filters.entity}
        onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
        fullWidth size="small"
      >
        <MenuItem value="">All</MenuItem>
        {entities.map(e => (
          <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>
        ))}
      </TextField>

      <TextField
        select label="Transaction Type" value={filters.transaction_type}
        onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
        fullWidth size="small"
      >
        <MenuItem value="">All</MenuItem>
        {transactionTypes.map(t => (
          <MenuItem key={t.transaction_type_id} value={t.transaction_type_id}>{t.name}</MenuItem>
        ))}
      </TextField>

      <TextField
        select label="Spent By" value={filters.spent_by}
        onChange={(e) => setFilters({ ...filters, spent_by: e.target.value })}
        fullWidth size="small"
      >
        <MenuItem value="">All</MenuItem>
        {users.map(u => (
          <MenuItem key={u.id} value={u.id}>{u.full_name}</MenuItem>
        ))}
      </TextField>

      <TextField
        select label="Chargeable" value={filters.chargeable}
        onChange={(e) => setFilters({ ...filters, chargeable: e.target.value })}
        fullWidth size="small"
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="true">Yes</MenuItem>
        <MenuItem value="false">No</MenuItem>
      </TextField>

      <TextField
        label="Search Remarks"
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        fullWidth size="small"
      />
    </div>

    <div className="flex justify-end mt-4">
      <Button variant="contained" onClick={fetchEntries}>Apply Filters</Button>
      <Button variant="text" onClick={() => {
        setFilters({ cost_centre: '', entity: '', transaction_type: '', spent_by: '', chargeable: '', search: '' });
        fetchEntries();
      }}>Clear</Button>
    </div>
  </CardContent>
</Card>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Spent By</TableCell>
                  <TableCell>Cost Centre</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Chargeable</TableCell>
                  <TableCell>Margin</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell align="center">Document / Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((e, index) => (
                  <TableRow key={e.id}>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{e.date}</TableCell>
                    <TableCell>{e.spent_by_name}</TableCell>
                    <TableCell>{e.cost_centre_name}</TableCell>
                    <TableCell>{e.entity_name}</TableCell>
                    <TableCell>{e.transaction_type_name}</TableCell>
                    <TableCell>₹ {parseFloat(e.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{e.chargeable ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{e.margin ?? '-'}</TableCell>
                    <TableCell>₹ {parseFloat(e.balance_amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="center">
                      {e.document_url ? (
                        <a href={e.document_url} target="_blank" rel="noopener noreferrer">View</a>
                      ) : '—'}
                      <Tooltip title="Deactivate Entry">
                        <IconButton color="error" onClick={() => deactivateEntry(e.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={entries.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Cash Ledger Entry</DialogTitle>
        <DialogContent>
          <TextField type="date" label="Date" InputLabelProps={{ shrink: true }} fullWidth margin="dense" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />

          <TextField select label="Company" value={form.company ?? ''} onChange={(e) => setForm({ ...form, company: parseInt(e.target.value) })} fullWidth margin="dense">
            {companies.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>

          <TextField select label="Spent By" value={form.spent_by ?? ''} onChange={(e) => setForm({ ...form, spent_by: parseInt(e.target.value) })} fullWidth margin="dense">
            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.full_name}</MenuItem>)}
          </TextField>

          <TextField select label="Cost Centre" value={form.cost_centre ?? ''} onChange={(e) => setForm({ ...form, cost_centre: parseInt(e.target.value) })} fullWidth margin="dense">
            {costCentres.map(cc => (
              <MenuItem key={cc.cost_centre_id} value={cc.cost_centre_id}>{cc.name}</MenuItem>
            ))}
          </TextField>

          <TextField select label="Entity" value={form.entity ?? ''} onChange={(e) => setForm({ ...form, entity: parseInt(e.target.value) })} fullWidth margin="dense">
            {entities.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
          </TextField>

          <TextField select label="Transaction Type" value={form.transaction_type ?? ''} onChange={(e) => setForm({ ...form, transaction_type: parseInt(e.target.value) })} fullWidth margin="dense">
            {transactionTypes.map(t => (
              <MenuItem key={t.transaction_type_id} value={t.transaction_type_id}>
                {t.name} ({t.direction}) - {t.company_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField type="number" label="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} fullWidth margin="dense" />
          <FormControlLabel control={<Checkbox checked={form.chargeable} onChange={(e) => setForm({ ...form, chargeable: e.target.checked })} />} label="Chargeable" />
          {form.chargeable && (
            <TextField type="number" label="Margin" value={form.margin} onChange={(e) => setForm({ ...form, margin: e.target.value })} fullWidth margin="dense" />
          )}
          <TextField type="number" label="Balance Amount" value={form.balance_amount} onChange={(e) => setForm({ ...form, balance_amount: e.target.value })} fullWidth margin="dense" />
          <TextField label="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} fullWidth margin="dense" />
          <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ mt: 2 }}>
            Upload Document
            <input type="file" hidden onChange={(e) => setForm({ ...form, document: e.target.files[0] })} />
          </Button>
          {form.document && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected File: <strong>{form.document.name}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Add</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}
