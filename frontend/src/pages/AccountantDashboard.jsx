import React, { useEffect, useState } from 'react';
import { DollarSign, FileText, CreditCard, Eye, TrendingUp, History } from 'lucide-react';
import NavBar from '../components/NavBar';
import StatCard from '../components/StatCard';
import styles from '../styles/Dashboard.module.css';
import tableStyles from '../styles/Table.module.css';
import badgeStyles from '../styles/Badge.module.css';
import invoiceService from '../services/invoiceService';
import TransactionsTab from '../components/accountant/TransactionsTab';
import ReportsTab from '../components/manager/ReportsTab';
import InvoiceDetailModal from '../components/accountant/InvoiceDetailModal';
import { asArray } from '../utils/apiNormalize';

const AccountantDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getAllInvoices();
      setInvoices(asArray(data, 'invoices'));
    } catch (err) {
      console.error('Failed to load invoices', err);
      alert('Could not load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoices(); }, []);

  const isPaid = (inv) => (inv.paymentStatus || '').toLowerCase() === 'paid';
  const totalToday = invoices.reduce((sum, inv) => {
    if (!isPaid(inv)) return sum;
    const d = new Date(inv.updatedAt || inv.issueDate || inv.createdAt);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return sum + (inv.totalAmount || 0);
    return sum;
  }, 0);
  const totalMonth = invoices
    .filter(isPaid)
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const unpaidCount = invoices.filter(
    inv => (inv.paymentStatus || '').toLowerCase() === 'pending'
  ).length;

  return (
    <div className={styles.container}>
      <NavBar title="Accounting" icon={DollarSign} onLogout={onLogout} />
      <div className={styles.content}>
        {/* Tabs */}
        <div className={styles.tabNav}>
          {[
            { id: 'invoices', label: 'Invoices', icon: FileText },
            { id: 'transactions', label: 'Transactions', icon: History },
            { id: 'reports', label: 'Reports', icon: TrendingUp },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              >
                <Icon size={18} className={styles.tabIcon} />
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'invoices' && (
            <>
              <div className={`${styles.grid} ${styles.grid3} ${styles.mbLg}`}>
                <StatCard title="Revenue today" value={`₫${totalToday.toLocaleString('en-US')}`} icon={DollarSign} />
                <StatCard title="Revenue (total)" value={`₫${totalMonth.toLocaleString('en-US')}`} icon={FileText} />
                <StatCard title="Unpaid invoices" value={String(unpaidCount)} icon={CreditCard} />
              </div>

              <div className={styles.mtXl}>
                <h2 className={styles.sectionTitle}>Recent invoices</h2>
                <div className={tableStyles.tableContainer}>
                  <table className={tableStyles.table}>
                    <thead>
                      <tr>
                        <th className={tableStyles.th}>Invoice #</th>
                        <th className={tableStyles.th}>Guest</th>
                        <th className={tableStyles.th}>Issue date</th>
                        <th className={tableStyles.th}>Amount</th>
                        <th className={tableStyles.th}>Status</th>
                        <th className={tableStyles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td className={tableStyles.td} colSpan={6}>Loading...</td></tr>
                      ) : invoices.length === 0 ? (
                        <tr><td className={tableStyles.td} colSpan={6}>No invoices</td></tr>
                      ) : (
                        invoices.slice(0, 20).map(inv => (
                          <tr key={inv._id}>
                            <td className={tableStyles.td}>#{inv._id?.slice(-6)}</td>
                            <td className={tableStyles.td}>{inv.booking?.guest?.fullName || inv.booking?.guest?.name || 'Guest'}</td>
                            <td className={tableStyles.td}>{new Date(inv.issueDate || inv.createdAt).toLocaleDateString('en-US')}</td>
                            <td className={tableStyles.td}>₫{Number(inv.totalAmount || 0).toLocaleString('en-US')}</td>
                            <td className={tableStyles.td}>
                              <span className={`${badgeStyles.badge} ${(inv.paymentStatus || '').toLowerCase() === 'paid' ? badgeStyles.success : ''}`}>{inv.paymentStatus || 'pending'}</span>
                            </td>
                            <td className={tableStyles.td}>
                              <button 
                                className={tableStyles.actionBtn}
                                onClick={() => {
                                  setSelectedInvoiceId(inv._id);
                                  setShowInvoiceModal(true);
                                }}
                                title="View details"
                              >
                                <Eye size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'transactions' && (
            <TransactionsTab />
          )}

          {activeTab === 'reports' && (
            <ReportsTab />
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoiceId && (
        <InvoiceDetailModal
          invoiceId={selectedInvoiceId}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedInvoiceId(null);
          }}
        />
      )}
    </div>
  );
};

export default AccountantDashboard;