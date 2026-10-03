import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, GitBranch } from 'lucide-react';
import {
  parseReviewNotesJson,
  reviewNotesToMindTree,
  type MindNode,
} from '../utils/parseReviewNotes';

interface ReviewMindMapProps {
  raw: string;
  courseName?: string;
}

const BRANCH_COLORS = [
  { border: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-800', line: '#7dd3fc' },
  { border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-800', line: '#c4b5fd' },
  { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-900', line: '#fcd34d' },
  { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-800', line: '#6ee7b7' },
];

function LeafCard({
  node,
  depth,
  colorIdx,
}: {
  node: MindNode;
  depth: number;
  colorIdx: number;
}) {
  const [open, setOpen] = useState(depth < 2);
  const hasKids = !!(node.children && node.children.length);
  const hasDetail = !!node.detail;
  const color = BRANCH_COLORS[colorIdx % BRANCH_COLORS.length];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (hasKids || hasDetail) && setOpen((v) => !v)}
        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-shadow hover:shadow-sm ${
          depth === 0
            ? `${color.bg} ${color.border}`
            : depth === 1
              ? 'bg-white border-neutral-200'
              : 'bg-neutral-50 border-neutral-100'
        }`}
      >
        <div className="flex items-start gap-2">
          {(hasKids || hasDetail) && (
            <span className="mt-0.5 text-neutral-400 flex-shrink-0">
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-medium leading-snug ${
                  depth === 0 ? color.text : 'text-neutral-800'
                }`}
              >
                {node.label}
              </span>
              {node.tag && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-600 border border-rose-100">
                  {node.tag}
                </span>
              )}
            </div>
            {open && hasDetail && (
              <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {node.detail}
              </p>
            )}
          </div>
        </div>
      </button>

      {open && hasKids && (
        <div className="mt-2 ml-3 pl-3 border-l-2 border-dashed border-neutral-200 space-y-2">
          {node.children!.map((child) => (
            <LeafCard key={child.id} node={child} depth={depth + 1} colorIdx={colorIdx} />
          ))}
        </div>
      )}
    </div>
  );
}

function MindMapBranches({ tree }: { tree: MindNode }) {
  const branches = tree.children || [];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px] flex items-stretch gap-0 py-2">
        {/* 根节点 */}
        <div className="flex items-center pr-2 flex-shrink-0">
          <div className="w-36 rounded-2xl bg-primary-500 text-white px-4 py-5 text-center shadow-md">
            <GitBranch className="w-5 h-5 mx-auto mb-2 opacity-90" />
            <p className="text-sm font-semibold leading-snug">{tree.label}</p>
          </div>
        </div>

        {/* 主干连接 */}
        <div className="flex items-center flex-shrink-0 w-6">
          <div className="w-full h-0.5 bg-primary-300" />
        </div>

        {/* 分支列 */}
        <div className="relative flex-1 grid grid-cols-2 xl:grid-cols-4 gap-3">
          {/* 垂直总线视觉 */}
          <div
            className="pointer-events-none absolute left-0 top-[12%] bottom-[12%] w-0.5 bg-primary-200"
            aria-hidden
          />
          {branches.map((branch, idx) => {
            const color = BRANCH_COLORS[idx % BRANCH_COLORS.length];
            return (
              <div key={branch.id} className="relative pl-4">
                <div
                  className="absolute left-0 top-6 w-4 h-0.5"
                  style={{ backgroundColor: color.line }}
                  aria-hidden
                />
                <LeafCard node={branch} depth={0} colorIdx={idx} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ReviewMindMap({ raw, courseName }: ReviewMindMapProps) {
  const parsed = useMemo(() => parseReviewNotesJson(raw), [raw]);
  const tree = useMemo(() => {
    if (!parsed) return null;
    return reviewNotesToMindTree(parsed, courseName?.trim() || '复习重点与考点');
  }, [parsed, courseName]);

  if (!tree) {
    return (
      <div className="rounded-xl bg-primary-50/40 border border-primary-100 p-4">
        <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">
          {raw}
        </pre>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-100 bg-gradient-to-br from-white via-primary-50/30 to-sky-50/40 p-4 md:p-5">
      <p className="text-xs text-neutral-500 mb-4">点击节点可展开 / 收起子节点与要点</p>
      <MindMapBranches tree={tree} />
    </div>
  );
}
