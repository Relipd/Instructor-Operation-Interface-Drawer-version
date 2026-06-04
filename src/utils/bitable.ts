import { bitable } from '@lark-base-open/js-sdk';

/** 从单元格值中提取文本 */
export function cellToText(cell: any): string {
  if (!cell) return '';
  if (typeof cell === 'string') return cell;
  if (typeof cell === 'number') return String(cell);
  if (Array.isArray(cell)) {
    return cell.map((v: any) => v.text || v.name || String(v)).join(', ');
  }
  if (cell.text) return cell.text;
  if (cell.name) return cell.name;
  return String(cell);
}

/** 从单元格值中提取日期字符串 */
export function cellToDate(cell: any): string {
  if (!cell) return '';
  if (typeof cell === 'number') {
    const d = new Date(cell);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  if (typeof cell === 'string') return cell;
  if (cell.value) {
    const d = new Date(cell.value);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  return '';
}

/** 获取当前激活的 base 实例（优先使用 workspace 传入的实例） */
let _baseOverride: any = null;

export function setBaseInstance(base: any) {
  _baseOverride = base;
}

function resolveBase(): any {
  return _baseOverride || bitable.base;
}

export interface FieldMeta {
  id: string;
  name: string;
}

/** 获取表的字段列表 */
export async function getFieldList(tableId: string): Promise<FieldMeta[]> {
  const table = await resolveBase().getTable(tableId);
  const metas = await table.getFieldMetaList();
  return metas.map((m: any) => ({ id: m.id, name: m.name }));
}

/** 获取表的记录列表（含真实 recordId） */
export async function getRecordList(tableId: string): Promise<{ recordId: string; fields: Record<string, any> }[]> {
  const table = await resolveBase().getTable(tableId);
  try {
    const res = await table.getRecords({ pageSize: 500 });
    return res.records.map((r: any) => ({
      recordId: r.recordId,
      fields: r.fields,
    }));
  } catch {
    try {
      const data = await (table as any).getPreviewData();
      const fieldList = await getFieldList(tableId);
      return (data?.records || []).map((row: any[], i: number) => {
        const fields: Record<string, any> = {};
        fieldList.forEach((f, idx) => { fields[f.id] = row[idx]; });
        return { recordId: String(i), fields };
      });
    } catch {
      return [];
    }
  }
}

/** 更新指定记录的指定字段 */
export async function updateRecordField(
  tableId: string,
  recordId: string,
  fieldId: string,
  value: any
): Promise<void> {
  const table = await resolveBase().getTable(tableId);
  await table.setCellValue(fieldId, recordId, value);
}

/** 向指定表新增一条记录 */
export async function addRecord(
  tableId: string,
  fields: Record<string, any>
): Promise<string | null> {
  const table = await resolveBase().getTable(tableId);
  try {
    const res = await table.addRecord({ fields });
    return res.recordId;
  } catch (e) {
    console.error('Add record error:', e);
    return null;
  }
}

