
import { DimensionNode, Scenario, Version, UDField, Subset, SyncRecord, MappingField } from './types';

export const INITIAL_UD_FIELDS: UDField[] = [
  { id: 'ud-1', code: 'ud1', name: '安全类', logicalName: 'Security Category', physicalBinding: 'attr_security_id', type: 'LIST' },
  { id: 'ud-2', code: 'ud2', name: '是否母公司', logicalName: 'isHolding', physicalBinding: 'is_holding_flag', type: 'NUMBER', config: { precision: 1, scale: 0, isPercentage: false } },
  { id: 'ud-3', code: 'ud3', name: '简称', logicalName: 'Short Name', physicalBinding: 'short_name_v', type: 'STRING' },
  { id: 'ud-4', code: 'ud4', name: '本位币', logicalName: 'Local Currency', physicalBinding: 'base_currency_code', type: 'DIMENSION' }
];

export const INITIAL_SUBSETS: Subset[] = [
  { id: 'sub-s1', name: '所有叶子节点', description: '系统中所有的末级实体', memberCount: 45, createdBy: 'System', createdAt: '2023-01-01', isSystem: true },
  { id: 'sub-s2', name: '本月新增', description: '当前期间内新创建的实体', memberCount: 3, createdBy: 'System', createdAt: '2024-05-01', isSystem: true },
  { id: 'sub-1', name: '境内活跃实体', description: '所有注册地在中国境内的存续实体', memberCount: 12, createdBy: 'Admin', createdAt: '2024-01-15' },
  { id: 'sub-2', name: '拟注销名单', description: '当前处于清算流程中的节点', memberCount: 3, createdBy: 'Zhang San', createdAt: '2024-03-20' }
];

export const MAPPING_FIELDS: MappingField[] = [
  { sourceCode: 'name', sourceName: '编码', targetMapping: 'name' },
  { sourceCode: 'parentName', sourceName: '父级编码', targetMapping: 'parent.name' },
  { sourceCode: 'aggweight', sourceName: '比重', targetMapping: 'parent@aggweight' },
  { sourceCode: 'isActive', sourceName: '是否有效', targetMapping: 'is_active' },
  { sourceCode: 'multilingual', sourceName: '成员描述', targetMapping: '' }
];

export const SYNC_HISTORY: SyncRecord[] = [
  { id: 'rec-1', time: '2024-05-20 14:30:05', executor: 'Admin', status: 'SUCCESS', count: 124 },
  { id: 'rec-2', time: '2024-05-19 09:12:44', executor: 'System', status: 'SUCCESS', count: 124 },
  { id: 'rec-3', time: '2024-05-18 18:00:00', executor: 'Li Si', status: 'FAILED', count: 0 }
];

export const TABLE_DATA = [
  { id: '1', code: 'NoEntity', parent: '#root', nameEn: 'NoEntity', nameCn: '无实体', weight: 1, shared: 'N', active: 'Y', currency: '人民币', ud1: '', ud2: 'N' },
  { id: '2', code: 'TotalEntity', parent: '#root', nameEn: 'TotalEntity', nameCn: '实体总额', weight: 1, shared: 'N', active: 'Y', currency: '人民币', ud1: '', ud2: 'Y' },
  { id: '3', code: 'MC', parent: 'TotalEntity', nameEn: 'MC', nameCn: '法定合并主架构', weight: 1, shared: 'N', active: 'Y', currency: '人民币', ud1: '', ud2: 'Y' },
  { id: '4', code: 'M', parent: 'MC', nameEn: 'M公司', nameCn: 'M公司', weight: 1, shared: 'N', active: 'Y', currency: '人民币', ud1: '', ud2: 'Y' },
  { id: '5', code: 'AC', parent: 'MC', nameEn: 'A二级合并', nameCn: 'A二级合并', weight: 1, shared: 'N', active: 'Y', currency: '人民币', ud1: '', ud2: '' },
  { id: '6', code: 'A', parent: 'AC', nameEn: 'A公司', nameCn: 'A公司', weight: 1, shared: 'N', active: 'Y', currency: '人民币', ud1: '', ud2: 'Y' },
  { id: '7', code: 'BC', parent: 'AC', nameEn: 'B三级合并', nameCn: 'B三级合并', weight: 1, shared: 'N', active: 'Y', currency: '人民币', ud1: '', ud2: '' },
  { id: '8', code: 'B', parent: 'BC', nameEn: 'B公司', nameCn: 'B公司', weight: 1, shared: 'N', active: 'Y', currency: '人民币', ud1: '', ud2: 'Y' },
  { id: '9', code: 'C', parent: 'BC', nameEn: 'C公司', nameCn: 'C公司', weight: 1, shared: 'N', active: 'Y', currency: '人民币', ud1: '', ud2: '' },
  { id: '10', code: 'D', parent: 'BC', nameEn: 'D公司', nameCn: 'D公司', weight: 1, shared: 'Y', active: 'Y', currency: '人民币', ud1: '', ud2: '' },
  { id: '11', code: 'E', parent: 'AC', nameEn: 'E公司', nameCn: 'E公司', weight: 1, shared: 'N', active: 'Y', currency: '港币', ud1: '', ud2: '' },
  { id: '12', code: 'D', parent: 'AC', nameEn: 'D公司', nameCn: 'D公司', weight: 1, shared: 'N', active: 'Y', currency: '人民币', ud1: '', ud2: '' },
];

