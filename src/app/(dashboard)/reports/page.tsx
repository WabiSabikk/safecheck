'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  ClipboardCheck,
} from 'lucide-react';
import { UpgradePrompt } from '@/components/billing/upgrade-prompt';
import { useAuth } from '@/lib/auth/context';
import type { SubscriptionTier } from '@/types/database';

interface ReportData {
  restaurant: { name: string; address: string; licenseNumber: string };
  dateRange: { start: string; end: string };
  stats: {
    checklistCompliance: number;
    totalChecklists: number;
    completedChecklists: number;
    tempCompliance: number;
    totalTempLogs: number;
    inRangeLogs: number;
    totalCorrectiveActions: number;
    resolvedActions: number;
  };
  checklists: { date: string; name: string; type: string; status: string; completedAt: string | null }[];
  temperatureLogs: { date: string; time: string; equipment: string; temperature: number; unit: string; inRange: boolean; minTemp: number; maxTemp: number }[];
  correctiveActions: { date: string; issueType: string; description: string; actionTaken: string; isResolved: boolean; resolvedAt: string | null }[];
  generatedAt: string;
}

export default function ReportsPage() {
  const { orgId, supabase } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');

  useEffect(() => {
    if (!orgId) return;
    const fetchTier = async () => {
      const { data: org } = await supabase.from('organizations').select('subscription_tier').eq('id', orgId).single();
      if (org) setTier(org.subscription_tier || 'free');
    };
    fetchTier();
  }, [orgId, supabase]);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/reports/pdf?start=${startDate}&end=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        toast.success('Report generated!');
      } else {
        toast.error('Failed to generate report');
      }
    } catch {
      toast.error('Failed to generate report');
    }
    setGenerating(false);
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;

    // Generate printable HTML and trigger browser print (saves as PDF)
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to download PDF');
      return;
    }

    const violations = reportData.temperatureLogs.filter(t => !t.inRange);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SafeCheck Compliance Report - ${reportData.restaurant.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; padding: 20px; }
          h1 { font-size: 20px; color: #059669; margin-bottom: 4px; }
          h2 { font-size: 14px; color: #374151; margin: 16px 0 8px; border-bottom: 2px solid #059669; padding-bottom: 4px; }
          h3 { font-size: 12px; color: #6b7280; margin: 12px 0 6px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 16px; }
          .header-left { }
          .header-right { text-align: right; font-size: 10px; color: #6b7280; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin: 12px 0; }
          .stat-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; }
          .stat-label { font-size: 10px; color: #6b7280; margin-top: 2px; }
          .green { color: #059669; }
          .red { color: #dc2626; }
          .amber { color: #d97706; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10px; }
          th { background: #f3f4f6; padding: 6px 8px; text-align: left; font-weight: 600; border: 1px solid #e5e7eb; }
          td { padding: 5px 8px; border: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #fafafa; }
          .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
          .badge-green { background: #d1fae5; color: #065f46; }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .badge-amber { background: #fef3c7; color: #92400e; }
          .badge-gray { background: #f3f4f6; color: #374151; }
          .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <h1>SafeCheck Compliance Report</h1>
            <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">${reportData.restaurant.name}</div>
            ${reportData.restaurant.address ? `<div style="color: #6b7280;">${reportData.restaurant.address}</div>` : ''}
            ${reportData.restaurant.licenseNumber ? `<div style="color: #6b7280;">License: ${reportData.restaurant.licenseNumber}</div>` : ''}
          </div>
          <div class="header-right">
            <div>Report Period:</div>
            <div style="font-weight: 600;">${reportData.dateRange.start} to ${reportData.dateRange.end}</div>
            <div style="margin-top: 4px;">Generated: ${new Date(reportData.generatedAt).toLocaleString()}</div>
          </div>
        </div>

        <h2>Compliance Summary</h2>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value ${reportData.stats.checklistCompliance >= 80 ? 'green' : 'red'}">${reportData.stats.checklistCompliance}%</div>
            <div class="stat-label">Checklist Compliance</div>
            <div style="font-size: 9px; color: #6b7280;">${reportData.stats.completedChecklists}/${reportData.stats.totalChecklists} completed</div>
          </div>
          <div class="stat-box">
            <div class="stat-value ${reportData.stats.tempCompliance >= 90 ? 'green' : 'red'}">${reportData.stats.tempCompliance}%</div>
            <div class="stat-label">Temperature Compliance</div>
            <div style="font-size: 9px; color: #6b7280;">${reportData.stats.inRangeLogs}/${reportData.stats.totalTempLogs} in range</div>
          </div>
          <div class="stat-box">
            <div class="stat-value ${violations.length === 0 ? 'green' : 'red'}">${violations.length}</div>
            <div class="stat-label">Temperature Violations</div>
          </div>
          <div class="stat-box">
            <div class="stat-value ${reportData.stats.resolvedActions === reportData.stats.totalCorrectiveActions ? 'green' : 'amber'}">${reportData.stats.resolvedActions}/${reportData.stats.totalCorrectiveActions}</div>
            <div class="stat-label">Actions Resolved</div>
          </div>
        </div>

        <h2>Checklist Completion Log</h2>
        ${reportData.checklists.length > 0 ? `
        <table>
          <thead>
            <tr><th>Date</th><th>Checklist</th><th>Type</th><th>Status</th><th>Completed At</th></tr>
          </thead>
          <tbody>
            ${reportData.checklists.map(c => `
              <tr>
                <td>${c.date}</td>
                <td>${c.name}</td>
                <td>${c.type}</td>
                <td><span class="badge ${c.status === 'completed' ? 'badge-green' : c.status === 'overdue' ? 'badge-red' : 'badge-gray'}">${c.status}</span></td>
                <td>${c.completedAt ? new Date(c.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<p style="color: #6b7280; font-style: italic;">No checklists recorded in this period.</p>'}

        <h2>Temperature Log</h2>
        ${reportData.temperatureLogs.length > 0 ? `
        <table>
          <thead>
            <tr><th>Date</th><th>Time</th><th>Equipment</th><th>Temp</th><th>Range</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${reportData.temperatureLogs.map(t => `
              <tr>
                <td>${t.date}</td>
                <td>${t.time}</td>
                <td>${t.equipment}</td>
                <td style="font-weight: 600; ${t.inRange ? 'color: #059669' : 'color: #dc2626'}">${t.temperature}°${t.unit}</td>
                <td>${t.minTemp}°${t.unit} - ${t.maxTemp}°${t.unit}</td>
                <td><span class="badge ${t.inRange ? 'badge-green' : 'badge-red'}">${t.inRange ? 'OK' : 'VIOLATION'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<p style="color: #6b7280; font-style: italic;">No temperature logs recorded in this period.</p>'}

        ${reportData.correctiveActions.length > 0 ? `
        <h2>Corrective Actions</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Issue</th><th>Description</th><th>Action Taken</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${reportData.correctiveActions.map(a => `
              <tr>
                <td>${a.date}</td>
                <td>${a.issueType.replace(/_/g, ' ')}</td>
                <td>${a.description}</td>
                <td>${a.actionTaken}</td>
                <td><span class="badge ${a.isResolved ? 'badge-green' : 'badge-amber'}">${a.isResolved ? 'Resolved' : 'Open'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="footer">
          <p>This report was generated by SafeCheck Food Safety Compliance System</p>
          <p>Report ID: ${Date.now().toString(36)} | Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const issueTypeLabels: Record<string, string> = {
    high_temp: 'High Temperature',
    low_temp: 'Low Temperature',
    equipment_malfunction: 'Equipment Issue',
    food_discarded: 'Food Discarded',
    other: 'Other',
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate inspector-ready compliance reports</p>
      </div>

      {/* Generate Report Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Compliance Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a complete report with all checklists, temperature logs, corrective actions,
            and compliance scores for the selected date range. Ready for health inspector review.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={generating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Generate Report
            </Button>
            {reportData && tier !== 'free' && (
              <Button onClick={handleDownloadPDF} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Print / Save as PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade prompt for PDF export */}
      {tier === 'free' && reportData && (
        <UpgradePrompt feature="PDF Export" requiredTier="starter" currentTier={tier} />
      )}

      {/* Report Preview */}
      {reportData && (
        <>
          {/* Compliance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compliance Summary</CardTitle>
              <p className="text-sm text-muted-foreground">
                {reportData.dateRange.start} to {reportData.dateRange.end}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-3 rounded-lg border">
                  <ClipboardCheck className="h-5 w-5 mx-auto text-emerald-600" />
                  <div className={`text-2xl font-bold mt-1 ${reportData.stats.checklistCompliance >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {reportData.stats.checklistCompliance}%
                  </div>
                  <div className="text-xs text-muted-foreground">Checklist Compliance</div>
                  <div className="text-xs text-muted-foreground">
                    {reportData.stats.completedChecklists}/{reportData.stats.totalChecklists}
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <Thermometer className="h-5 w-5 mx-auto text-blue-600" />
                  <div className={`text-2xl font-bold mt-1 ${reportData.stats.tempCompliance >= 90 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {reportData.stats.tempCompliance}%
                  </div>
                  <div className="text-xs text-muted-foreground">Temp Compliance</div>
                  <div className="text-xs text-muted-foreground">
                    {reportData.stats.inRangeLogs}/{reportData.stats.totalTempLogs}
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <AlertTriangle className="h-5 w-5 mx-auto text-amber-500" />
                  <div className="text-2xl font-bold mt-1">
                    {reportData.temperatureLogs.filter(t => !t.inRange).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Violations</div>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-600" />
                  <div className="text-2xl font-bold mt-1">
                    {reportData.stats.resolvedActions}/{reportData.stats.totalCorrectiveActions}
                  </div>
                  <div className="text-xs text-muted-foreground">Actions Resolved</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Violations */}
          {reportData.temperatureLogs.filter(t => !t.inRange).length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Temperature Violations ({reportData.temperatureLogs.filter(t => !t.inRange).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.temperatureLogs.filter(t => !t.inRange).map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded border border-red-100 bg-red-50 text-sm">
                      <div>
                        <span className="font-medium">{t.equipment}</span>
                        <span className="text-muted-foreground ml-2">{t.date} {t.time}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-red-600">{t.temperature}°{t.unit}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          (range: {t.minTemp}-{t.maxTemp}°{t.unit})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Corrective Actions Summary */}
          {reportData.correctiveActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Corrective Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.correctiveActions.map((a, i) => (
                    <div key={i} className="p-3 rounded border text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {issueTypeLabels[a.issueType] || a.issueType}
                          </Badge>
                          <Badge variant={a.isResolved ? 'default' : 'destructive'}>
                            {a.isResolved ? 'Resolved' : 'Open'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{a.date}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">{a.description}</p>
                      <p className="mt-1"><span className="font-medium">Action:</span> {a.actionTaken}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
