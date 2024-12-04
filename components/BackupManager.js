import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { Toaster } from './ui/toaster';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableCell } from './ui/table';
import { 
  Download, 
  RefreshCcw, 
  Archive, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import { DatePicker } from './ui/date-picker';
import { formatDate, formatBytes } from '../utils/format';
import { BackupStats } from './BackupStats';

const BackupManager = () => {
  // Stati
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [showStats, setShowStats] = useState(false);

  // Caricamento iniziale e polling
  useEffect(() => {
    loadBackups();
    const interval = setInterval(loadBackups, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Funzioni CRUD
  async function loadBackups() {
    try {
      setLoading(true);
      const response = await fetch('/api/backup', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Errore nel caricamento dei backup');
    } finally {
      setLoading(false);
    }
  }

  async function createBackup() {
    try {
      setLoading(true);
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tipo: 'manuale' })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadBackups();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message || 'Errore nella creazione del backup');
    } finally {
      setLoading(false);
    }
  }

  async function restoreBackup() {
    if (!selectedBackup) return;
    
    try {
      setRestoreLoading(true);
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: selectedBackup.filename })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowRestoreDialog(false);
        await loadBackups();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message || 'Errore nel ripristino del backup');
    } finally {
      setRestoreLoading(false);
    }
  }

  async function downloadBackup(filename) {
    try {
      const response = await fetch(`/api/backup/download/${filename}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Errore nel download');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Errore nel download del backup');
    }
  }

  // Funzioni di utilità
  const filteredBackups = React.useMemo(() => {
    return backups
      .filter(backup => {
        // Filtro per ricerca
        if (searchTerm && !backup.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Filtro per tipo
        if (filterType !== 'all') {
          const isAuto = backup.filename.includes('auto');
          if (filterType === 'auto' && !isAuto) return false;
          if (filterType === 'manual' && isAuto) return false;
        }
        
        // Filtro per data
        if (dateRange.start && new Date(backup.createdAt) < dateRange.start) {
          return false;
        }
        if (dateRange.end && new Date(backup.createdAt) > dateRange.end) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
        if (sortConfig.key === 'createdAt') {
          return multiplier * (new Date(a.createdAt) - new Date(b.createdAt));
        }
        if (sortConfig.key === 'size') {
          return multiplier * (a.size - b.size);
        }
        return multiplier * a[sortConfig.key].localeCompare(b[sortConfig.key]);
      });
  }, [backups, searchTerm, filterType, dateRange, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Rendering
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Gestione Backup</h2>
            <p className="text-gray-500">Gestisci i backup del sistema</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? 'Nascondi Statistiche' : 'Mostra Statistiche'}
            </Button>
            <Button
              variant="outline"
              onClick={loadBackups}
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
            <Button
              onClick={createBackup}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Crea Backup
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showStats && <BackupStats backups={backups} className="mb-6" />}

        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Cerca</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Cerca backup..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="w-[200px]">
              <Label htmlFor="filter">Tipo</Label>
              <select
                id="filter"
                className="w-full p-2 border rounded"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Tutti i backup</option>
                <option value="manual">Backup manuali</option>
                <option value="auto">Backup automatici</option>
              </select>
            </div>

            <div className="w-[200px]">
              <Label>Data Inizio</Label>
              <DatePicker
                date={dateRange.start}
                onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
              />
            </div>

            <div className="w-[200px]">
              <Label>Data Fine</Label>
              <DatePicker
                date={dateRange.end}
                onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
              />
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => handleSort('filename')}
                  >
                    Nome File
                    {sortConfig.key === 'filename' && (
                      <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Data Creazione
                    {sortConfig.key === 'createdAt' && (
                      <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('size')}
                  >
                    Dimensione
                    {sortConfig.key === 'size' && (
                      <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBackups.map(backup => (
                  <TableRow key={backup.filename}>
                    <TableCell className="font-mono text-sm">
                      {backup.filename}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        backup.filename.includes('auto')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {backup.filename.includes('auto') ? 'Automatico' : 'Manuale'}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(backup.createdAt)}</TableCell>
                    <TableCell>{formatBytes(backup.size)}</TableCell>
                    <TableCell>
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Completato
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadBackup(backup.filename)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowRestoreDialog(true);
                          }}
                        >
                          Ripristina
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBackups.length === 0 && (
                  <TableRow>
                    <TableCell 
                      colSpan={6} 
                      className="text-center py-8 text-gray-500"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Caricamento backup...
                        </div>
                      ) : (
                        'Nessun backup trovato'
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      <Dialog 
        open={showRestoreDialog} 
        onOpenChange={setShowRestoreDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Ripristino</DialogTitle>
            <DialogDescription>
              Questa operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Il ripristino sovrascriverà i dati attuali. 
                Assicurati di avere un backup recente prima di procedere.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <Label>Backup selezionato</Label>
                <p className="font-mono text-sm">{selectedBackup?.filename}</p>
              </div>
              
              <div>
                <Label>Data creazione</Label>
                <p>{selectedBackup && formatDate(selectedBackup.createdAt)}</p>
              </div>
              
              <div>
                <Label>Dimensione</Label>
                <p>{selectedBackup && formatBytes(selectedBackup.size)}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRestoreDialog(false)}
              disabled={restoreLoading}
            >
              Annulla
            </Button>
            <Button 
              variant="destructive"
              onClick={restoreBackup}
              disabled={restoreLoading}
            >
              {restoreLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ripristino in corso...
                </>
              ) : (
                'Conferma Ripristino'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackupManager;