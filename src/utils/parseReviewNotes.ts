/** 百炼约定输出：复习重点与考点 JSON */

export interface ReviewStepItem {
  step?: string;
  content?: string;
}

export interface ReviewTopicItem {
  id?: string;
  topic?: string;
  tag?: string;
  points?: string[];
}

export interface ReviewTableRow {
  concept?: string;
  understanding?: string;
  exam_note?: string;
}

export interface ReviewSection {
  title?: string;
  items?: Array<ReviewStepItem & ReviewTopicItem>;
  table_headers?: string[];
  table_rows?: ReviewTableRow[];
}

export interface ReviewNotesDoc {
  section_1?: ReviewSection;
  section_2?: ReviewSection;
  section_3?: ReviewSection;
  section_4?: ReviewSection;
  [key: string]: ReviewSection | undefined;
}

export interface MindNode {
  id: string;
  label: string;
  detail?: string;
  tag?: string;
  children?: MindNode[];
}

function stripCodeFence(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return text.trim();
}

/** 解析约定格式；失败返回 null */
export function parseReviewNotesJson(raw: string | null | undefined): ReviewNotesDoc | null {
  if (!raw?.trim()) return null;
  try {
    const data = JSON.parse(stripCodeFence(raw));
    if (!data || typeof data !== 'object') return null;
    if (!data.section_1 && !data.section_2 && !data.section_3 && !data.section_4) {
      return null;
    }
    return data as ReviewNotesDoc;
  } catch {
    return null;
  }
}

function sectionKeys(doc: ReviewNotesDoc): string[] {
  const ordered = ['section_1', 'section_2', 'section_3', 'section_4'];
  const extras = Object.keys(doc).filter((k) => k.startsWith('section_') && !ordered.includes(k));
  return [...ordered.filter((k) => doc[k]), ...extras.sort()];
}

function mapSectionToNode(key: string, section: ReviewSection, idx: number): MindNode {
  const children: MindNode[] = [];

  if (Array.isArray(section.items)) {
    section.items.forEach((item, i) => {
      if (item.step) {
        children.push({
          id: `${key}-step-${i}`,
          label: item.step,
          detail: item.content || undefined,
        });
        return;
      }
      if (item.topic) {
        const pointNodes = (item.points || []).map((p, pi) => ({
          id: `${key}-topic-${i}-p-${pi}`,
          label: p,
        }));
        children.push({
          id: `${key}-topic-${i}`,
          label: item.id ? `${item.id} ${item.topic}` : item.topic,
          tag: item.tag,
          children: pointNodes.length ? pointNodes : undefined,
          detail: !pointNodes.length && item.content ? item.content : undefined,
        });
      }
    });
  }

  if (Array.isArray(section.table_rows)) {
    section.table_rows.forEach((row, i) => {
      const parts = [row.understanding, row.exam_note].filter(Boolean);
      children.push({
        id: `${key}-row-${i}`,
        label: row.concept || `知识点 ${i + 1}`,
        detail: parts.join('\n'),
      });
    });
  }

  return {
    id: key,
    label: section.title || `章节 ${idx + 1}`,
    children: children.length ? children : undefined,
  };
}

/** 将约定 JSON 转为思维导图树 */
export function reviewNotesToMindTree(
  doc: ReviewNotesDoc,
  rootLabel = '复习重点与考点'
): MindNode {
  const keys = sectionKeys(doc);
  return {
    id: 'root',
    label: rootLabel,
    children: keys.map((key, idx) => mapSectionToNode(key, doc[key]!, idx)),
  };
}
