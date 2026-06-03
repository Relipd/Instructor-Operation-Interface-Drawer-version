import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { dashboard as defaultDashboard, DashboardState } from '@lark-base-open/js-sdk';
import { useTheme } from './hooks';
import { useWorkspace } from './workspace';
import classnames from 'classnames';
import ConfigPanel from './components/ConfigPanel';
import TaskList, { TaskRecord } from './components/TaskList';
import FeedbackDialog from './components/FeedbackDialog';
import { getRecordList, updateRecordField, addRecord, cellToText, cellToDate, setBaseInstance } from './utils/bitable';
import { ElMessage } from './utils/message';
import '@lark-base-open/js-sdk/dist/style/dashboard.css';
import './App.scss';

export interface IPluginConfig {
  baseToken?: string;
  tableId: string;
  statusFieldId: string;
  handlerFieldId: string;
  departmentFieldId: string;
  platformFieldId: string;
  exceptionTypeFieldId: string;
  exceptionDetailFieldId: string;
  riskLevelFieldId: string;
  // 审阅时间（替代原来的 createdAt）
  reviewTimeFieldId: string;
  // 审阅记录编码（索引列）
  reviewRecordCodeFieldId: string;
  // 权限中心字段
  permAccountNameFieldId: string;
  permStoreNameFieldId: string;
  permWorkOrderIdFieldId: string;
  permApplicantFieldId: string;
  permApplicantEmailFieldId: string;
  permApplicantPhoneFieldId: string;
  permUserNicknameFieldId: string;
  permUserRoleListFieldId: string;
  // 外部系统字段
  extStoreNameFieldId: string;
  extUserPhoneFieldId: string;
  extAccountNameFieldId: string;
  extUserNameFieldId: string;
  extUserRoleListFieldId: string;
  // 筛选
  handlerNameFilter: string;
  departmentNameFilter: string;
  // 回传表配置
  feedbackTableId: string;
  feedbackStatusFieldId: string;
  feedbackResultFieldId: string;
  feedbackTimeFieldId: string;
  feedbackPersonFieldId: string;
  feedbackRecordCodeFieldId: string;
}

const emptyConfig: IPluginConfig = {
  baseToken: '',
  tableId: '',
  statusFieldId: '',
  handlerFieldId: '',
  departmentFieldId: '',
  platformFieldId: '',
  exceptionTypeFieldId: '',
  exceptionDetailFieldId: '',
  riskLevelFieldId: '',
  reviewTimeFieldId: '',
  reviewRecordCodeFieldId: '',
  permAccountNameFieldId: '',
  permStoreNameFieldId: '',
  permWorkOrderIdFieldId: '',
  permApplicantFieldId: '',
  permApplicantEmailFieldId: '',
  permApplicantPhoneFieldId: '',
  permUserNicknameFieldId: '',
  permUserRoleListFieldId: '',
  extStoreNameFieldId: '',
  extUserPhoneFieldId: '',
  extAccountNameFieldId: '',
  extUserNameFieldId: '',
  extUserRoleListFieldId: '',
  handlerNameFilter: '',
  departmentNameFilter: '',
  feedbackTableId: '',
  feedbackStatusFieldId: '',
  feedbackResultFieldId: '',
  feedbackTimeFieldId: '',
  feedbackPersonFieldId: '',
  feedbackRecordCodeFieldId: '',
};

