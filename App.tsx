
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Database, 
  Layers, 
  Search, 
  Settings,
  Table as TableIcon,
  FolderTree,
  User,
  Clock,
  ExternalLink,
  X,
  MoreHorizontal,
  Info,
  Globe,
  RefreshCw,
  ArrowRightLeft,
  ChevronLeft,
  HelpCircle,
  FolderOpen,
  History,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Eye,
  Edit3,
  Download,
  Upload,
  Network,
  Save,
  Loader2,
  Trash2,
  EyeOff,
  Copy,
  ChevronUp,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { 
  INITIAL_DIMENSION_TREE, 
  INITIAL_UD_FIELDS, 
  INITIAL_SUBSETS, 
  SCENARIOS, 
  VERSIONS, 
  MAPPING_FIELDS, 
  SYNC_HISTORY,
  TABLE_DATA,
  YEARS,
  PERIODS
} from './constants';
import { DimensionNode, AppContext, UDField, Subset, MappingField, SyncRecord } from './types';

// --- Shared Components ---

const SideRailItem: React.FC<{ icon: any; active: boolean; onClick: () => void; label: string }> = ({ icon: Icon, active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all relative group ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
    }`}
  >
    <Icon size={20} />
    <span className="absolute left-14 bg-slate-800 text-white text-[11px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
      {label}
    </span>
  </button>
);

const TreeItem: React.FC<{ node: DimensionNode; depth: number; onSelect: (n: DimensionNode) => void; selectedId?: string }> = ({ node, depth, onSelect, selectedId }) => {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedId === node.id;
  
  return (
    <div>
      <div 
        className={`flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-colors text-[13px] ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => onSelect(node)}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={`p-1 mr-1 transition-transform ${expanded ? 'rotate-90' : ''} ${node.children.length === 0 ? 'invisible' : ''}`}
        >
          <ChevronRight size={14} className="text-slate-400" />
        </button>
        <span className="truncate text-slate-800 font-bold">{node.code}</span>
        <span className="ml-2 text-slate-400 text-[11px] truncate">{node.name}</span>
      </div>
      {expanded && node.children.map(child => (
        <TreeItem key={child.id} node={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />
      ))}
    </div>
  );
};

