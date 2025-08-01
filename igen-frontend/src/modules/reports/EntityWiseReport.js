import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, TextField, MenuItem,
  Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Box
} from '@mui/material';
import API from '../../api/axios';

export default function EntityWiseReport() {
  const today = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    start_date: firstDay,
    end_date: today,
    entity_id: '',
    cost_centre_id: '',
    transaction_type_id: '',
    source: ''
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ total_credit: 0, total_debit: 0, net: 0 });

  const [entities, setEntities] = useState([]);
  const [costCentres, setCostCentres] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [e, c, t] = await Promise.all([
        API.get('entities/'),
        API.get('cost-centres/'),
        API.get('transaction-types/')
      ]);
      setEntities(e.data);
      setCostCentres(c.data);
      setTransactionTypes(t.data);
    } catch (error) {
      console.error('Failed to load master data', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await API.get('reports/entity-report/', {
        params: { ...filters, page_size: 1000 }
      });
      setData(res.data.results || res.data);

      const summaryRes = await API.get('reports/entity-report/summary/', {
        params: filters
      });
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      setData([]);
    }
    setLoading(false);
  };

  const handleExport = async () => {
    try {
      const response = await API.get('reports/entity-report/export/', {
        params: filters,
        responseType: 'blob'
      });

      if (response.status === 204) {
        alert('No data to export.');
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'entity_wise_report.csv');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Export failed', error);
      alert('Export failed');
    }
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0';
  };

  return (
    <div className="p-6">
      <Typography variant="h5" gutterBottom>Entity-Wise Ledger Report</Typography>

      <Card className="mb-4">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              fullWidth
            />
            <TextField
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Entity"
              value={filters.entity_id}
              onChange={(e) => setFilters({ ...filters, entity_id: e.target.value })}
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              {entities.map(e => (
                <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Cost Centre"
              value={filters.cost_centre_id}
              onChange={(e) => setFilters({ ...filters, cost_centre_id: e.target.value })}
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              {costCentres.map(c => (
                <MenuItem key={c.cost_centre_id} value={c.cost_centre_id}>{c.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Transaction Type"
              value={filters.transaction_type_id}
              onChange={(e) => setFilters({ ...filters, transaction_type_id: e.target.value })}
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              {transactionTypes.map(t => (
                <MenuItem key={t.transaction_type_id} value={t.transaction_type_id}>{t.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Source"
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="BANK">Bank</MenuItem>
              <MenuItem value="CASH">Cash</MenuItem>
            </TextField>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="contained" onClick={fetchReport}>Apply</Button>
            <Button variant="outlined" onClick={handleExport}>Export</Button>
          </div>
        </CardContent>
      </Card>

      <Box className="mb-4 px-4">
        <Typography variant="subtitle1">
          <strong>Total Credit:</strong> {formatCurrency(summary.total_credit)} &nbsp;&nbsp;
          <strong>Total Debit:</strong> {formatCurrency(summary.total_debit)} &nbsp;&nbsp;
          <strong>Net:</strong> {formatCurrency(summary.net)}
        </Typography>
      </Box>

      {loading ? (
        <Box className="flex justify-center py-8"><CircularProgress /></Box>
      ) : (
        <Card>
          <CardContent>
            {data.length === 0 ? (
              <Typography className="text-center py-4 text-gray-500">No records found for selected filters.</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>Cost Centre</TableCell>
                      <TableCell>Transaction Type</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Credit</TableCell>
                      <TableCell>Debit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.entity_name || row.entity?.name || '-'}</TableCell>
                        <TableCell>{row.cost_centre_name || row.cost_centre?.name || '-'}</TableCell>
                        <TableCell>{row.transaction_type_name || row.transaction_type?.name || '-'}</TableCell>
                        <TableCell>{row.source}</TableCell>
                        <TableCell>{row.amount > 0 ? formatCurrency(row.amount) : '-'}</TableCell>
                        <TableCell>{row.amount < 0 ? formatCurrency(Math.abs(row.amount)) : '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                      <TableCell colSpan={5}>Total</TableCell>
                      <TableCell>{formatCurrency(summary.total_credit)}</TableCell>
                      <TableCell>{formatCurrency(summary.total_debit)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
