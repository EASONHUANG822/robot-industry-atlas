# 网站精简与支付接入 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除 3 个冗余信息页面，将精华内容合并至 Foundation 页面，合并报名/支付流程为统一入口，精简导航和页脚，预留支付 API 骨架。

**Architecture:** 页面级改动为主，不触及数据层或设计系统。翻译文件需要大量重组织：删除 5 个命名空间，将 Innovation/Collaboration 的关键模块迁移至 FoundationPage 命名空间下。ApplicationForm 组件增加 successHref prop 以适配新的支付页集成。

**Tech Stack:** Next.js 15 App Router, next-intl v4, Tailwind CSS 3, TypeScript

---

### Task 1: 删除冗余页面文件

**Files:**
- Delete: `src/app/[locale]/innovation/page.tsx`
- Delete: `src/app/[locale]/collaboration/page.tsx`
- Delete: `src/app/[locale]/partners/page.tsx`
- Delete: `src/app/[locale]/apply/page.tsx`
- Delete: `src/app/[locale]/apply/success/page.tsx`

- [ ] **Step 1: 删除五个页面文件**

```bash
rm src/app/\[locale\]/innovation/page.tsx
rm src/app/\[locale\]/collaboration/page.tsx
rm src/app/\[locale\]/partners/page.tsx
rm src/app/\[locale\]/apply/page.tsx
rm src/app/\[locale\]/apply/success/page.tsx
```

- [ ] **Step 2: 清理空目录**

```bash
rmdir src/app/\[locale\]/innovation 2>/dev/null || true
rmdir src/app/\[locale\]/collaboration 2>/dev/null || true
rmdir src/app/\[locale\]/partners 2>/dev/null || true
rmdir src/app/\[locale\]/apply/success 2>/dev/null || true
rmdir src/app/\[locale\]/apply 2>/dev/null || true
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: remove innovation, collaboration, partners, and apply pages
EOF
)"
```

---

### Task 2: 更新翻译文件 — 删除废弃命名空间

**Files:**
- Modify: `messages/zh.json`
- Modify: `messages/en.json`

- [ ] **Step 1: 从两个翻译文件中删除废弃命名空间**

需要删除的命名空间（在两个文件中各删除对应区块）：
- `InnovationPage`
- `CollaborationPage`
- `PartnersPage`
- `ApplyPage`
- `ApplySuccessPage`

同时删除不再使用的命名空间（这些内容仅在被删页面中使用，无其他引用）：
- `LandingMap`
- `Map`
- `CategoryLegend`
- `Sidebar`

另外删除 `Footer` 命名空间中的废弃 key（将在 Task 5 中重建 Footer 翻译）：
- `colRobotValley`
- `home`
- `robotValley`
- `applyToVisit`
- `partners`
- `mediaInquiry`
- `partnersTitle`
- `followUs`

以及 `Header` 命名空间中不再需要的 key：
- `map`
- `directory`
- `about`
- `partners`
- `foundation`
- `innovation`
- `collaboration`

操作方式：使用文本编辑器，在每个 JSON 文件中定位并删除上述 key 对应的完整 JSON 对象。以 `messages/zh.json` 为例，删除从 `"LandingMap"` 开始的整个顶层 key（含其所有子内容），共删除 8 个顶层命名空间。

```bash
# 验证 JSON 文件仍然有效
node -e "JSON.parse(require('fs').readFileSync('messages/zh.json','utf8'))" && echo "zh.json valid"
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))" && echo "en.json valid"
```

- [ ] **Step 2: 提交**

```bash
git add messages/zh.json messages/en.json
git commit -m "$(cat <<'EOF'
feat: remove deprecated i18n namespaces for deleted pages
EOF
)"
```

---

### Task 3: 向 FoundationPage 翻译命名空间添加被删页面精选内容

**Files:**
- Modify: `messages/zh.json`
- Modify: `messages/en.json`

- [ ] **Step 1: 在 `FoundationPage` 命名空间中添加新模块的翻译 key**

