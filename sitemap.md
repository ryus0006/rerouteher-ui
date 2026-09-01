# 🗺️ ReRouteHer — Complete Site Map & Information Architecture

> **Product**: ReRouteHer (Skill Readiness & Career Re-entry Platform)  
> **Live Prototype**: [https://prototype.curl.my/](https://prototype.curl.my/)  
> **Figma Canvas**: [Figma Project Board](https://www.figma.com/design/s0GLSGeOmrg1YhWhs3mIUd/Untitled?node-id=0-1&t=atdKdT2sKp6tFob8-1)  
> **Repository**: [`ncm233/reroutehers-prototype`](https://github.com/ncm233/reroutehers-prototype) / [`ryus0006/rerouteher-ui`](https://github.com/ryus0006/rerouteher-ui)

---

## 1. 🌟 High-Level Visual Site Map

![ReRouteHer User Flow & UI Mockup Board](C:\Users\ZhuanZ（无密码）\.gemini\antigravity-ide\brain\45c6195e-b7ac-4ce8-9c31-d83d9a191802\rerouteher_screens_breakdown_1787752761945.jpg)

![ReRouteHer Site Map Architectural Flow](C:\Users\ZhuanZ（无密码）\.gemini\antigravity-ide\brain\45c6195e-b7ac-4ce8-9c31-d83d9a191802\rerouteher_sitemap_overview_1787752742006.jpg)

---

## 2. 🧭 Interactive User Journey Flowchart (Mermaid)

```mermaid
flowchart TD
    %% Styling Nodes
    classDef landing fill:#FBF0F4,stroke:#DE8BA8,stroke-width:2px,color:#262B4A;
    classDef intake fill:#EBE3F4,stroke:#B8ACD4,stroke-width:2px,color:#262B4A;
    classDef snapshot fill:#E6F5ED,stroke:#337857,stroke-width:2px,color:#262B4A;
    classDef gap fill:#DEE4F5,stroke:#5E6FA6,stroke-width:2px,color:#262B4A;
    classDef future fill:#FEF0DA,stroke:#C07018,stroke-width:2px,color:#262B4A;

    %% Level 1: Landing
    Start([🌐 User Visits Site / Landing]) --> E1[<b>01 · E1 Landing Page</b><br/>• Hero Butterfly Art & Value Proposition<br/>• 3-Step Zero-Friction Journey<br/>• 3 Core Value Glass Cards]:::landing
    
    %% CTA
    E1 -->|Click 'Get started'| E2A[<b>02 · E2a Upload CV</b><br/>• Mandatory CV Drag & Drop Dropzone<br/>• PDF / DOCX Client Validation<br/>• Sample Resume Fast-Loader]:::intake

    %% Level 2: Intake Flow
    E2A -->|Valid CV Uploaded| E2B[<b>03 · E2b Career Break Intake</b><br/>• Question 1: Duration Slider 0.5–15 yrs<br/>• Question 2: Free-text Activity Input<br/>• Quick-add Suggestion Tags]:::intake
    E2B -.->|Back to CV| E2A

    %% Level 3: Processing & Snapshot
    E2B -->|Submit & AI NLP Mapping| E3[<b>04 · E3 Skill Snapshot</b><br/>• Read-Only 'YOUR BACKGROUND LOOKS LIKE' Baseline<br/>• Professional Skills Column CV<br/>• Reframed Break Skills Column O*NET<br/>• O*NET Crosswalk Bridge Banner]:::snapshot
    E3 -.->|Back to Edit Break| E2B

    %% Level 4: Target Roles & Gap Engine
    E3 -->|Click 'Choose target role & see readiness'| E4[<b>05 · E4 Target Role Gap Analysis</b><br/>• Target Role Selector: UX/UI / Marketing / Support / Finance<br/>• Lieflat Arc Gauge Animated Score<br/>• 10-Dot Key Skill Pip Meter<br/>• Importance-Weighted Formula Explanation<br/>• Top 3 Capped Priority Focus Areas +% Uplift]:::gap
    E4 -.->|Back to Snapshot| E3

    %% Role Switching Sub-states
    subgraph E4_Roles ["Interactive Role Switching (Live Recalculation)"]
        R1["🎨 Senior UX/UI (78% ➔ 94% Target)"]:::gap
        R2["📈 Digital Marketing (72% ➔ 91% Target)"]:::gap
        R3["💬 Customer Support (85% ➔ 97% Target)"]:::gap
        R4["📊 Bookkeeping & Finance (64% ➔ 91% Target)"]:::gap
    end
    E4 --- E4_Roles

    %% Level 5: Iteration 2 Future
    E4 -->|Iteration 2 Preview| E5[<b>06 · E5 Roadmap & Learning Plan</b><br/>• 6-Week Micro-Sprint Modular Upskilling<br/>• AI Tool Mastery & Project Portfolio<br/>• 94% Final Role Readiness Goal]:::future
```

---

## 3. 📑 Comprehensive Information Architecture (IA) Matrix

| 步骤编号 | 视图 ID | 页面名称 / 模块 | 用户目标 (User Intent) | 核心输入 / 交互组件 (Inputs) | 核心展示 / 输出数据 (Outputs) | 系统逻辑与状态 (System State) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `landing` | **E1 Landing Page** | 了解平台定位，建立重返职场信心，无门槛启动体验 | • 头部导航 Logo<br>• `Get started` 主行动按钮 (CTA)<br>• 滚动体验视差交互 | • 梦幻通透油画蝴蝶艺术图<br>• 核心主张与 3 步旅程流程<br>• 3 大价值玻璃卡片 | 初始化 Guest 临时会话，重置滚动监听 |
| **02** | `story-a` | **E2a Upload CV** | 提交过往职业履历，提取基础技能 | • 简历拖拽上传区 (PDF/DOCX)<br>• `⚡ Load Sample CV` 示例简历<br>• `Continue` 继续按钮 | • 文件名与文件大小校验提示<br>• 成功上传绿色状态卡片 | 强制上传校验（不可跳过），解析文件元数据 |
| **03** | `story-b` | **E2b Career Break** | 记录职场空窗期时长与真实生活活动 | • 休息时长滑块 (0.5~15 年)<br>• **自由文本输入框 (Textarea)**<br>• 4 个快捷活动辅助标签 | • 动态时长气泡 (`3 years`)<br>• 实时自动保存提示 | 提取自由文本中的关键词并映射至 O*NET 技能词库 |
| **04** | `snapshot` | **E3 Skill Snapshot** | 查看过往职场技能与生活技能的转译基准 | • `← Back to Break` 修改断档<br>• `Choose target role` 瞄准按钮 | • **`YOUR BACKGROUND LOOKS LIKE`** 基准卡<br>• 职场专业技能栏 (5 项)<br>• 生活转译技能栏 (O*NET 校验)<br>• O*NET 跨界转换横幅 | 纯只读展示，不锁定用户目标岗位 |
| **05** | `gap` | **E4 Target Role & Gap** | 探索不同目标岗位的匹配度与 3 大优先攻坚项 | • 4 个岗位切换选择 Pills<br>• `← Back to Snapshot` 返回基准 | • **Lieflat 弧形仪表盘** (实时百分比动画)<br>• **10 格技能点阵** (如 7/10)<br>• **加权准备度公式解释卡**<br>• **78% ➔ 94% 目标提升胶囊**<br>• **Top 3 聚焦项** (按 +% 增益排序) | 动态计算加权匹配分，支持 4 岗位秒级切换与重绘 |
| **06** | `preview` | **E5 Roadmap (Iteration 2)** | 规划后续学习冲刺路线 | • 查看路线图大纲 | • 6 周微冲刺路线预览与 94% 达标预期 | 迭代二规划入口，提供后续产品演进展望 |

---

## 4. 🎯 目标岗位状态分支矩阵 (E4 Role Variants Matrix)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ E4 Target Role Readiness Engine                                                             │
├──────────────────────┬─────────────┬──────────────┬──────────────┬──────────────────────────┤
│ 目标角色 (Role)       │ 当前准备度   │ 最终目标分   │ 核心技能点阵 │ Top 3 攻坚项 (+% Uplift) │
├──────────────────────┼─────────────┼──────────────┼──────────────┼──────────────────────────┤
│ 🎨 Senior UX/UI      │ 78% (基准)  │ 94% (目标)   │ 7 / 10 命中  │ • AI Design (+9%)        │
│                      │             │              │              │ • Design Systems (+7%)   │
│                      │             │              │              │ • Prompt UX (+5%)        │
├──────────────────────┼─────────────┼──────────────┼──────────────┼──────────────────────────┤
│ 📈 Digital Marketing │ 72%         │ 91% (目标)   │ 7 / 10 命中  │ • AI-Driven SEO (+8%)    │
│                      │             │              │              │ • GA4 Analytics (+6%)    │
│                      │             │              │              │ • Ad Automation (+5%)    │
├──────────────────────┼─────────────┼──────────────┼──────────────┼──────────────────────────┤
│ 💬 Customer Support  │ 85%         │ 97% (目标)   │ 8 / 10 命中  │ • Zendesk Omnichannel(+7%)│
│                      │             │              │              │ • AI Copilot Triage (+6%)│
│                      │             │              │              │ • CRM Health Risk (+4%)  │
├──────────────────────┼─────────────┼──────────────┼──────────────┼──────────────────────────┤
│ 📊 Bookkeeping       │ 64%         │ 91% (目标)   │ 6 / 10 命中  │ • Cloud Xero/QB (+12%)   │
│                      │             │              │              │ • AI Sheets Copilot (+9%)│
│                      │             │              │              │ • Tax Compliance (+6%)   │
└──────────────────────┴─────────────┴──────────────┴──────────────┴──────────────────────────┘
```

---

## 5. 🎨 Figma 画布与代码文件层级对应关系

根据 [Figma 画板链接](https://www.figma.com/design/s0GLSGeOmrg1YhWhs3mIUd/Untitled?node-id=0-1&t=atdKdT2sKp6tFob8-1) 与本地脚本 [`figma-plugin/code.js`](file:///e:/reroutehers-prototype/figma-plugin/code.js) 的组织架构：

```text
🎨 Figma Master Project Structure
│
├── 🌟 00 · Design Tokens & UI Kit (Colors, Typographic Scale, Atoms)
│
├── 🖥️ 核心业务画板 (1:1 对应 assemble-app.mjs)
│   ├── 01 · E1 Landing Page (Hero + 3-Step Journey + 3 Glass Cards)
│   ├── 02 · E2a Upload CV (Dropzone + PDF/DOCX Validation + Sample CV)
│   ├── 03 · E2b Career Break (Duration Slider + Free-text NLP Input)
│   ├── 04 · E3 Skill Snapshot (Read-Only Baseline + O*NET Crosswalk)
│   └── 05 · E4 Target Role: Senior UX/UI (78% ➔ 94% + Lieflat Gauge)
│
└── 🔄 目标岗位拓展分支 (Variants)
    ├── 06 · E4 Target Role: Digital Marketing (72% ➔ 91%)
    ├── 07 · E4 Target Role: Customer Support (85% ➔ 97%)
    └── 08 · E4 Target Role: Bookkeeping & Finance (64% ➔ 91%)
```

---

## 6. 🧠 核心数据流与 AI 技能转译逻辑 (Data Architecture)

```mermaid
sequenceDiagram
    autonumber
    actor User as 用户 (Mother Returning)
    participant UI as 前端视图 (SPA Prototype)
    participant NLP as AI / O*NET 转译引擎
    participant Model as 准备度加权算法 (Scoring Engine)

    User->>UI: 1. 拖拽上传 CV (PDF / DOCX)
    UI->>NLP: 提取职场核心技能 (5 项技能)
    User->>UI: 2. 输入断档时长与活动描述 (自由文本)
    UI->>NLP: 语义分析提取生活技能 (育儿/家务/理财/自学)
    NLP-->>UI: 映射至 O*NET 国际标准技能分类
    UI->>User: 3. 渲染 E3 Skill Snapshot (只读历史基准)
    User->>UI: 4. 选择目标岗位 (如 Senior UX/UI)
    UI->>Model: 匹配已具备技能 vs 岗位所需 10 项核心技能
    Model-->>UI: 输出加权准备度 (78%)、点阵 (7/10) 与 Top 3 攻坚项 (+16%)
    UI->>User: 5. 交互式呈现 E4 准备度大屏与微冲刺路径
```
