import React from 'react';
import { Card } from './ui/card';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer 
} from 'recharts';

const BackupStats = ({ backups }) => {
  const stats = React.useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const backupsByDate = backups.reduce((acc, backup) => {
      const date = new Date(backup.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return last7Days.map(date => ({
      date,
      backups: backupsByDate[date] || 0
    }));
  }, [backups]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Statistiche Backup</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={stats}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="backups" fill="#4F46E5" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default BackupStats;