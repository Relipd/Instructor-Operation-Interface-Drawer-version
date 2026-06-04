import { useEffect, useCallback, useState } from 'react';
import { Select, Button, Input } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useWorkspace, workspace } from '../workspace';
import type { IPluginConfig } from '../App';
import './ConfigPanel.scss';

interface Props {
  config: IPluginConfig;
  setConfig: (c: IPluginConfig) => void;
}

interface FieldMeta {
  id: string;
  name: string;
}

interface BaseInfo {
  name: string;
  token: string;
}

/** 根据字段名关键词自动匹配字段 ID */
function autoDetectFields(fields: FieldMeta[], cfg: IPluginConfig): Partial<IPluginConfig> {
  const detected: Record<string, string> = {};
  const rules: [string, keyof IPluginConfig][] = [
    ['平台', 'platformFieldId'],
    ['platform', 'platformFieldId'],
    ['风险等级', 'riskLevelFieldId'],
    ['risk', 'riskLevelFieldId'],
    ['状态', 'statusFieldId'],
    ['status', 'statusFieldId'],
    ['处理人', 'handlerFieldId'],
    ['handler', 'handlerFieldId'],
    ['部门', 'departmentFieldId'],
    ['department', 'departmentFieldId'],
    ['异常类型', 'exceptionTypeFieldId'],
    ['exception', 'exceptionTypeFieldId'],
    ['详细', 'exceptionDetailFieldId'],
    ['detail', 'exceptionDetailFieldId'],
    ['描述', 'exceptionDetailFieldId'],
    ['审阅时间', 'reviewTimeFieldId'],
    ['review', 'reviewTimeFieldId'],
    ['time', 'reviewTimeFieldId'],
    ['审阅记录编码', 'reviewRecordCodeFieldId'],
    ['recordCode', 'reviewRecordCodeFieldId'],
    ['编码', 'reviewRecordCodeFieldId'],
    ['账号名称', 'permAccountNameFieldId'],
    ['permAccount', 'permAccountNameFieldId'],
    ['店铺名称', 'permStoreNameFieldId'],
    ['permStore', 'permStoreNameFieldId'],
    ['工单', 'permWorkOrderIdFieldId'],
    ['workOrder', 'permWorkOrderIdFieldId'],
    ['申请人', 'permApplicantFieldId'],
    ['applicant', 'permApplicantFieldId'],
    ['email', 'permApplicantEmailFieldId'],
    ['phone', 'permApplicantPhoneFieldId'],
    ['手机', 'permApplicantPhoneFieldId'],
    ['nickname', 'permUserNicknameFieldId'],
    ['昵称', 'permUserNicknameFieldId'],
    ['角色', 'permUserRoleListFieldId'],
    ['role', 'permUserRoleListFieldId'],
    ['外部系统', 'extStoreNameFieldId'],
    ['extStore', 'extStoreNameFieldId'],
    ['extUserPhone', 'extUserPhoneFieldId'],
    ['extAccount', 'extAccountNameFieldId'],
    ['extUserName', 'extUserNameFieldId'],
    ['extUserRole', 'extUserRoleListFieldId'],
  ];

  for (const field of fields) {
    const name = field.name.toLowerCase();
    for (const [keyword, key] of rules) {
      if (name.includes(keyword.toLowerCase()) && !cfg[key]) {
        (detected as any)[key] = field.id;
        break;
      }
    }
  }

  return detected as Partial<IPluginConfig>;
}

/** 根据字段名关键词自动匹配回传表字段 */
function autoDetectFeedbackFields(fields: FieldMeta[], cfg: IPluginConfig): Partial<IPluginConfig> {
  const detected: Record<string, string> = {};
  const rules: [string, keyof IPluginConfig][] = [
    ['状态', 'feedbackStatusFieldId'],
    ['status', 'feedbackStatusFieldId'],
    ['反馈结果', 'feedbackResultFieldId'],
    ['result', 'feedbackResultFieldId'],
    ['反馈时间', 'feedbackTimeFieldId'],
    ['time', 'feedbackTimeFieldId'],
    ['date', 'feedbackTimeFieldId'],
    ['反馈人员', 'feedbackPersonFieldId'],
    ['person', 'feedbackPersonFieldId'],
    ['staff', 'feedbackPersonFieldId'],
    ['用户', 'feedbackPersonFieldId'],
    ['user', 'feedbackPersonFieldId'],
    ['审阅记录编码', 'feedbackRecordCodeFieldId'],
    ['recordCode', 'feedbackRecordCodeFieldId'],
    ['编码', 'feedbackRecordCodeFieldId'],
  ];

  for (const field of fields) {
    const name = field.name.toLowerCase();
    for (const [keyword, key] of rules) {
      if (name.includes(keyword.toLowerCase()) && !cfg[key]) {
        (detected as any)[key] = field.id;
        break;
      }
    }
  }

  return detected as Partial<IPluginConfig>;
}