在 `messages/zh.json` 的 `FoundationPage` 对象中，需新增以下四个模块（内容从已删除的 `InnovationPage` 和 `CollaborationPage` 中原样复制，仅改 namespace）：

**新增 `platforms`（来自 InnovationPage.platforms）：**

```json
"platforms": {
  "title": "核心创新平台",
  "description": "多个国家级与省级创新平台扎根深圳机器人谷，为企业提供技术研发、测试验证和成果转化支持。",
  "items": [
    {
      "title": "\"模力营\" AI 社区",
      "description": "大湾区首个 AI 主题产业社区，聚集具身智能、大模型与机器人方向创业团队，提供算力、场景与资本对接。"
    },
    {
      "title": "广东省具身智能机器人创新中心",
      "description": "省级创新平台，围绕具身智能核心技术攻关，推动人形机器人整机与关键部件研发及产业化。"
    },
    {
      "title": "西丽湖国际科教城",
      "description": "汇聚清华、北大、哈工大等高校研究院，形成从基础研究到应用开发的完整创新链条。"
    }
  ]
},
```

**新增 `research`（来自 InnovationPage.research）：**

```json
"research": {
  "title": "前沿技术方向",
  "description": "深圳机器人谷的创新力量集中在以下关键领域，持续推动机器人技术的代际跃迁。",
  "items": [
    { "label": "具身智能", "value": "多模态感知、自主决策、灵巧操作" },
    { "label": "人形机器人", "value": "双足行走、全身控制、人机交互" },
    { "label": "AI 大模型", "value": "机器人基础模型、任务规划、场景理解" },
    { "label": "核心零部件", "value": "高性能伺服、精密减速器、力传感器" },
    { "label": "协作机器人", "value": "安全交互、柔性制造、易编程部署" },
    { "label": "群体智能", "value": "多机协同、分布式控制、集群调度" }
  ]
},
```

**新增 `models`（来自 CollaborationPage.models）：**

```json
"models": {
  "title": "五大协同模式",
  "description": "深圳机器人谷通过多层次协同机制，打通从技术研发到市场落地的全链条。",
  "items": [
    {
      "title": "产学研协同",
      "description": "高校院所与企业联合攻关，围绕产业需求开展定向研发，加速技术从实验室走向产线。"
    },
    {
      "title": "投融资对接",
      "description": "X-DAY 西丽湖路演社定期举办项目路演，链接天使投资、VC 与产业资本，千亿级融资计划持续赋能。"
    },
    {
      "title": "展示交流",
      "description": "机器人谷展厅与产业峰会为企业提供产品展示与行业交流平台，促进上下游合作。"
    },
    {
      "title": "项目孵化",
      "description": "为初创团队提供办公空间、技术支持与产业资源对接，降低创业门槛，加速产品落地。"
    },
    {
      "title": "国际合作",
      "description": "链接全球机器人产业资源，推动跨境技术引进、市场拓展与标准互认。"
    }
  ]
},
```

**新增 `partnerEcosystem`（来自 CollaborationPage.partners）：**

```json
"partnerEcosystem": {
  "title": "合作伙伴生态",
  "description": "深圳机器人谷与以下类型机构建立深度合作关系，共同推动机器人产业发展。",
  "items": [
    { "label": "政府园区", "value": "产业政策支持、空间承载、项目引进" },
    { "label": "高校院所", "value": "技术攻关、人才培养、联合实验室" },
    { "label": "投资机构", "value": "天使、VC、PE、产业基金全阶段覆盖" },
    { "label": "龙头企业", "value": "场景开放、供应链协同、联合创新" },
    { "label": "行业协会", "value": "标准制定、行业交流、政策建言" },
    { "label": "服务机构", "value": "知识产权、检测认证、法律咨询" }
  ]
},
```

**同时新增 CTA 翻译 key（放在 FoundationPage 下）：**

```json
"cta": "预约体验"
```

