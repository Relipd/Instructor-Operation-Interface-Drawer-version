import React, { useState, useMemo } from 'react';
import { Button, Tag, Popconfirm, Empty, Select, Pagination } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import './TaskList.scss';

export interface TaskRecord {
  recordId: string;
  platform: string;
  exceptionType: string;
  exceptionDetail: string;
  riskLevel: string;
  status: string;
  handler: string;
  department: string;
  reviewTime: string;
  reviewRecordCode: string;
  // 权限中心
  permAccountName: string;
  permStoreName: string;
  permWorkOrderId: string;
  permApplicant: string;
  permApplicantEmail: string;
  permApplicantPhone: string;
  permUserNickname: string;
  permUserRoleList: string;
  // 外部系统
  extStoreName: string;
  extUserPhone: string;
  extAccountName: string;
  extUserName: string;
  extUserRoleList: string;
}

interface FieldPair {
  label: string;
  value: string;
}

interface Props {
  records: TaskRecord[];
  statusFilter: 'all' | 'pending' | 'pending_feedback';
  onStatusFilterChange: (f: 'all' | 'pending' | 'pending_feedback') => void;
  onCheck: (recordId: string) => void;
  onFeedback: (recordId: string) => void;
}

const PAGE_SIZE = 6; // 2列 x 3行

const riskColors: Record<string, 'red' | 'orange' | 'green' | 'grey'> = {
  R3: 'red',
  R2: 'orange',
  R1: 'green',
};

function FieldRow({ label, value }: FieldPair) {
  if (!value) return null;
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <span className="field-value">{value}</span>
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section-block">
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}

function buildPermFields(r: TaskRecord, t: (key: string) => string): FieldPair[] {
  return [
    { label: t('field.permAccountName'), value: r.permAccountName },
    { label: t('field.permStoreName'), value: r.permStoreName },
    { label: t('field.permWorkOrderId'), value: r.permWorkOrderId },
    { label: t('field.permApplicant'), value: r.permApplicant },
    { label: t('field.permApplicantEmail'), value: r.permApplicantEmail },
    { label: t('field.permApplicantPhone'), value: r.permApplicantPhone },
    { label: t('field.permUserNickname'), value: r.permUserNickname },
    { label: t('field.permUserRoleList'), value: r.permUserRoleList },
  ];
}

function buildExtFields(r: TaskRecord, t: (key: string) => string): FieldPair[] {
  return [
    { label: t('field.extStoreName'), value: r.extStoreName },
    { label: t('field.extUserPhone'), value: r.extUserPhone },
    { label: t('field.extAccountName'), value: r.extAccountName },
    { label: t('field.extUserName'), value: r.extUserName },
    { label: t('field.extUserRoleList'), value: r.extUserRoleList },
  ];
}