const Toggle = ({ active, onChange }: { active: boolean, onChange: (v: boolean) => void }) => (
  <button 
    onClick={() => onChange(!active)}
    className={`w-10 h-5 rounded-full relative transition-all duration-200 ${active ? 'bg-blue-600' : 'bg-slate-200 shadow-inner'}`}
  >
    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${active ? 'right-0.5' : 'left-0.5'}`} />
  </button>
);

const DIMENSION_TYPES = [
  { id: 'general', name: '通用类', icon: Network, desc: '适用于常规业务维度的定义与管理' },
  { id: 'scenario', name: '场景类', icon: Layers, desc: '用于区分实际、预算、预测等不同业务场景' },
  { id: 'version', name: '版本类', icon: Copy, desc: '管理数据的不同版本迭代与快照' },
  { id: 'entity', name: '实体类', icon: FolderTree, desc: '定义组织架构、公司主体等层级关系' },
  { id: 'account', name: '科目类', icon: FileText, desc: '财务科目体系及相关属性管理' },
  { id: 'year', name: '年份类', icon: Calendar, desc: '定义时间维度中的年份层级' },
  { id: 'period', name: '期间类', icon: History, desc: '定义时间维度中的月度、季度等期间' },
  { id: 'movement', name: '变动类', icon: TrendingUp, desc: '追踪数据的期初、发生、期末等变动过程' },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<'data' | 'definition' | 'subset'>('data');
  const [dataView, setDataView] = useState<'tree' | 'table' | 'temporal'>('tree');
  const [defSubModule, setDefSubModule] = useState<'ud' | 'sync' | 'advanced'>('ud');
  
  const [selectedNode, setSelectedNode] = useState<DimensionNode | null>(null);
  const [selectedField, setSelectedField] = useState<UDField | null>(null);
  const [selectedSubset, setSelectedSubset] = useState<Subset | null>(INITIAL_SUBSETS[0]);
  
  // Temporal View States
  const [isQuerying, setIsQuerying] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [isBatchEditing, setIsBatchEditing] = useState(false);
  const [temporalOverrides, setTemporalOverrides] = useState<Record<string, Record<number, 'Y' | 'N'>>>({});
  const [editingCell, setEditingCell] = useState<{nodeCode: string, period: number} | null>(null);
  const [pov, setPov] = useState<AppContext>({
    scenario: 'Actual',
    version: 'Working',
    years: [2024],
    periods: [1, 2, 3, 4, 5]
  });

  const getStatus = (nodeCode: string, period: number) => {
    if (temporalOverrides[nodeCode]?.[period]) {
      return temporalOverrides[nodeCode][period];
    }
    let status = 'Y';
    if (nodeCode === 'SH_OFFICE' && period > 6) status = 'N';
    if (nodeCode === 'SZ_R_D' && period < 3) status = 'N';
    return status;
  };

  const handleStatusChange = (nodeCode: string, period: number, newStatus: 'Y' | 'N', applyFuture: boolean) => {
    setTemporalOverrides(prev => {
      const next = { ...prev };
      if (!next[nodeCode]) next[nodeCode] = {};
      
      if (applyFuture) {
        PERIODS.forEach(p => {
          if (p >= period) {
            next[nodeCode][p] = newStatus;
          }
        });
      } else {
        next[nodeCode][period] = newStatus;
      }
      return next;
    });
    setEditingCell(null);
  };

  const TemporalCell = ({ nodeCode, p }: { nodeCode: string, p: number }) => {
    const status = getStatus(nodeCode, p);
    const isEditing = editingCell?.nodeCode === nodeCode && editingCell?.period === p;
    
    return (
      <td className="px-4 py-4 text-center border-r border-slate-100 relative">
        <div 
          onClick={() => setEditingCell({nodeCode, period: p})}
          className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center mx-auto transition-all cursor-pointer hover:ring-2 hover:ring-blue-200 ${status === 'Y' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-300'}`}
        >
          {status}
        </div>
        {isEditing && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setEditingCell(null)} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg py-1 w-44 z-50">
              <button 
                className="w-full px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 text-left"
                onClick={(e) => { e.stopPropagation(); handleStatusChange(nodeCode, p, status === 'Y' ? 'N' : 'Y', false); }}
              >
                {status === 'Y' ? '设为无效' : '设为有效'}
              </button>
              <button 
                className="w-full px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 text-left"
                onClick={(e) => { e.stopPropagation(); handleStatusChange(nodeCode, p, status === 'Y' ? 'N' : 'Y', true); }}
              >
                {status === 'Y' ? '此期间及以后设为无效' : '此期间及以后设为有效'}
              </button>
            </div>
          </>
        )}
      </td>
    );
  };

  // Definition Module States
  const [hideSystemFields, setHideSystemFields] = useState(false);

  // Subset Module States
  const [subsetSearch, setSubsetSearch] = useState('');
  const [subsetUserFilter, setSubsetUserFilter] = useState('All');
  const [poolSearch, setPoolSearch] = useState('');
  const [selectedSearch, setSelectedSearch] = useState('');

  // Initial Modal States
  const [showNewDimensionModal, setShowNewDimensionModal] = useState(true);
  const [selectedDimensionType, setSelectedDimensionType] = useState<string | null>(null);

  const togglePeriod = (p: number) => {
    setPov(prev => ({
      ...prev,
      periods: prev.periods.includes(p) 
        ? prev.periods.filter(item => item !== p).sort((a,b) => a-b)
        : [...prev.periods, p].sort((a,b) => a-b)
    }));
  };

  const handleExecuteQuery = () => {
    setIsQuerying(true);
    setTimeout(() => {
      setIsQuerying(false);
    }, 1000);
  };

  const renderTreeView = () => (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-72 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input 
                placeholder="搜索成员..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-[12px] outline-none focus:border-blue-500"
              />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50"><Filter size={14}/></button>
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-[12px] text-slate-600 hover:bg-slate-50 transition-all font-medium">
            <Plus size={14}/> 添加层级节点
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {INITIAL_DIMENSION_TREE.map(node => (
            <TreeItem key={node.id} node={node} depth={0} onSelect={setSelectedNode} selectedId={selectedNode?.id} />
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
        <div className="h-12 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
           <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] rounded-lg hover:bg-slate-50">
                <Upload size={14} /> 批量导入
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] rounded-lg hover:bg-slate-50">
                <Download size={14} /> 结构导出
              </button>
           </div>
           <div className="flex items-center gap-4 text-slate-400">
              <button className="hover:text-slate-600"><RefreshCw size={15}/></button>
              <button className="hover:text-slate-600"><Clock size={15}/></button>
           </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {selectedNode ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                <Database size={18} className="text-blue-500" /> 编辑成员: {selectedNode.code}
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm grid grid-cols-2 gap-x-10 gap-y-5">
                {[
                  { label: '编码 (Code)', value: selectedNode.code, readOnly: true },
                  { label: '安全类 (UD1)', isSelect: true, options: ['安全类1', '安全类2'] },
                  { label: '名称 (Name)', value: selectedNode.name, isIcon: true, icon: Globe },
                  { label: '是否母公司 (UD2)', placeholder: '请输入' },
                  { label: '父级 (Parent)', value: '#root', readOnly: true },
                  { label: '本位币 (Currency)', isSelect: true, options: ['CNY - 人民币', 'USD - 美元'] }
                ].map((field, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-bold uppercase">{field.label}</label>
                    {field.isSelect ? (
                      <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-100">
                        {field.options?.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <div className="relative">
                        <input 
                          defaultValue={field.value} 
                          readOnly={field.readOnly}
                          placeholder={field.placeholder}
                          className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-100 ${field.readOnly ? 'bg-slate-50 text-slate-500' : 'bg-white'}`} 
                        />
                        {field.isIcon && field.icon && <field.icon size={14} className="absolute right-3 top-2.5 text-slate-300" />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <div className="p-10 bg-white rounded-full border border-dashed border-slate-200 mb-4 shadow-sm">
                <Info size={40} />
              </div>
              <p className="text-[14px]">请从左侧树形结构中选择一个成员进行编辑</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );

  const renderTableView = () => (
    <div className="flex flex-1 flex-col bg-white overflow-hidden">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] rounded-lg hover:bg-slate-50 font-medium"><Plus size={14} /> 添加行</button>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] rounded-lg hover:bg-slate-50 font-medium"><X size={14} /> 删除行</button>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] rounded-lg hover:bg-slate-50"><Upload size={14} /> 导入</button>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] rounded-lg hover:bg-slate-50"><Download size={14} /> 导出</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
            <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3 border-r border-slate-100 w-12 text-center">序号</th>
              <th className="px-4 py-3 border-r border-slate-100">编码 <Filter size={10} className="inline ml-1"/></th>
              <th className="px-4 py-3 border-r border-slate-100">父级编码 <Filter size={10} className="inline ml-1"/></th>
              <th className="px-4 py-3 border-r border-slate-100">名称(English) <Filter size={10} className="inline ml-1"/></th>
              <th className="px-4 py-3 border-r border-slate-100">名称(中文简体) <Filter size={10} className="inline ml-1"/></th>
              <th className="px-4 py-3 border-r border-slate-100">比重 <Filter size={10} className="inline ml-1"/></th>
              <th className="px-4 py-3 border-r border-slate-100 text-center">是否有效</th>
              <th className="px-4 py-3 border-r border-slate-100">本位币</th>
              <th className="px-4 py-3">是否母公司</th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-slate-600 divide-y divide-slate-100">
            {TABLE_DATA.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-2 border-r border-slate-100 text-center text-slate-400">{i + 1}</td>
                <td className="px-4 py-2 border-r border-slate-100 font-medium text-slate-800">{row.code}</td>
                <td className="px-4 py-2 border-r border-slate-100 font-mono text-slate-400">{row.parent}</td>
                <td className="px-4 py-2 border-r border-slate-100">{row.nameEn}</td>
                <td className="px-4 py-2 border-r border-slate-100">{row.nameCn}</td>
                <td className="px-4 py-2 border-r border-slate-100">{row.weight}</td>
                <td className="px-4 py-2 border-r border-slate-100 text-center">
                  <span className={row.active === 'Y' ? 'text-green-600 font-bold' : ''}>{row.active}</span>
                </td>
                <td className="px-4 py-2 border-r border-slate-100">{row.currency}</td>
                <td className="px-4 py-2 text-center">
                  <span className={row.ud2 === 'Y' ? 'text-blue-600 font-bold' : ''}>{row.ud2}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTemporalView = () => (
    <div className="flex flex-1 overflow-hidden">
      {/* POV Side Panel */}
      <aside className="w-72 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-[12px] font-bold text-slate-700">查询 POV 设置</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">业务场景</label>
            <select 
              value={pov.scenario}
              onChange={(e) => setPov({...pov, scenario: e.target.value as any})}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100"
            >
              {SCENARIOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">版本选择</label>
            <select 
              value={pov.version}
              onChange={(e) => setPov({...pov, version: e.target.value as any})}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100"
            >
              {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Clock size={12}/> 年份多选</label>
            <div className="flex flex-wrap gap-2">
              {YEARS.map(y => (
                <button 
                  key={y} 
                  onClick={() => setPov(prev => ({ ...prev, years: prev.years.includes(y) ? prev.years.filter(item => item !== y) : [...prev.years, y] }))}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors ${pov.years.includes(y) ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-50' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">期间多选</label>
            <div className="grid grid-cols-4 gap-2">
              {PERIODS.map(p => (
                <button 
                  key={p} 
                  onClick={() => togglePeriod(p)}
                  className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all ${pov.periods.includes(p) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleExecuteQuery}
            disabled={isQuerying}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50 transition-all"
          >
            {isQuerying ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
            {isQuerying ? '查询中...' : '执行查询'}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 bg-slate-50/30 overflow-hidden flex flex-col relative">
        {isBatchEditing && (
           <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-md z-[60] flex flex-col p-10 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Editing Mode</span>
                    <h2 className="text-[18px] font-bold text-slate-800">层级关系批量维护</h2>
                 </div>
                 <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 text-red-500 text-[13px] font-bold hover:bg-red-50 rounded-lg"><Trash2 size={16}/> 移除行</button>
                    <button onClick={() => setIsBatchEditing(false)} className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 hover:bg-slate-50">取消修改</button>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[13px] font-bold flex items-center gap-2 shadow-lg shadow-blue-100"><Save size={16}/> 提交更改</button>
                 </div>
              </div>
              <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
                       <tr>
                          <th className="p-4 w-12 text-center opacity-40">#</th>
                          <th className="p-4">Member Name <Filter size={10} className="inline ml-1 opacity-50"/></th>
                          <th className="p-4">Parent Name <Filter size={10} className="inline ml-1 opacity-50"/></th>
                          <th className="p-4">Year <Filter size={10} className="inline ml-1 opacity-50"/></th>
                          <th className="p-4">Period <Filter size={10} className="inline ml-1 opacity-50"/></th>
                          <th className="p-4">Scenario <Filter size={10} className="inline ml-1 opacity-50"/></th>
                          <th className="p-4">Version <Filter size={10} className="inline ml-1 opacity-50"/></th>
                          <th className="p-4 text-center">Status <Filter size={10} className="inline ml-1 opacity-50"/></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[12px]">
                       {[
                         { code: 'GROUP_TOTAL', parent: 'None', status: 'Y' },
                         { code: 'CHINA_CORP', parent: 'GROUP_TOTAL', status: 'Y' },
                         { code: 'BJ_OFFICE', parent: 'CHINA_CORP', status: 'Y' },
                         { code: 'SH_OFFICE', parent: 'CHINA_CORP', status: 'Y' },
                         { code: 'SZ_R_D', parent: 'CHINA_CORP', status: 'N' },
                         { code: 'EUROPE_DIV', parent: 'GROUP_TOTAL', status: 'N' },
                         { code: 'UK_BR', parent: 'EUROPE_DIV', status: 'N' },
                       ].map((m, i) => (
                         <tr key={i} className="hover:bg-slate-50">
                            <td className="p-4 text-slate-300 text-center font-mono">{(i+1).toString().padStart(2, '0')}</td>
                            <td className="p-4"><div className="border border-slate-200 rounded-lg px-3 py-1.5 flex justify-between items-center font-bold text-slate-700">{m.code} <ChevronDown size={14} className="text-slate-300"/></div></td>
                            <td className="p-4"><div className="border border-slate-200 rounded-lg px-3 py-1.5 flex justify-between items-center text-slate-500">{m.parent} <ChevronDown size={14} className="text-slate-300"/></div></td>
                            <td className="p-4"><div className="border border-slate-200 rounded-lg px-3 py-1.5 text-center bg-slate-50">2024</div></td>
                            <td className="p-4"><div className="border border-slate-200 rounded-lg px-3 py-1.5 text-center bg-slate-50">1</div></td>
                            <td className="p-4"><div className="border border-slate-200 rounded-lg px-3 py-1.5 text-center bg-slate-50">Actual</div></td>
                            <td className="p-4"><div className="border border-slate-200 rounded-lg px-3 py-1.5 text-center bg-slate-50">Working</div></td>
                            <td className="p-4 text-center"><span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] ${m.status === 'Y' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>{m.status}</span></td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {isQuerying && (
           <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-2xl border flex flex-col items-center gap-4">
                 <Loader2 size={40} className="text-blue-600 animate-spin"/>
                 <p className="text-[14px] font-bold text-slate-700 animate-pulse">正在同步多维实效性数据...</p>
              </div>
           </div>
        )}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
          <header className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Preview Mode</span>
               <h3 className="text-[14px] font-bold text-slate-800">多维实体时效性视图</h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowOnlyActive(!showOnlyActive)}
                className={`px-4 py-1.5 text-[12px] border rounded-lg flex items-center gap-2 transition-all font-medium ${showOnlyActive ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {showOnlyActive ? <EyeOff size={14}/> : <Eye size={14}/>}
                {showOnlyActive ? '仅看有效关系' : '显示所有关系'}
              </button>
              <button onClick={() => setIsBatchEditing(true)} className="px-4 py-1.5 text-[12px] bg-slate-900 text-white rounded-lg flex items-center gap-2 font-bold hover:bg-slate-800 transition-colors">
                <Edit3 size={14}/> 批量编辑
              </button>
            </div>
          </header>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-[12px] font-bold text-slate-500 border-r border-slate-100 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">实体层级 (代码与名称)</th>
                  {pov.periods.map(p => (
                    <th key={p} className="px-4 py-4 text-center text-[12px] font-bold text-blue-600 min-w-[100px] border-r border-slate-100">2024-{p.toString().padStart(2, '0')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 <tr className="bg-slate-50/50">
                   <td className="px-6 py-3 flex items-center gap-2 sticky left-0 bg-slate-50 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                     <Network size={14} className="text-blue-500"/><span className="text-[12px] font-bold text-slate-800">默认组织视图 (DEFAULT_ORG)</span>
                   </td>
                   {pov.periods.map(p => <td key={p} className="border-r border-slate-100"></td>)}
                 </tr>
                 {INITIAL_DIMENSION_TREE.map(node => (
                   <React.Fragment key={node.id}>
                     <tr className="group hover:bg-slate-50">
                       <td className="px-6 py-4 flex items-center gap-2 pl-8 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                         <ChevronDown size={14} className="text-slate-300"/>
                         <div>
                           <div className="text-[12px] font-bold text-slate-700">{node.code}</div>
                           <div className="text-[10px] text-slate-400">{node.name}</div>
                         </div>
                       </td>
                       {pov.periods.map(p => (
                         <TemporalCell key={p} nodeCode={node.code} p={p} />
                       ))}
                     </tr>
                     {node.children.map(child => (
                       <React.Fragment key={child.id}>
                         <tr className="group hover:bg-slate-50">
                           <td className="px-6 py-4 flex items-center gap-2 pl-14 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                             <ChevronDown size={14} className="text-slate-300"/>
                             <div><div className="text-[12px] font-bold text-slate-700">{child.code}</div><div className="text-[10px] text-slate-400">{child.name}</div></div>
                           </td>
                           {pov.periods.map(p => (
                             <TemporalCell key={p} nodeCode={child.code} p={p} />
                           ))}
                         </tr>
                         {child.children.map(leaf => {
                            const isCurrentlyActive = pov.periods.some(p => getStatus(leaf.code, p) === 'Y');

                            if (showOnlyActive && !isCurrentlyActive) return null;

                            return (
                              <tr key={leaf.id} className="group hover:bg-slate-50">
                                <td className="px-6 py-4 flex items-center gap-2 pl-20 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                  <div><div className="text-[12px] font-bold text-slate-700">{leaf.code}</div><div className="text-[10px] text-slate-400 italic">
                                    {leaf.code === 'BJ_OFFICE' && '长期有效'}
                                    {leaf.code === 'SH_OFFICE' && '2024年6月后注销'}
                                    {leaf.code === 'SZ_R_D' && '2024年3月新设'}
                                  </div></div>
                                </td>
                                {pov.periods.map(p => (
                                  <TemporalCell key={p} nodeCode={leaf.code} p={p} />
                                ))}
                              </tr>
                            );
                         })}
                       </React.Fragment>
                     ))}
                   </React.Fragment>
                 ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );

  const renderDefinitionView = () => (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-[11px] font-bold text-slate-400 px-3 py-2 uppercase tracking-widest">维度结构</div>
          {[
            { id: 'ud', label: '自定义属性 (UD)', icon: FileText },
            { id: 'sync', label: '与 DeepModel 同步', icon: RefreshCw }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setDefSubModule(item.id as any)}
              className={`w-full text-left px-4 py-2.5 text-[13px] rounded-lg flex items-center gap-3 transition-all ${defSubModule === item.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <item.icon size={16}/> {item.label}
            </button>
          ))}
          
          <div className="h-4" />
          <div className="text-[11px] font-bold text-slate-400 px-3 py-2 uppercase tracking-widest">元素设置</div>
          <button 
            onClick={() => setDefSubModule('advanced')}
            className={`w-full text-left px-4 py-2.5 text-[13px] rounded-lg flex items-center gap-3 transition-all ${defSubModule === 'advanced' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings size={16}/> 基础设置
          </button>
        </div>
      </aside>
      
      <main className="flex-1 p-8 bg-slate-50/30 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-6">
          {defSubModule === 'ud' && (
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
                  <h3 className="text-[15px] font-bold flex items-center gap-2"><TableIcon size={18} className="text-blue-500"/> 自定义 UD 字段定义</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setHideSystemFields(!hideSystemFields)}
                      className={`px-4 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${hideSystemFields ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {hideSystemFields ? '显示所有字段' : '隐藏预置字段'}
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold shadow-md shadow-blue-50 hover:bg-blue-700 transition-colors">添加新 UD</button>
                  </div>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                       <th className="px-6 py-4">字段编码 / 名称</th>
                       <th className="px-6 py-4">属性类型</th>
                       <th className="px-6 py-4">物理存储绑定</th>
                       <th className="px-6 py-4">数据类型</th>
                       <th className="px-6 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {INITIAL_UD_FIELDS.filter(f => !hideSystemFields || !['ud-1', 'ud-4'].includes(f.id)).map((field, idx) => (
                      <tr key={field.id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => setSelectedField(field)}>
                        <td className="px-6 py-4">
                          <div className="text-[13px] font-bold text-slate-700">{field.name}</div><div className="text-[11px] text-slate-400">{field.logicalName}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${['ud-1', 'ud-4'].includes(field.id) ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-500'}`}>
                              {['ud-1', 'ud-4'].includes(field.id) ? '预置属性' : '用户属性'}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500 text-[12px]">{field.physicalBinding}</td>
                        <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-600 uppercase tracking-tighter">{field.type}</span></td>
                        <td className="px-6 py-4"><MoreHorizontal size={14} className="text-slate-300 group-hover:text-slate-500"/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}

          {defSubModule === 'sync' && (
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><RefreshCw size={24}/></div>
                   <div><h3 className="text-[16px] font-bold">DeepModel 映射同步引擎</h3><p className="text-[12px] text-slate-400 mt-1">维度逻辑层与物理数据层的映射同步</p></div>
                 </div>
                 <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"><RefreshCw size={18}/> 启动全量同步</button>
               </div>
               <div className="p-8 space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2"><label className="text-[11px] font-bold text-slate-400 uppercase">来源同步对象</label><select className="w-full border rounded-xl px-4 py-2.5 text-[14px] font-medium bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-100"><option>DeepModel_Entity_Master_V2</option></select></div>
                    <div className="space-y-2"><label className="text-[11px] font-bold text-slate-400 uppercase">同步策略</label><select className="w-full border rounded-xl px-4 py-2.5 text-[14px] font-medium bg-white outline-none focus:ring-2 focus:ring-blue-100"><option>全量同步 (Full Sync)</option></select></div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-[13px] font-bold flex items-center justify-between">映射规则预览 <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full">已映射 {MAPPING_FIELDS.length} 个字段</span></h4>
                    <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm"><table className="w-full text-left text-[12px]"><thead className="bg-slate-50/50 font-bold text-slate-500"><tr><th className="p-4">本地维度字段</th><th className="p-4">DeepModel 来源字段</th></tr></thead><tbody className="divide-y divide-slate-50">{MAPPING_FIELDS.map((m,i) => <tr key={i} className="hover:bg-slate-50 transition-colors"><td className="p-4 font-bold text-slate-700">{m.sourceName}</td><td className="p-4"><div className="bg-white border rounded px-3 py-1.5 flex justify-between items-center group cursor-pointer">{m.targetMapping} <ExternalLink size={10} className="text-slate-300 group-hover:text-blue-500"/></div></td></tr>)}</tbody></table></div>
                 </div>
                 <div className="space-y-4 pt-4">
                    <h4 className="text-[13px] font-bold flex items-center gap-2 text-slate-400"><History size={16}/> 最近同步记录</h4>
                    <div className="space-y-2">
                       {SYNC_HISTORY.map(rec => (
                          <div key={rec.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                             <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${rec.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{rec.status === 'SUCCESS' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}</div>
                                <div><div className="text-[12px] font-bold text-slate-700">{rec.time}</div><div className="text-[10px] text-slate-400">操作人: {rec.executor}</div></div>
                             </div>
                             <div className="text-right"><div className="text-[12px] font-bold text-slate-800">{rec.count} 条记录</div><div className={`text-[10px] font-bold ${rec.status === 'SUCCESS' ? 'text-green-500' : 'text-red-500'}`}>{rec.status === 'SUCCESS' ? '同步成功' : '失败'}</div></div>
                          </div>
                       ))}
                    </div>
                 </div>
               </div>
             </div>
          )}

          {defSubModule === 'advanced' && (
             <div className="grid grid-cols-[300px,1fr] gap-6 items-start">
                {/* Element Info - Entity */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-8">
                   <h3 className="text-[14px] font-bold border-b pb-4">元素配置 - Entity</h3>
                   <div className="space-y-4">
                      <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400">编码</label><input disabled defaultValue="Entity" className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-[13px] text-slate-400 font-mono"/></div>
                      <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400">名称(English)</label><input className="w-full border rounded-lg px-3 py-1.5 text-[13px]"/></div>
                      <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400">名称(中文简体)</label><input defaultValue="实体" className="w-full border rounded-lg px-3 py-1.5 text-[13px]"/></div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">类型</label>
                        <select className="w-full border rounded-lg px-3 py-1.5 text-[13px]"><option>3 - 实体类</option></select>
                      </div>
                      <div className="flex items-center justify-between"><span className="text-[12px] font-medium text-slate-600">启用层级管理</span><Toggle active={true} onChange={()=>{}}/></div>
                   </div>
                   <div className="pt-4 space-y-4 border-t border-slate-50">
                      <div className="flex items-center justify-between text-[12px] font-bold text-slate-700">引用关系管理 <Edit3 size={14} className="text-slate-300 cursor-pointer hover:text-blue-500"/></div>
                      <div className="text-[11px] text-slate-400 italic">暂无外部应用引用此维度</div>
                   </div>
                </div>

                <div className="space-y-6 flex flex-col min-h-0">
                  {/* Version & Governance dimensions */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-[15px] font-bold flex items-center gap-2"><Clock size={18} className="text-blue-600"/> 版本与管控维管理</h3>
                        <button className="text-[11px] text-blue-500 font-bold hover:underline flex items-center gap-1"><Copy size={12}/> 复制到其他版本</button>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2"><label className="text-[13px] font-bold text-slate-700">实体激活表默认有效性</label><HelpCircle size={14} className="text-slate-300"/></div>
                          <div className="flex p-1 bg-slate-100 rounded-xl w-64">
                            <button className="flex-1 py-1.5 rounded-lg text-[12px] font-bold text-blue-600 bg-white shadow-sm border border-slate-200">无效</button>
                            <button className="flex-1 py-1.5 rounded-lg text-[12px] font-bold text-slate-400">有效</button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                          {[
                            { label: '管控维 - 年份', code: 'Year' },
                            { label: '管控维 - 期间', code: 'Period' },
                            { label: '管控维 - 版本', code: 'Version' },
                            { label: '管控维 - 场景', code: 'Scenario' }
                          ].map((v, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-[13px] font-bold text-slate-800">{v.label}</span>
                                  <Toggle active={true} onChange={()=>{}}/>
                                </div>
                                <div className="relative">
                                  <input defaultValue={v.code} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-[14px] pr-10 outline-none focus:ring-2 focus:ring-blue-100"/>
                                  <FolderOpen size={16} className="absolute right-3 top-2.5 text-blue-500"/>
                                </div>
                                <div className="flex items-center justify-between text-[11px] px-1">
                                  <span className="text-slate-400">子类型: {i % 2 === 0 ? '期间类' : '年份类'}</span>
                                  <span className="text-slate-400 flex items-center gap-1 cursor-pointer hover:text-blue-500">路径: .../doc <ExternalLink size={10}/></span>
                                </div>
                            </div>
                          ))}
                        </div>
                    </div>
                  </div>

                  {/* Core Global Settings */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm grid grid-cols-2 gap-12">
                     <div className="space-y-6">
                        <h4 className="text-[15px] font-bold border-b pb-4 flex justify-between items-center text-slate-700">基础属性控制 <Settings size={16} className="text-slate-300"/></h4>
                        <div className="space-y-5">
                          <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">本位币维度</label><div className="relative"><input defaultValue="Currency" className="w-full border rounded-xl px-4 py-2.5 text-[13px] bg-slate-50/50 outline-none"/><FolderOpen size={16} className="absolute right-3 top-2.5 text-blue-500"/></div></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">值维度</label><input placeholder="Value" className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-[13px] outline-none"/></div>
                              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">表达式默认场景</label><select className="w-full border rounded-xl px-4 py-2.5 text-[13px] outline-none"><option>纯子结构</option></select></div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white transition-all"><span className="text-[12px] font-medium text-slate-600">默认权限方案 (Security)</span><ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500"/></div>
                        </div>
                     </div>
                     <div className="space-y-6">
                        <h4 className="text-[15px] font-bold border-b pb-4 text-slate-700">核心维度开关</h4>
                        <div className="space-y-4">
                          {[
                            { label: '启用层级管理 (Hierarchy)', active: true },
                            { label: '多场景隔离 (Scenario Isolation)', active: true },
                            { label: '开启多语种翻译支持', active: false },
                            { label: '允许共享成员 (Shared)', active: true }
                          ].map((ctrl, i) => (
                            <div key={i} className="flex items-center justify-between"><span className="text-[13px] font-medium text-slate-600">{ctrl.label}</span><Toggle active={ctrl.active} onChange={()=>{}}/></div>
                          ))}
                          <div className="pt-2 space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">主维度根节点</label>
                            <input defaultValue="GROUP_TOTAL" className="w-full border rounded-xl px-4 py-2 text-[13px] font-mono bg-slate-50/50 outline-none"/>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
             </div>
          )}
        </div>
      </main>
      
      {selectedField && defSubModule === 'ud' && (
        <aside className="w-80 border-l border-slate-200 bg-white p-6 shadow-2xl animate-in slide-in-from-right duration-300 z-30 overflow-y-auto">
          <div className="flex items-center justify-between mb-8 pb-4 border-b">
            <h4 className="text-[14px] font-bold text-slate-800">属性配置: {selectedField.code}</h4>
            <X size={18} className="text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => setSelectedField(null)}/>
          </div>
          <div className="space-y-6">
            <div className="space-y-2"><label className="text-[11px] font-bold text-slate-400 uppercase">名称/标签</label><input defaultValue={selectedField.name} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-100"/></div>
            <div className="space-y-2"><label className="text-[11px] font-bold text-slate-400 uppercase">逻辑映射名称</label><input defaultValue={selectedField.logicalName} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-100"/></div>
            <div className="space-y-2"><label className="text-[11px] font-bold text-slate-400 uppercase">数据类型</label><select className="w-full border border-slate-200 rounded-xl px-4 py-2 text-[13px] outline-none" defaultValue={selectedField.type}><option value="STRING">文本</option><option value="NUMBER">数字</option><option value="LIST">列表</option></select></div>
            {selectedField.type === 'NUMBER' && (
               <div className="p-5 bg-slate-50 rounded-2xl space-y-5 border border-slate-100">
                 <div className="flex items-center justify-between"><span className="text-[12px] font-medium text-slate-600">数值百分比显示</span><Toggle active={selectedField.config?.isPercentage || false} onChange={()=>{}}/></div>
                 <div className="space-y-1.5"><label className="text-[10px] text-slate-400 uppercase font-bold">数字精度 (Scale)</label><input type="number" defaultValue={selectedField.config?.scale || 0} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] outline-none bg-white"/></div>
               </div>
            )}
            <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50 flex flex-col gap-2">
               <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">物理绑定信息</p>
               <code className="text-[11px] font-mono text-blue-700 bg-white p-2 rounded-lg break-all">{selectedField.physicalBinding}</code>
            </div>
          </div>
        </aside>
      )}
    </div>
  );

  const renderSubsetView = () => (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-72 border-r border-slate-200 bg-white flex flex-col shadow-[2px_0_10px_rgba(0,0,0,0.01)] z-10">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <h3 className="text-[15px] font-bold text-slate-800">子集管理器</h3>
             <Plus size={18} className="text-blue-600 cursor-pointer hover:scale-110 transition-transform"/>
          </div>
          <div className="space-y-2">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-300"/>
                <input 
                  placeholder="搜索子集名字..." 
                  value={subsetSearch}
                  onChange={(e) => setSubsetSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-blue-100"
                />
             </div>
             <div className="flex items-center gap-2">
                <Filter size={12} className="text-slate-400"/>
                <select 
                   value={subsetUserFilter}
                   onChange={(e) => setSubsetUserFilter(e.target.value)}
                   className="bg-transparent text-[11px] text-slate-500 font-bold outline-none cursor-pointer"
                >
                   <option value="All">所有用户</option>
                   <option value="Admin">仅管理员</option>
                   <option value="System">仅系统预置</option>
                </select>
             </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
           <div>
             <div className="text-[11px] font-bold text-slate-400 px-3 py-2 uppercase tracking-widest">系统预置子集</div>
             {INITIAL_SUBSETS.filter(s => s.isSystem && s.name.toLowerCase().includes(subsetSearch.toLowerCase())).map(sub => (
               <div 
                 key={sub.id} 
                 onClick={() => setSelectedSubset(sub)}
                 className={`p-3 rounded-xl cursor-pointer transition-all mb-1 ${selectedSubset?.id === sub.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'hover:bg-slate-50'}`}
               >
                 <div className="flex items-center justify-between">
                   <span className="text-[13px] font-medium">{sub.name}</span>
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedSubset?.id === sub.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>{sub.memberCount}</span>
                 </div>
               </div>
             ))}
           </div>
           <div>
             <div className="text-[11px] font-bold text-slate-400 px-3 py-2 uppercase tracking-widest">用户定义子集</div>
             {INITIAL_SUBSETS.filter(s => !s.isSystem && s.name.toLowerCase().includes(subsetSearch.toLowerCase()) && (subsetUserFilter === 'All' || s.createdBy === subsetUserFilter)).map(sub => (
               <div 
                 key={sub.id} 
                 onClick={() => setSelectedSubset(sub)}
                 className={`p-3 rounded-xl cursor-pointer transition-all mb-1 ${selectedSubset?.id === sub.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'hover:bg-slate-50'}`}
               >
                 <div className="flex items-center justify-between">
                   <span className="text-[13px] font-medium">{sub.name}</span>
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedSubset?.id === sub.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>{sub.memberCount}</span>
                 </div>
                 <div className={`text-[10px] mt-1 ${selectedSubset?.id === sub.id ? 'text-blue-100' : 'text-slate-400'}`}>由 {sub.createdBy} 创建</div>
               </div>
             ))}
           </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
        {/* Subset View Toolbar - Matching Page 1 UI */}
        <div className="h-12 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10">
           <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] rounded-lg hover:bg-slate-50">
                <Upload size={14} /> 导入
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] rounded-lg hover:bg-slate-50">
                <Download size={14} /> 导出
              </button>
           </div>
           <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[12px] rounded-lg hover:shadow-sm">
                另存为...
              </button>
              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-[12px] rounded-lg font-bold shadow-sm shadow-blue-100 active:scale-95 transition-transform">
                <Save size={14} /> 保存子集
              </button>
           </div>
        </div>

        <div className="flex-1 p-8 overflow-hidden flex flex-col">
          <div className="max-w-6xl mx-auto w-full h-full flex flex-col gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><FolderTree size={28}/></div>
              <div>
                <h2 className="text-[20px] font-bold text-slate-800">{selectedSubset?.name}</h2>
                <p className="text-[13px] text-slate-400 mt-0.5">{selectedSubset?.description}</p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-[1fr,64px,1fr] gap-4 min-h-0">
              <div className="bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                  <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-[14px] text-slate-700">可用成员池</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dimension Source</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative group">
                          <Search className="absolute left-2.5 top-2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={14}/>
                          <input 
                            placeholder="输入编码或名称搜索..." 
                            value={poolSearch}
                            onChange={(e) => setPoolSearch(e.target.value)}
                            className="pl-8 pr-2 py-1.5 text-[12px] border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-100 w-44 transition-all"
                          />
                        </div>
                        <button className="p-2 border rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Filter size={14}/></button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 overflow-auto space-y-1.5 custom-scrollbar">
                    {TABLE_DATA.filter(m => m.code.toLowerCase().includes(poolSearch.toLowerCase()) || m.nameCn.toLowerCase().includes(poolSearch.toLowerCase())).map((m,i) => (
                      <div key={i} className="px-4 py-3 border border-transparent rounded-2xl text-[13px] hover:bg-slate-50 hover:border-slate-100 transition-all flex items-center justify-between group cursor-pointer font-medium text-slate-600">
                        <span className="flex items-center gap-3">
                            <Plus size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                            <div>
                              <div className="text-[13px] font-bold text-slate-700 group-hover:text-blue-700">{m.code}</div>
                              <div className="text-[10px] text-slate-400">{m.nameCn}</div>
                            </div>
                        </span>
                        <ChevronRight size={14} className="text-slate-200 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"/>
                      </div>
                    ))}
                  </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-6 text-slate-300">
                  <button className="w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm hover:text-blue-600 hover:border-blue-200 hover:shadow-xl transition-all active:scale-90"><ChevronRight size={24}/></button>
                  <button className="w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm hover:text-blue-600 hover:border-blue-200 hover:shadow-xl transition-all active:scale-90"><ChevronLeft size={24}/></button>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                  <div className="p-5 border-b bg-blue-50/20 flex justify-between items-center">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-[14px] text-blue-700">当前已选成员</span>
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Selected Results</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative group">
                          <Search className="absolute left-2.5 top-2 text-blue-300 group-focus-within:text-blue-500 transition-colors" size={14}/>
                          <input 
                            placeholder="在已选中搜索..." 
                            value={selectedSearch}
                            onChange={(e) => setSelectedSearch(e.target.value)}
                            className="pl-8 pr-2 py-1.5 text-[12px] border border-blue-100 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-100 w-44 transition-all"
                          />
                        </div>
                        <button className="text-[11px] font-bold text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors">清空</button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 overflow-auto space-y-2 custom-scrollbar">
                    {['NoEntity', 'TotalEntity'].filter(c => c.toLowerCase().includes(selectedSearch.toLowerCase())).map((code, i) => (
                        <div key={i} className="p-4 bg-blue-50/50 border border-blue-100/50 text-blue-700 rounded-2xl text-[13px] flex items-center justify-between group hover:shadow-md transition-all">
                          <span className="font-bold flex items-center gap-3"><ChevronUp size={14} className="text-blue-200"/> {code}</span>
                          <X size={16} className="text-blue-300 hover:text-red-500 cursor-pointer transition-colors"/>
                        </div>
                    ))}
                  </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden select-none">
      {showNewDimensionModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 pb-6 text-center">
              <h2 className="text-[24px] font-bold text-slate-800">维度类型</h2>
              <p className="text-[14px] text-slate-500 mt-2">请选择您要创建的维度类型，不同类型将提供特定的预置属性与功能</p>
            </div>
            
            <div className="p-8 pt-0 grid grid-cols-4 gap-4">
              {DIMENSION_TYPES.map(type => {
                const isSelected = selectedDimensionType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedDimensionType(type.id)}
                    className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-200 bg-white ${
                      isSelected 
                        ? 'border-blue-500 shadow-[0_8px_30px_rgb(59,130,246,0.12)] scale-[1.02]' 
                        : 'border-transparent shadow-sm hover:shadow-md hover:border-blue-100'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      <type.icon size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className={`text-[15px] font-bold mb-2 ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                      {type.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                      {type.desc}
                    </p>
                  </button>
                );
              })}
            </div>
            
            <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowNewDimensionModal(false)}
                className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                disabled={!selectedDimensionType}
                onClick={() => setShowNewDimensionModal(false)}
                className="px-8 py-2.5 rounded-xl text-[14px] font-bold bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Rail */}
      <nav className="w-[56px] border-r border-slate-200 flex flex-col items-center py-8 gap-8 z-50 bg-white shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        <SideRailItem icon={Database} active={activeModule === 'data'} onClick={() => setActiveModule('data')} label="数据管理" />
        <SideRailItem icon={Layers} active={activeModule === 'definition'} onClick={() => setActiveModule('definition')} label="结构定义" />
        <SideRailItem icon={FolderTree} active={activeModule === 'subset'} onClick={() => setActiveModule('subset')} label="子集管理" />
      </nav>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex flex-col">
              <h1 className="text-[13px] font-bold text-slate-800">
                {activeModule === 'data' && '维度成员主数据管理'}
                {activeModule === 'definition' && '维度模型架构定义中心'}
                {activeModule === 'subset' && '业务子集管理引擎'}
              </h1>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">DIMENSION MASTER AI</span>
            </div>
          </div>

          {activeModule === 'data' ? (
            <div className="flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
              <button onClick={() => setDataView('tree')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${dataView === 'tree' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}><Network size={14}/> 树形视图</button>
              <button onClick={() => setDataView('table')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${dataView === 'table' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}><TableIcon size={14}/> 表格视图</button>
              <button onClick={() => setDataView('temporal')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${dataView === 'temporal' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}><Clock size={14}/> 时效性视图</button>
            </div>
          ) : null}

          <div className="flex items-center gap-3 min-w-[200px] justify-end">
            {activeModule !== 'subset' && (
              <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                <Save size={14}/> 保存所有变更
              </button>
            )}
          </div>
        </header>

        {activeModule === 'data' && (
          <div className="flex-1 flex overflow-hidden">
             {dataView === 'tree' && renderTreeView()}
             {dataView === 'table' && renderTableView()}
             {dataView === 'temporal' && renderTemporalView()}
          </div>
        )}
        {activeModule === 'definition' && renderDefinitionView()}
        {activeModule === 'subset' && renderSubsetView()}
      </div>
    </div>
  );
}