**对于 `messages/en.json` 的 `FoundationPage`，添加对应英文翻译（内容从原 `InnovationPage` / `CollaborationPage` 对应英文 key 中复制）：**

```json
"platforms": {
  "title": "Key Innovation Platforms",
  "description": "Multiple national and provincial innovation platforms are rooted in Shenzhen Robot Valley, providing enterprises with technology R&D, testing, validation, and commercialization support.",
  "items": [
    {
      "title": "Model Camp AI Community",
      "description": "The Greater Bay Area's first AI-themed industry community, gathering startups in embodied intelligence, foundation models, and robotics with access to computing power, scenarios, and capital."
    },
    {
      "title": "Guangdong Embodied AI Robotics Innovation Center",
      "description": "A provincial innovation platform focused on core embodied intelligence technologies, driving the R&D and industrialization of humanoid robot systems and key components."
    },
    {
      "title": "Xili Lake International Science and Education City",
      "description": "Home to research institutes from Tsinghua, Peking University, HIT and more, forming a complete innovation chain from fundamental research to applied development."
    }
  ]
},
"research": {
  "title": "Frontier Technology Directions",
  "description": "The innovation strength of Shenzhen Robot Valley is concentrated in these key areas, continuously driving generational advances in robotics technology.",
  "items": [
    { "label": "Embodied Intelligence", "value": "Multimodal perception, autonomous decision-making, dexterous manipulation" },
    { "label": "Humanoid Robots", "value": "Bipedal locomotion, whole-body control, human-robot interaction" },
    { "label": "AI Foundation Models", "value": "Robot foundation models, task planning, scene understanding" },
    { "label": "Core Components", "value": "High-performance servos, precision reducers, force sensors" },
    { "label": "Collaborative Robots", "value": "Safe interaction, flexible manufacturing, easy deployment" },
    { "label": "Swarm Intelligence", "value": "Multi-robot coordination, distributed control, fleet scheduling" }
  ]
},
"models": {
  "title": "Five Collaboration Models",
  "description": "Shenzhen Robot Valley connects the full chain from technology R&D to market deployment through multi-tier collaboration mechanisms.",
  "items": [
    {
      "title": "Industry-Academia-Research",
      "description": "Universities and enterprises jointly tackle challenges, conducting targeted R&D aligned with industry needs and accelerating technology transfer from lab to production line."
    },
    {
      "title": "Investment & Financing",
      "description": "X-DAY Xili Lake Roadshow Club hosts regular pitch events connecting angel investors, VCs, and industrial capital, with a 100-billion-yuan financing plan providing sustained support."
    },
    {
      "title": "Showcase & Exchange",
      "description": "The Robot Valley showroom and industry summits provide product display and networking platforms, fostering upstream-downstream collaboration."
    },
    {
      "title": "Project Incubation",
      "description": "Providing startups with office space, technical support, and industry resource connections, lowering barriers to entry and accelerating product commercialization."
    },
    {
      "title": "International Cooperation",
      "description": "Connecting global robotics industry resources to drive cross-border technology transfer, market expansion, and mutual recognition of standards."
    }
  ]
},
"partnerEcosystem": {
  "title": "Partner Ecosystem",
  "description": "Shenzhen Robot Valley has established deep partnerships with the following types of organizations to jointly advance the robotics industry.",
  "items": [
    { "label": "Government & Parks", "value": "Policy support, space capacity, project attraction" },
    { "label": "Universities & Institutes", "value": "Technology R&D, talent cultivation, joint labs" },
    { "label": "Investment Institutions", "value": "Full-stage coverage: angel, VC, PE, industry funds" },
    { "label": "Leading Enterprises", "value": "Scenario sharing, supply chain synergy, joint innovation" },
    { "label": "Industry Associations", "value": "Standard setting, industry networking, policy advocacy" },
    { "label": "Service Providers", "value": "IP protection, testing & certification, legal advisory" }
  ]
},
"cta": "Book an Experience"
```