export default function TaskList({ records, statusFilter, onStatusFilterChange, onCheck, onFeedback }: Props) {
  const { t } = useTranslation();
  const [selectedRecord, setSelectedRecord] = useState<TaskRecord | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exceptionTypeFilter, setExceptionTypeFilter] = useState<string>('');

  // 提取所有异常类型选项
  const exceptionTypeOptions = useMemo(() => {
    const types = [...new Set(records.map(r => r.exceptionType).filter(Boolean))];
    return [
      { label: t('filter.allExceptionTypes'), value: '' },
      ...types.map(type => ({ label: type, value: type }))
    ];
  }, [records, t]);

  // 统计数据
  const pendingCount = records.filter((r) => r.status === '待处理' || r.status === 'pending').length;
  const feedbackCount = records.filter((r) => r.status === '待反馈' || r.status === 'pending_feedback').length;

  // 筛选数据
  const filtered = useMemo(() => {
    return records.filter((r) => {
      // 状态筛选
      if (statusFilter === 'pending' && !(r.status === '待处理' || r.status === 'pending')) return false;
      if (statusFilter === 'pending_feedback' && !(r.status === '待反馈' || r.status === 'pending_feedback')) return false;

      // 异常类型筛选
      if (exceptionTypeFilter && r.exceptionType !== exceptionTypeFilter) return false;

      return true;
    });
  }, [records, statusFilter, exceptionTypeFilter]);

  // 分页数据
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const openDrawer = (record: TaskRecord) => {
    setSelectedRecord(record);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setTimeout(() => setSelectedRecord(null), 300);
  };

  const isPending = (r: TaskRecord) => r.status === '待处理' || r.status === 'pending';
  const isFeedback = (r: TaskRecord) => r.status === '待反馈' || r.status === 'pending_feedback';

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="task-list-container">
      {/* 筛选栏 - 只保留异常类型筛选 */}
      <div className="task-filters">
        <div className="filter-group">
          <span className="filter-label">{t('filter.exceptionType')}</span>
          <Select
            value={exceptionTypeFilter}
            optionList={exceptionTypeOptions}
            onChange={(v) => {
              setExceptionTypeFilter(v as string);
              setCurrentPage(1);
            }}
            style={{ width: 180 }}
            filter
          />
        </div>
      </div>

      {/* 统计栏 */}
      <div className="task-stats">
        <div
          className={classnames('stat-chip', 'stat-pending', { active: statusFilter === 'pending' })}
          onClick={() => {
            onStatusFilterChange(statusFilter === 'pending' ? 'all' : 'pending');
            setCurrentPage(1);
          }}
        >
          <span className="stat-num">{pendingCount}</span>
          <span className="stat-label">{t('task.pending')}</span>
        </div>
        <div
          className={classnames('stat-chip', 'stat-feedback', { active: statusFilter === 'pending_feedback' })}
          onClick={() => {
            onStatusFilterChange(statusFilter === 'pending_feedback' ? 'all' : 'pending_feedback');
            setCurrentPage(1);
          }}
        >
          <span className="stat-num">{feedbackCount}</span>
          <span className="stat-label">{t('task.pendingFeedback')}</span>
        </div>
        <div className="stat-total">
          {t('task.total')} {filtered.length} {t('task.items')}
        </div>
      </div>

      {/* 两列卡片网格 */}
      <div className="task-cards-container">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Empty description={t('task.noData')} />
          </div>
        ) : (
          <>
            <div className="task-cards-grid">
              {paginatedData.map((record, index) => (
                <div
                  className={classnames('task-card', {
                    'task-card-pending': isPending(record),
                    'task-card-feedback': isFeedback(record),
                  })}
                  key={record.recordId}
                  style={{ animationDelay: `${index * 0.04}s` }}
                  onClick={() => openDrawer(record)}
                >
                  {/* 卡片头部 */}
                  <div className="card-header">
                    <div className="card-tags">
                      <Tag color={riskColors[record.riskLevel] || 'grey'} size="small">
                        {record.riskLevel}
                      </Tag>
                      {isPending(record) && <Tag color="red" size="small">{t('task.pending')}</Tag>}
                      {isFeedback(record) && <Tag color="orange" size="small">{t('task.pendingFeedback')}</Tag>}
                    </div>
                    {record.reviewRecordCode && (
                      <span className="card-code">{record.reviewRecordCode}</span>
                    )}
                  </div>

                  {/* 卡片内容 */}
                  <div className="card-body">
                    <div className="card-title">{record.exceptionType}</div>
                    {record.exceptionDetail && (
                      <div className="card-detail">{record.exceptionDetail}</div>
                    )}
                  </div>

                  {/* 卡片底部 */}
                  <div className="card-footer">
                    <div className="card-meta">
                      {record.handler && <span className="meta-handler">{record.handler}</span>}
                      {record.department && <span className="meta-department">{record.department}</span>}
                    </div>
                    {record.reviewTime && (
                      <span className="meta-time">{record.reviewTime.split(' ')[0]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 分页器 */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <Pagination
                  total={filtered.length}
                  pageSize={PAGE_SIZE}
                  currentPage={currentPage}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showQuickJumper
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* 抽屉详情面板 */}
      <div className={classnames('drawer-overlay', { visible: drawerVisible })} onClick={closeDrawer} />
      <div className={classnames('drawer-panel', { visible: drawerVisible })}>
        {selectedRecord && (
          <>
            <div className="drawer-header">
              <div className="drawer-title">
                <Tag color={riskColors[selectedRecord.riskLevel] || 'grey'} size="small">
                  {selectedRecord.riskLevel}
                </Tag>
                <span>{selectedRecord.exceptionType}</span>
              </div>
              <button className="drawer-close" onClick={closeDrawer}>×</button>
            </div>

            <div className="drawer-body">
              {/* 基本信息 */}
              <div className="detail-section">
                <div className="detail-grid">
                  <FieldRow label={t('config.field.platform')} value={selectedRecord.platform} />
                  <FieldRow label={t('config.field.handler')} value={selectedRecord.handler} />
                  <FieldRow label={t('filter.department')} value={selectedRecord.department} />
                  <FieldRow label={t('config.field.reviewTime')} value={selectedRecord.reviewTime} />
                  <FieldRow label={t('config.field.reviewRecordCode')} value={selectedRecord.reviewRecordCode} />
                </div>
              </div>

              {/* 异常详情 */}
              {selectedRecord.exceptionDetail && (
                <div className="detail-section">
                  <div className="section-title">{t('config.field.exceptionDetail')}</div>
                  <div className="detail-content">{selectedRecord.exceptionDetail}</div>
                </div>
              )}

              {/* 权限中心 */}
              <SectionBlock title={t('field.group.perm')}>
                {buildPermFields(selectedRecord, t).map((f, i) => (
                  <FieldRow key={i} label={f.label} value={f.value} />
                ))}
              </SectionBlock>

              {/* 外部系统 */}
              <SectionBlock title={t('field.group.ext')}>
                {buildExtFields(selectedRecord, t).map((f, i) => (
                  <FieldRow key={i} label={f.label} value={f.value} />
                ))}
              </SectionBlock>
            </div>

            <div className="drawer-footer">
              {isPending(selectedRecord) && (
                <Popconfirm
                  title={t('task.confirmCheck.title')}
                  onConfirm={() => {
                    onCheck(selectedRecord.recordId);
                    closeDrawer();
                  }}
                  okText={t('confirm')}
                  cancelText={t('cancel')}
                >
                  <Button type="primary">{t('task.confirmCheck')}</Button>
                </Popconfirm>
              )}
              {isFeedback(selectedRecord) && (
                <Button type="secondary" onClick={() => {
                  onFeedback(selectedRecord.recordId);
                  closeDrawer();
                }}>
                  {t('task.submitFeedback')}
                </Button>
              )}
              <Button onClick={closeDrawer}>{t('cancel')}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