export default function App() {
  const { bgColor } = useTheme();
  const { t } = useTranslation();
  const { base: workspaceBase, dashboard: workspaceDashboard, switchBase } = useWorkspace();

  const [config, setConfig] = useState<IPluginConfig>(emptyConfig);
  const [records, setRecords] = useState<TaskRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'pending_feedback'>('all');
  const [feedbackRecordId, setFeedbackRecordId] = useState<string | null>(null);

  const isCreate = defaultDashboard.state === DashboardState.Create;
  const isConfig = defaultDashboard.state === DashboardState.Config || isCreate;

  // Phase 1: load config using default dashboard, then init workspace
  useEffect(() => {
    if (isCreate) return;
    defaultDashboard.getConfig().then((res: any) => {
      const { customConfig, dataConditions } = res;
      const baseToken = dataConditions?.[0]?.baseToken || '';
      setConfig((prev) => ({ ...prev, ...customConfig, baseToken }));

      if (baseToken) {
        switchBase(baseToken);
      }
    }).catch(() => {
      console.warn('getConfig failed, using default config');
    }).finally(() => {
      // 必须调用 setRendered，否则飞书会一直显示 loading
      setTimeout(() => {
        try { defaultDashboard.setRendered(); } catch {}
      }, 2000);
    });
  }, []);

  // When workspace base is ready, set it in bitable utils
  useEffect(() => {
    if (workspaceBase) {
      setBaseInstance(workspaceBase);
    }
  }, [workspaceBase]);

  const fetchData = useCallback(async (cfg: IPluginConfig) => {
    if (!cfg.tableId || !cfg.statusFieldId) return;
    try {
      const recordList = await getRecordList(cfg.tableId);

      let taskRecords: TaskRecord[] = recordList.map((r) => ({
        recordId: r.recordId,
        platform: cellToText(r.fields[cfg.platformFieldId] ?? ''),
        exceptionType: cellToText(r.fields[cfg.exceptionTypeFieldId] ?? ''),
        exceptionDetail: cellToText(r.fields[cfg.exceptionDetailFieldId] ?? ''),
        riskLevel: cellToText(r.fields[cfg.riskLevelFieldId] ?? ''),
        status: cellToText(r.fields[cfg.statusFieldId] ?? ''),
        handler: cellToText(r.fields[cfg.handlerFieldId] ?? ''),
        department: cellToText(r.fields[cfg.departmentFieldId] ?? ''),
        reviewTime: cellToDate(r.fields[cfg.reviewTimeFieldId] ?? ''),
        reviewRecordCode: cellToText(r.fields[cfg.reviewRecordCodeFieldId] ?? ''),
        permAccountName: cellToText(r.fields[cfg.permAccountNameFieldId] ?? ''),
        permStoreName: cellToText(r.fields[cfg.permStoreNameFieldId] ?? ''),
        permWorkOrderId: cellToText(r.fields[cfg.permWorkOrderIdFieldId] ?? ''),
        permApplicant: cellToText(r.fields[cfg.permApplicantFieldId] ?? ''),
        permApplicantEmail: cellToText(r.fields[cfg.permApplicantEmailFieldId] ?? ''),
        permApplicantPhone: cellToText(r.fields[cfg.permApplicantPhoneFieldId] ?? ''),
        permUserNickname: cellToText(r.fields[cfg.permUserNicknameFieldId] ?? ''),
        permUserRoleList: cellToText(r.fields[cfg.permUserRoleListFieldId] ?? ''),
        extStoreName: cellToText(r.fields[cfg.extStoreNameFieldId] ?? ''),
        extUserPhone: cellToText(r.fields[cfg.extUserPhoneFieldId] ?? ''),
        extAccountName: cellToText(r.fields[cfg.extAccountNameFieldId] ?? ''),
        extUserName: cellToText(r.fields[cfg.extUserNameFieldId] ?? ''),
        extUserRoleList: cellToText(r.fields[cfg.extUserRoleListFieldId] ?? ''),
      }));

      if (cfg.handlerNameFilter) {
        const keyword = cfg.handlerNameFilter.trim().toLowerCase();
        taskRecords = taskRecords.filter((r) =>
          r.handler.toLowerCase().includes(keyword)
        );
      }

      if (cfg.departmentNameFilter) {
        const keyword = cfg.departmentNameFilter.trim().toLowerCase();
        taskRecords = taskRecords.filter((r) =>
          r.department.toLowerCase().includes(keyword)
        );
      }

      taskRecords = taskRecords.filter(
        (r) => r.status === '待处理' || r.status === 'pending' || r.status === '待反馈' || r.status === 'pending_feedback'
      );

      setRecords(taskRecords);
    } catch (e) {
      console.error('Fetch data error:', e);
    }
  }, []);

  useEffect(() => {
    if (config.tableId && config.statusFieldId) {
      fetchData(config);
    }
  }, [config, fetchData]);

  // 监听多维表格数据变化实时刷新
  useEffect(() => {
    const activeDashboard = workspaceDashboard || defaultDashboard;
    if (!activeDashboard || typeof activeDashboard.onDataChange !== 'function') return;

    const off = activeDashboard.onDataChange(() => {
      if (config.tableId) fetchData(config);
    });
    return () => off();
  }, [config, fetchData, workspaceDashboard]);

  // 确认核查：pending → pending_feedback
  const handleCheck = useCallback(async (recordId: string) => {
    try {
      await updateRecordField(config.tableId, recordId, config.statusFieldId, '待反馈');
      setRecords((prev) =>
        prev.map((r) =>
          r.recordId === recordId ? { ...r, status: '待反馈' } : r
        )
      );
      ElMessage.success(t('check.success'));
    } catch (e) {
      console.error('Check failed:', e);
      ElMessage.error(t('check.fail'));
    }
  }, [config, t]);

  // 提交反馈：写入回传表 + 更新原记录状态
  const handleFeedbackSubmit = useCallback(async (recordId: string, feedback: string, feedbackPerson: string) => {
    try {
      if (config.feedbackTableId) {
        const now = Date.now();
        const currentRecord = records.find((r) => r.recordId === recordId);
        const feedbackFields: Record<string, any> = {};
        if (config.feedbackStatusFieldId) feedbackFields[config.feedbackStatusFieldId] = '已反馈';
        if (config.feedbackResultFieldId) feedbackFields[config.feedbackResultFieldId] = feedback;
        if (config.feedbackTimeFieldId) feedbackFields[config.feedbackTimeFieldId] = now;
        if (config.feedbackPersonFieldId) feedbackFields[config.feedbackPersonFieldId] = feedbackPerson;
        if (config.feedbackRecordCodeFieldId && currentRecord?.reviewRecordCode) {
          feedbackFields[config.feedbackRecordCodeFieldId] = currentRecord.reviewRecordCode;
        }
        await addRecord(config.feedbackTableId, feedbackFields);
      }

      await updateRecordField(config.tableId, recordId, config.statusFieldId, '已解决');
      setRecords((prev) => prev.filter((r) => r.recordId !== recordId));
      ElMessage.success(t('feedback.success'));
    } catch (e) {
      console.error('Feedback failed:', e);
      ElMessage.error(t('feedback.fail'));
    }
  }, [config, t]);

  return (
    <main
      style={{ backgroundColor: bgColor }}
      className={classnames({ 'main-config': isConfig, main: true })}
    >
      <div className="content">
        {!config.tableId || !config.statusFieldId ? (
          <div className="empty-hint">
            <div className="empty-icon">📋</div>
            <div className="empty-text">{t('please.config')}</div>
          </div>
        ) : (
          <TaskList
            records={records}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onCheck={handleCheck}
            onFeedback={(id) => setFeedbackRecordId(id)}
          />
        )}
      </div>

      {isConfig && <ConfigPanel config={config} setConfig={setConfig} />}

      {feedbackRecordId && (
        <FeedbackDialog
          visible={!!feedbackRecordId}
          recordId={feedbackRecordId}
          onClose={() => setFeedbackRecordId(null)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </main>
  );
}