- [ ] **Step 2: 验证 JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/zh.json','utf8'))" && echo "zh.json valid"
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))" && echo "en.json valid"
```

- [ ] **Step 3: 提交**

```bash
git add messages/zh.json messages/en.json
git commit -m "$(cat <<'EOF'
feat: add migrated content sections to FoundationPage i18n namespace
EOF
)"
```

---

### Task 4: 更新 Header 和 Footer 翻译

**Files:**
- Modify: `messages/zh.json`
- Modify: `messages/en.json`

- [ ] **Step 1: 更新 `Header` 翻译（zh.json）**

将当前 `Header` 对象替换为精简后的版本（仅保留仍在使用的 key）：

```json
"Header": {
  "brand": "深圳机器人谷",
  "overview": "首页",
  "showroom": "展厅介绍",
  "visit": "参观流程",
  "payment": "体验预约"
},
```

对 `en.json` 对应更新：

```json
"Header": {
  "brand": "Shenzhen Robot Valley",
  "overview": "Home",
  "showroom": "Showroom",
  "visit": "Visit Process",
  "payment": "Book Experience"
},
```

- [ ] **Step 2: 更新 `Footer` 翻译（zh.json）**

```json
"Footer": {
  "brand": "深圳机器人谷",
  "colExplore": "探索",
  "colVisit": "参观",
  "colInfo": "信息",
  "showroom": "展厅介绍",
  "about": "关于我们",
  "visitPlan": "参观流程",
  "payment": "体验预约",
  "terms": "使用条款",
  "privacy": "隐私政策",
  "contact": "联系我们"
},
```

对 `en.json` 对应更新：

```json
"Footer": {
  "brand": "Shenzhen Robot Valley",
  "colExplore": "Explore",
  "colVisit": "Visit",
  "colInfo": "Info",
  "showroom": "Showroom",
  "about": "About",
  "visitPlan": "Visit Process",
  "payment": "Book Experience",
  "terms": "Terms of Use",
  "privacy": "Privacy Policy",
  "contact": "Contact Us"
},
```

- [ ] **Step 3: 验证 JSON 有效**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/zh.json','utf8'))" && echo "zh.json valid"
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))" && echo "en.json valid"
```

- [ ] **Step 4: 提交**

```bash
git add messages/zh.json messages/en.json
git commit -m "$(cat <<'EOF'
feat: simplify Header and Footer i18n keys
EOF
)"
```

---

### Task 5: 精简 SiteHeader 导航

**Files:**
- Modify: `src/components/SiteHeader.tsx`

- [ ] **Step 1: 更新导航链接数组和 CTA 按钮**

将 `SiteHeader.tsx` 中的 `navLinks` 数组从 5 项精简为 4 项，CTA 按钮文案从 `visitT("button")` 改为直接使用 `t("payment")`：

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useCallback, useEffect } from "react";

