import { Link } from 'react-router-dom';
import { CheckCircle2, FileText, Shield, Users, Award, Ban } from 'lucide-react';
import { BRAND_NAME } from '../data/brand';

const RULES = [
  {
    icon: Shield,
    title: '学业与身份要求',
    items: [
      '须为本专科 / 研究生在读或毕业不超过 3 年的同学',
      '需完成学校与学号信息认证，保证身份真实可核验',
      'GPA 建议不低于 3.3（或专业排名前 40%），特殊专长可个案评估',
    ],
  },
  {
    icon: Award,
    title: '课程能力证明',
    items: [
      '申请时需填写擅长课程，并提供成绩截图或相关证明',
      '同一门课可设置「一对一」与「一对多」两种辅导方式',
      '平台会按课程维度展示评分，不同课程可有不同分数',
    ],
  },
  {
    icon: Users,
    title: '服务与态度',
    items: [
      '须按时响应答疑，尊重同学隐私与学习节奏',
      '禁止出售盗版资料、替考、代写等违规行为',
      '好评与复购将影响推荐位与收益结算',
    ],
  },
  {
    icon: Ban,
    title: '审核与清退',
    items: [
      '提交申请后由运营审核，通常 1–3 个工作日反馈',
      '虚假材料、恶意刷评、严重投诉可暂停或取消导师资格',
      '清退后相关课程群将关闭新加入入口',
    ],
  },
];

function TutorRulesPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <p className="text-sm text-primary-500 font-medium mb-2">{BRAND_NAME} · 导师规则</p>
        <h1 className="text-3xl font-bold text-neutral-800">严格的学霸入选标准</h1>
        <p className="mt-3 text-neutral-600 leading-relaxed">
          在「{BRAND_NAME}」，导师不是随便报名就能上架。我们希望每一位学霸都能真正帮同学
          <strong className="text-neutral-800"> 学到、得到</strong>，实现能力提升与快速学习。
          请在申请前仔细阅读以下规则。
        </p>
      </div>

      <div className="space-y-6">
        {RULES.map((block) => {
          const Icon = block.icon;
          return (
            <section key={block.title} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-500" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-800">{block.title}</h2>
              </div>
              <ul className="space-y-3">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-neutral-600">
                    <CheckCircle2 className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="rounded-2xl bg-neutral-900 text-white p-6 md:p-8">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-primary-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg mb-2">申请流程</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-300">
              <li>注册并完善学校、专业信息</li>
              <li>提交导师申请（真实姓名、GPA、擅长课程）</li>
              <li>等待审核通过后，创建课程群并上架辅导</li>
              <li>按课程积累评分，进入首页对应分类推荐</li>
            </ol>
          </div>
        </div>
        <Link
          to="/tutor/apply"
          className="inline-flex mt-6 px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
        >
          我已了解，去申请
        </Link>
      </section>
    </div>
  );
}

export default TutorRulesPage;