export const INITIAL_DIMENSION_TREE: DimensionNode[] = [
  {
    id: 'root-1',
    code: 'GROUP_TOTAL',
    name: '集团总部合并范围',
    type: 'Total',
    validFrom: { startYear: 2020, startPeriod: 1, endYear: 9999, endPeriod: 12 },
    validTo: { startYear: 9999, startPeriod: 12, endYear: 9999, endPeriod: 12 },
    properties: { ud1: '安全类1', ud2: 1, ud3: '集团' },
    children: [
      {
        id: 'node-2',
        code: 'CHINA_CORP',
        name: '大中华区事业部',
        type: 'Member',
        validFrom: { startYear: 2020, startPeriod: 1, endYear: 9999, endPeriod: 12 },
        validTo: { startYear: 9999, startPeriod: 12, endYear: 9999, endPeriod: 12 },
        properties: { ud1: '安全类1', ud2: 1, ud3: '分部1' },
        children: [
          {
            id: 'leaf-1',
            code: 'BJ_OFFICE',
            name: '北京分公司',
            type: 'Leaf',
            validFrom: { startYear: 2020, startPeriod: 1, endYear: 9999, endPeriod: 12 },
            validTo: { startYear: 9999, startPeriod: 12, endYear: 9999, endPeriod: 12 },
            properties: {},
            children: []
          },
          {
            id: 'leaf-2',
            code: 'SH_OFFICE',
            name: '上海分公司',
            type: 'Leaf',
            validFrom: { startYear: 2020, startPeriod: 1, endYear: 2024, endPeriod: 6 },
            validTo: { startYear: 9999, startPeriod: 12, endYear: 9999, endPeriod: 12 },
            properties: {},
            children: []
          },
          {
            id: 'leaf-3',
            code: 'SZ_R_D',
            name: '深圳研发中心',
            type: 'Leaf',
            validFrom: { startYear: 2024, startPeriod: 3, endYear: 9999, endPeriod: 12 },
            validTo: { startYear: 9999, startPeriod: 12, endYear: 9999, endPeriod: 12 },
            properties: {},
            children: []
          }
        ]
      },
      {
        id: 'node-3',
        code: 'EUROPE_DIV',
        name: '欧洲及海外事业部',
        type: 'Member',
        validFrom: { startYear: 2025, startPeriod: 1, endYear: 9999, endPeriod: 12 },
        validTo: { startYear: 9999, startPeriod: 12, endYear: 9999, endPeriod: 12 },
        properties: { ud1: '安全类2', ud2: 0, ud3: '分部2' },
        children: []
      }
    ]
  }
];

export const SCENARIOS: Scenario[] = ['Actual', 'Budget', 'Forecast', 'Staging'];
export const VERSIONS: Version[] = ['V1', 'V2', 'Working', 'Final'];
export const YEARS = [2022, 2023, 2024, 2025, 2026];
export const PERIODS = Array.from({ length: 12 }, (_, i) => i + 1);