export function SiteHeader() {
  const t = useTranslations("Header");
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navLinks = [
    { label: t("overview"), href: "/" },
    { label: t("showroom"), href: "/showroom" },
    { label: t("visit"), href: "/visit" },
    { label: t("payment"), href: "/payment" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded bg-accent text-sm font-bold text-white">RV</span>
          <span className="truncate text-accent">{t("brand")}</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden min-w-0 items-center gap-1 text-sm font-medium text-secondary xl:flex sm:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded px-3 py-2 transition-colors hover:bg-blue-50 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher />
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 xl:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex size-10 items-center justify-center rounded text-accent transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 top-16 z-30 xl:hidden" onClick={closeMenu} aria-hidden="true">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <nav
            className="relative border-t border-line bg-white px-4 py-4 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className="block rounded px-3 py-3 text-base font-semibold text-secondary transition-colors hover:bg-blue-50 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
```

关键改动：
- `navLinks` 从 5 项减为 4 项：首页、展厅介绍、参观流程、体验预约
- 移除桌面端 "申请参观" CTA 按钮（现在 `/payment` 本身就是导航链接）
- 移除移动端 "申请参观" CTA 按钮
- 移除 `visitT` 引用（不再需要 `VisitApplication` 命名空间的 `button` key）
- 语言切换器统一移到链接右侧（桌面端）或保持原位（移动端）

- [ ] **Step 2: 提交**

```bash
git add src/components/SiteHeader.tsx
git commit -m "$(cat <<'EOF'
feat: simplify header nav to 4 links, remove standalone CTA button
EOF
)"
```

---

### Task 6: 精简 Footer

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: 重写 Footer 为三列结构**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";

type FooterColumn = {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
};

export function Footer() {
  const t = useTranslations("Footer");
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const columns: FooterColumn[] = [
    {
      title: t("colExplore"),
      links: [
        { label: t("showroom"), href: "/showroom" },
        { label: t("about"), href: "/foundation" },
      ],
    },
    {
      title: t("colVisit"),
      links: [
        { label: t("visitPlan"), href: "/visit" },
        { label: t("payment"), href: "/payment" },
      ],
    },
    {
      title: t("colInfo"),
      links: [
        { label: t("terms"), href: "/terms" },
        { label: t("privacy"), href: "/privacy" },
        { label: t("contact"), href: "mailto:contact@robotvalley.cn", external: true },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="inline-block" aria-label="Home">
          <img src="/images/logo.png" alt="" className="h-6 w-auto" />
        </Link>

        <div className="mt-8 md:grid md:grid-cols-3 md:gap-8">
          {columns.map((col) => {
            const id = col.title;
            const isOpen = openSection === id;

            return (
              <div key={id} className="border-t border-white/10 md:border-t-0">
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="flex w-full items-center justify-between py-3 text-left md:cursor-default md:py-0"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-slate-200">{col.title}</span>
                  <span className="relative size-4 shrink-0 md:hidden">
                    <svg
                      className={`absolute inset-0 size-4 text-slate-400 transition-opacity ${isOpen ? "opacity-0" : "opacity-100"}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <svg
                      className={`absolute inset-0 size-4 text-slate-400 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M15 12.5L10 7.5L5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>

                <ul className={`overflow-hidden transition-all duration-300 md:!h-auto md:!opacity-100 ${isOpen ? "mb-4" : "mb-0 h-0 opacity-0 md:mb-0"}`}>
                  {col.links.map((link) => {
                    const cls = "block py-1 text-sm text-slate-400 hover:text-white transition";
                    return (
                      <li key={link.label}>
                        {link.external ? (
                          <a href={link.href} className={cls}>{link.label}</a>
                        ) : (
                          <Link href={link.href} className={cls}>{link.label}</Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-xs text-slate-500">
            &copy; 2026 {t("brand")}
          </p>
        </div>
      </div>
    </footer>
  );
}
```

关键改动：
- 从 4 列改为 3 列（`md:grid-cols-3`）
- 第 1 列「探索」：展厅介绍、关于我们 → `/foundation`
- 第 2 列「参观」：参观流程、体验预约
- 第 3 列「信息」：使用条款、隐私政策、联系我们
- 移除 `flex-col-reverse` 布局
- 版权行简化为单行

- [ ] **Step 2: 提交**

```bash
git add src/components/Footer.tsx
git commit -m "$(cat <<'EOF'
feat: simplify footer to 3-column layout
EOF
)"
```

---

### Task 7: 扩充 Foundation 页面

**Files:**
- Modify: `src/app/[locale]/foundation/page.tsx`

- [ ] **Step 1: 在现有 Foundation 页面底部添加四个新模块 + CTA**

在 `src/app/[locale]/foundation/page.tsx` 中，在 `{/* Enterprise Ecosystem */}` 区块之后、`</main>` 之前，插入以下四个新 section：

```tsx
      {/* Innovation Platforms — migrated from InnovationPage */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("platforms.title")}</p>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("platforms.description")}
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={t(`platforms.items.${i}.title`)}
                className="group relative overflow-hidden rounded-xl border border-line bg-white p-6 shadow-sm transition-shadow hover:shadow-soft"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 select-none text-8xl font-black text-[#f0f4fc]" aria-hidden="true">
                  {`0${i + 1}`}
                </div>
                <div className="relative">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
                    {`0${i + 1}`}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-accent">
                    {t(`platforms.items.${i}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-secondary">
                    {t(`platforms.items.${i}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frontier Research — migrated from InnovationPage */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("research.title")}</p>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("research.description")}
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={t(`research.items.${i}.label`)}
                className="flex items-start gap-5 rounded-xl border border-line bg-page p-5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
                  {`0${i + 1}`}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-accent">
                    {t(`research.items.${i}.label`)}
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-secondary">
                    {t(`research.items.${i}.value`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaboration Models — migrated from CollaborationPage */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("models.title")}</p>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("models.description")}
            </p>
          </div>
          <div className="mt-10 max-w-4xl space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={t(`models.items.${i}.title`)}
                className="flex flex-col gap-4 rounded-xl border border-line bg-page p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
                  {`0${i + 1}`}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-accent">
                    {t(`models.items.${i}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-secondary">
                    {t(`models.items.${i}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Ecosystem — migrated from CollaborationPage */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("partnerEcosystem.title")}</p>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("partnerEcosystem.description")}
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={t(`partnerEcosystem.items.${i}.label`)}
                className="flex flex-col rounded-xl border border-line bg-page p-5"
              >
                <span className="text-xs font-black tabular-nums text-muted">{`0${i + 1}`}</span>
                <h4 className="mt-2 text-base font-bold text-accent">
                  {t(`partnerEcosystem.items.${i}.label`)}
                </h4>
                <p className="mt-1 text-sm leading-6 text-secondary">
                  {t(`partnerEcosystem.items.${i}.value`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-accent">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-bold leading-tight text-white">{t("detailTitle")}</h2>
            <p className="mt-3 text-pretty text-base leading-7 text-white/85">{t("detailText")}</p>
          </div>
          <Link
            href="/payment"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded bg-white px-6 py-3 text-base font-semibold text-accent shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t("cta")}
          </Link>
        </div>
      </section>
```

同时需要将 Foundation 页面改为导入 `Link`（因为 CTA 用了 `Link`），在现有 `import` 后添加：

```tsx
import { Link } from "@/i18n/navigation";
```

完整文件头部的 import 变为：

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
```

- [ ] **Step 2: 提交**

```bash
git add src/app/\[locale\]/foundation/page.tsx
git commit -m "$(cat <<'EOF'
feat: expand Foundation page with innovation platforms, research, collaboration models, partner ecosystem, and CTA
EOF
)"
```

---

### Task 8: 合并报名表单到支付页面

**Files:**
- Modify: `src/components/ApplicationForm.tsx`
- Modify: `src/app/[locale]/payment/page.tsx`
- Modify: `messages/zh.json` — `PaymentPage` 命名空间
- Modify: `messages/en.json` — `PaymentPage` 命名空间

- [ ] **Step 1: 给 ApplicationForm 添加 `successHref` prop**

在 `src/components/ApplicationForm.tsx` 中，添加一个可选的 `successHref` prop，默认为 `/payment?success=1`。改动第 15 行附近：

```tsx
type ApplicationFormProps = {
  successHref?: string;
};

export function ApplicationForm({ successHref = "/payment?success=1" }: ApplicationFormProps) {
```

同时将 router.push 调用从硬编码改为使用 prop（第 47 行）：

```tsx
      router.push(successHref);
```

- [ ] **Step 2: 更新 PaymentPage 翻译（zh.json）**

在 `messages/zh.json` 的 `PaymentPage` 命名空间中添加表单相关 key：

```json
"formTitle": "填写报名信息",
"formDescription": "请填写以下信息，提交后将进入付款环节。",
"formCta": "提交并付款",
"successTitle": "报名已提交",
"successMessage": "您的报名信息已收到。请完成付款以确认体验名额。",
"payNow": "立即付款",
```

对应 `messages/en.json`：

```json
"formTitle": "Registration Information",
"formDescription": "Please fill in your information below. You will proceed to payment after submission.",
"formCta": "Submit & Pay",
"successTitle": "Registration Submitted",
"successMessage": "Your registration has been received. Please complete payment to confirm your experience slot.",
"payNow": "Pay Now",
```

- [ ] **Step 3: 重写 Payment 页面整合表单**

完整替换 `src/app/[locale]/payment/page.tsx`：

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PAYMENT_BENEFIT_KEYS, TRIAL_PAYMENT_PRICE_CNY } from "@/content/paymentOffer";
import { ApplicationForm } from "@/components/ApplicationForm";
import type { AppLocale } from "@/i18n/routing";

type PaymentPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function PaymentPage({ params, searchParams }: PaymentPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PaymentPage");
  const { success } = await searchParams;

  const benefits = PAYMENT_BENEFIT_KEYS.map((benefitKey) => ({
    title: t(`benefits.${benefitKey}.title`),
    text: t(`benefits.${benefitKey}.text`),
  }));

  const isSuccess = success === "1";

  return (
    <main
      id="main-content"
      className="bg-[linear-gradient(180deg,#eef3fb_0%,#f7f9fd_46%,#ffffff_100%)]"
    >
      {/* Hero Section */}
      <section className="relative isolate mx-auto max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div
          className="pointer-events-none absolute right-[-10rem] top-16 h-[28rem] w-[28rem] rounded-full bg-mid-light/[0.15] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex border-l-2 border-mid-light pl-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-mid-dark">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-accent sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-secondary">{t("description")}</p>

          <div className="mt-8 rounded-lg border border-white/70 bg-white/[0.78] p-5 shadow-[0_18px_52px_rgba(45,74,138,0.10)] backdrop-blur sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{t("priceLabel")}</p>
            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="font-mono text-6xl font-black leading-none text-accent">{TRIAL_PAYMENT_PRICE_CNY}</span>
              <span className="pb-1 text-xl font-bold text-secondary">{t("priceUnit")}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-secondary">{t("priceNote")}</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-lg border border-line bg-white/[0.86] p-4 shadow-sm">
                <h2 className="text-base font-bold leading-tight text-accent">{benefit.title}</h2>
                <p className="mt-2 text-sm leading-6 text-secondary">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
          {isSuccess ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100">
                <svg className="size-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-accent">{t("successTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-secondary">{t("successMessage")}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-accent transition-colors hover:bg-blue-50"
                >
                  {t("homeCta")}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mb-5 text-xl font-bold text-accent">{t("formTitle")}</h2>
              <p className="mb-5 text-sm leading-6 text-secondary">{t("formDescription")}</p>
              <ApplicationForm />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 提交**

```bash
git add src/components/ApplicationForm.tsx src/app/\[locale\]/payment/page.tsx messages/zh.json messages/en.json
git commit -m "$(cat <<'EOF'
feat: merge application form into payment page with inline success state
EOF
)"
```

---

### Task 9: 替换所有残留的已删除路由引用

**Files:**
- Modify: `src/components/landing/LandingHero.tsx`
- Modify: `src/components/landing/LandingExperienceBooking.tsx`
- Modify: `src/components/landing/LandingPaymentSection.tsx`
- Modify: `src/components/landing/LandingShowroomSection.tsx`
- Modify: `src/app/[locale]/visit/page.tsx`
- Modify: `src/app/[locale]/showroom/page.tsx`
- Delete: `src/components/VisitApplicationButton.tsx`

- [ ] **Step 1: 替换所有 `/apply` 为 `/payment`，替换 `/partners` 和 `/collaboration` 为 `/foundation`**

```bash
# 替换 /apply → /payment
find src -type f -name "*.tsx" -exec sed -i 's|href="/apply"|href="/payment"|g' {} +

# 替换被删除页面的链接 /partners → /foundation
find src -type f -name "*.tsx" -exec sed -i 's|linkHref="/partners"|linkHref="/foundation"|g' {} +
find src -type f -name "*.tsx" -exec sed -i 's|href="/partners"|href="/foundation"|g' {} +

# 替换被删除页面的链接 /collaboration → /foundation
find src -type f -name "*.tsx" -exec sed -i 's|linkHref="/collaboration"|linkHref="/foundation"|g' {} +
find src -type f -name "*.tsx" -exec sed -i 's|href="/collaboration"|href="/foundation"|g' {} +

# 验证无残留
grep -rn '"\/apply"\|"\/partners"\|"\/collaboration"' src/ --include="*.tsx" --include="*.ts"
```

预期：无输出（所有已删除路由的引用已替换）。

- [ ] **Step 2: 删除未使用的 VisitApplicationButton 组件**

```bash
rm src/components/VisitApplicationButton.tsx
```

- [ ] **Step 3: 提交**

```bash
git add src/components/landing/LandingHero.tsx src/components/landing/LandingExperienceBooking.tsx src/components/landing/LandingPaymentSection.tsx src/components/landing/LandingShowroomSection.tsx src/app/\[locale\]/visit/page.tsx src/app/\[locale\]/showroom/page.tsx src/components/VisitApplicationButton.tsx
git commit -m "$(cat <<'EOF'
fix: replace deleted route refs (/apply→/payment, /partners→/foundation, /collaboration→/foundation)
EOF
)"
```

---

### Task 10: 添加支付 API 骨架

**Files:**
- Create: `src/app/api/payment/route.ts`

- [ ] **Step 1: 创建支付 API 骨架**

```tsx
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  // TODO: Integrate third-party payment API when provider is selected
  // 1. Validate payload (name, email, visitor count, preferred date)
  // 2. Call payment provider's create order API
  // 3. Return payment parameters (e.g., QR code URL, payment URL, prepay_id)

  return NextResponse.json(
    {
      ok: true,
      message: "Payment API endpoint ready. Integrate third-party payment provider here.",
    },
    { status: 200 },
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/payment/route.ts
git commit -m "$(cat <<'EOF'
feat: add payment API skeleton endpoint
EOF
)"
```

---

### Task 11: 类型检查与验证

- [ ] **Step 1: 运行类型检查**

```bash
npm run test
```

预期：通过，无类型错误。

- [ ] **Step 2: 运行 ESLint**

```bash
npm run lint
```

预期：通过，无 lint 错误。如有错误，逐一修复。

- [ ] **Step 3: 验证 JSON 翻译文件**

```bash
node -e "const z=require('./messages/zh.json'); const e=require('./messages/en.json'); const kz=Object.keys(z).sort(); const ke=Object.keys(e).sort(); console.assert(JSON.stringify(kz)===JSON.stringify(ke), 'Namespace mismatch:', kz.filter(x=>!ke.includes(x)), ke.filter(x=>!kz.includes(x))); console.log('Namespaces match:', kz.length)"
```

预期：输出 "Namespaces match: N"，无 assert 错误。

- [ ] **Step 4: 验证构建**

```bash
npm run build
```

预期：构建成功。如有编译错误，根据错误信息修复。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: type-check, lint, and build verification
EOF
)"
```

---

### Task 12: 清理不再引用的导入和文件

- [ ] **Step 1: 检查 Landing 页面是否引用了被删除页面的路由**

`src/app/[locale]/page.tsx` 中 `LandingDetailSection` 的 cards 中 `href` 值原为 `/foundation` 和 `/showroom`，这些路由保留，无需改动。

- [ ] **Step 2: 移除不再使用的 VisitApplicationButton 组件**

检查 `src/components/VisitApplicationButton.tsx` 是否仍有引用（导航栏已不再使用独立 CTA 按钮）：

```bash
grep -r "VisitApplicationButton" src/ --include="*.tsx" --include="*.ts"
```

如无引用，删除该文件。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: remove unused component imports and files
EOF
)"
```