export default function ConfigPanel({ config, setConfig }: Props) {
  const { t } = useTranslation();
  const { base: workspaceBase, dashboard: workspaceDashboard, switchBase } = useWorkspace();
  const [baseList, setBaseList] = useState<BaseInfo[]>([]);
  const [tables, setTables] = useState<{ id: string; name: string }[]>([]);
  const [fields, setFields] = useState<FieldMeta[]>([]);
  const [feedbackFields, setFeedbackFields] = useState<FieldMeta[]>([]);

  // 1. 加载多维表格列表
  useEffect(() => {
    workspace.getBaseList({}).then((res: any) => {
      const list = res.base_list.map((b: any) => ({ name: b.name, token: b.token }));
      setBaseList(list);
      if (!config.baseToken && list.length > 0) {
        handleBaseChange(list[0].token);
      }
    });
  }, []);

  // 2. 当 baseToken 变化时切换 workspace
  useEffect(() => {
    if (config.baseToken) {
      switchBase(config.baseToken);
    }
  }, [config.baseToken]);

  // 3. 当 workspace base 实例就绪，加载表列表
  useEffect(() => {
    if (!workspaceBase) return;
    workspaceBase.getTableMetaList().then((list: any) => {
      const mapped = list.map((t: any) => ({ id: t.id, name: t.name }));
      setTables(mapped);
      if (!config.tableId && mapped.length > 0) {
        setConfig({ ...config, tableId: mapped[0].id });
      }
    });
  }, [workspaceBase]);

  // 4. 当 tableId 变化，加载主表字段列表
  useEffect(() => {
    if (!workspaceBase || !config.tableId) return;
    workspaceBase.getTable(config.tableId).then(async (table: any) => {
      try {
        const view = await table.getActiveView();
        const metas = await view.getFieldMetaList();
        const list = metas.map((m: any) => ({ id: m.id, name: m.name }));
        setFields(list);
        const detected = autoDetectFields(list, config);
        if (Object.keys(detected).length > 0) {
          setConfig({ ...config, ...detected });
        }
      } catch {
        const metas = await table.getFieldMetaList();
        setFields(metas.map((m: any) => ({ id: m.id, name: m.name })));
      }
    });
  }, [workspaceBase, config.tableId]);

  // 5. 当 feedbackTableId 变化，加载回传表字段列表
  useEffect(() => {
    if (!workspaceBase || !config.feedbackTableId) return;
    workspaceBase.getTable(config.feedbackTableId).then(async (table: any) => {
      try {
        const view = await table.getActiveView();
        const metas = await view.getFieldMetaList();
        const list = metas.map((m: any) => ({ id: m.id, name: m.name }));
        setFeedbackFields(list);
        const detected = autoDetectFeedbackFields(list, config);
        if (Object.keys(detected).length > 0) {
          setConfig({ ...config, ...detected });
        }
      } catch {
        const metas = await table.getFieldMetaList();
        setFeedbackFields(metas.map((m: any) => ({ id: m.id, name: m.name })));
      }
    });
  }, [workspaceBase, config.feedbackTableId]);

  const handleBaseChange = useCallback((token: string) => {
    setConfig({ ...config, baseToken: token, tableId: '', feedbackTableId: '' });
  }, [config, setConfig]);

  const handleSave = useCallback(() => {
    const dash = workspaceDashboard;
    if (!dash || typeof dash.saveConfig !== 'function') return;
    dash.saveConfig({
      customConfig: config,
      dataConditions: [
        {
          baseToken: config.baseToken,
          tableId: config.tableId,
        },
      ],
    } as any);
  }, [config, workspaceDashboard]);

  const fieldOptions = fields.map((f) => ({ label: f.name, value: f.id }));
  const feedbackFieldOptions = feedbackFields.map((f) => ({ label: f.name, value: f.id }));
  const tableOptions = tables.map((t) => ({ label: t.name, value: t.id }));
  const baseOptions = baseList.map((b) => ({ label: b.name, value: b.token }));

  return (
    <div className="config-panel">
      <div className="config-form">
        {/* ====== 数据源配置 ====== */}
        <div className="config-section-label">{t('config.dataSource')}</div>

        <div className="config-item">
          <label>{t('config.base') || '多维表格'}</label>
          <Select
            value={config.baseToken}
            optionList={baseOptions}
            onChange={(v) => handleBaseChange(v as string)}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('config.table')}</label>
          <Select
            value={config.tableId}
            optionList={tableOptions}
            onChange={(v) => setConfig({ ...config, tableId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('config.field.status')}</label>
          <Select
            value={config.statusFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, statusFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('config.field.handler')}</label>
          <Select
            value={config.handlerFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, handlerFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('config.field.department')}</label>
          <Select
            value={config.departmentFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, departmentFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('config.field.platform')}</label>
          <Select
            value={config.platformFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, platformFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('config.field.exceptionType')}</label>
          <Select
            value={config.exceptionTypeFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, exceptionTypeFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('config.field.riskLevel')}</label>
          <Select
            value={config.riskLevelFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, riskLevelFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('config.field.exceptionDetail')}</label>
          <Select
            value={config.exceptionDetailFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, exceptionDetailFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('config.field.reviewTime')}</label>
          <Select
            value={config.reviewTimeFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, reviewTimeFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('config.field.reviewRecordCode')}</label>
          <Select
            value={config.reviewRecordCodeFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, reviewRecordCodeFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        {/* ====== 权限中心字段 ====== */}
        <div className="config-section-label config-section-spacer">{t('field.group.perm')}</div>

        <div className="config-item">
          <label>{t('field.permAccountName')}</label>
          <Select
            value={config.permAccountNameFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, permAccountNameFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('field.permStoreName')}</label>
          <Select
            value={config.permStoreNameFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, permStoreNameFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('field.permWorkOrderId')}</label>
          <Select
            value={config.permWorkOrderIdFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, permWorkOrderIdFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('field.permApplicant')}</label>
          <Select
            value={config.permApplicantFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, permApplicantFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('field.permApplicantEmail')}</label>
          <Select
            value={config.permApplicantEmailFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, permApplicantEmailFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('field.permApplicantPhone')}</label>
          <Select
            value={config.permApplicantPhoneFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, permApplicantPhoneFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('field.permUserNickname')}</label>
          <Select
            value={config.permUserNicknameFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, permUserNicknameFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('field.permUserRoleList')}</label>
          <Select
            value={config.permUserRoleListFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, permUserRoleListFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        {/* ====== 外部系统字段 ====== */}
        <div className="config-section-label config-section-spacer">{t('field.group.ext')}</div>

        <div className="config-item">
          <label>{t('field.extStoreName')}</label>
          <Select
            value={config.extStoreNameFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, extStoreNameFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('field.extUserPhone')}</label>
          <Select
            value={config.extUserPhoneFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, extUserPhoneFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('field.extAccountName')}</label>
          <Select
            value={config.extAccountNameFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, extAccountNameFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('field.extUserName')}</label>
          <Select
            value={config.extUserNameFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, extUserNameFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('field.extUserRoleList')}</label>
          <Select
            value={config.extUserRoleListFieldId}
            optionList={fieldOptions}
            onChange={(v) => setConfig({ ...config, extUserRoleListFieldId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        <div className="config-item">
          <label>{t('config.filter.handlerName')}</label>
          <Input
            value={config.handlerNameFilter}
            placeholder={t('config.filter.handlerName.placeholder')}
            onChange={(v) => setConfig({ ...config, handlerNameFilter: v })}
            style={{ width: '100%' }}
          />
        </div>

        <div className="config-item">
          <label>{t('config.filter.departmentName')}</label>
          <Input
            value={config.departmentNameFilter}
            placeholder={t('config.filter.departmentName.placeholder')}
            onChange={(v) => setConfig({ ...config, departmentNameFilter: v })}
            style={{ width: '100%' }}
          />
        </div>

        {/* ====== 回传表配置 ====== */}
        <div className="config-section-label config-section-spacer">{t('config.feedback')}</div>

        <div className="config-item">
          <label>{t('config.feedback.table')}</label>
          <Select
            value={config.feedbackTableId}
            optionList={tableOptions}
            onChange={(v) => setConfig({ ...config, feedbackTableId: v as string })}
            style={{ width: '100%' }}
            filter
          />
        </div>

        {config.feedbackTableId && (
          <>
            <div className="config-item">
              <label>{t('config.feedback.field.status')}</label>
              <Select
                value={config.feedbackStatusFieldId}
                optionList={feedbackFieldOptions}
                onChange={(v) => setConfig({ ...config, feedbackStatusFieldId: v as string })}
                style={{ width: '100%' }}
                filter
              />
            </div>

            <div className="config-item">
              <label>{t('config.feedback.field.result')}</label>
              <Select
                value={config.feedbackResultFieldId}
                optionList={feedbackFieldOptions}
                onChange={(v) => setConfig({ ...config, feedbackResultFieldId: v as string })}
                style={{ width: '100%' }}
                filter
              />
            </div>

            <div className="config-item">
              <label>{t('config.feedback.field.time')}</label>
              <Select
                value={config.feedbackTimeFieldId}
                optionList={feedbackFieldOptions}
                onChange={(v) => setConfig({ ...config, feedbackTimeFieldId: v as string })}
                style={{ width: '100%' }}
                filter
              />
            </div>

            <div className="config-item">
              <label>{t('config.feedback.field.person')}</label>
              <Select
                value={config.feedbackPersonFieldId}
                optionList={feedbackFieldOptions}
                onChange={(v) => setConfig({ ...config, feedbackPersonFieldId: v as string })}
                style={{ width: '100%' }}
                filter
              />
            </div>

            <div className="config-item">
              <label>{t('config.feedback.field.recordCode')}</label>
              <Select
                value={config.feedbackRecordCodeFieldId}
                optionList={feedbackFieldOptions}
                onChange={(v) => setConfig({ ...config, feedbackRecordCodeFieldId: v as string })}
                style={{ width: '100%' }}
                filter
              />
            </div>
          </>
        )}
      </div>

      <div className="config-btn-wrapper">
        <Button theme="solid" className="config-btn" onClick={handleSave}>
          {t('confirm')}
        </Button>
      </div>
    </div>
  );
}
