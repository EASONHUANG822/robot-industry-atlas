const fs = require("fs");

/* ================================================================
   Rebuild missing translation namespaces in zh.json and en.json
   Uses JSON.parse + object assignment + JSON.stringify only.
   No string concatenation, no global quote replacement, no git.
   ================================================================ */

const zhPath = "messages/zh.json";
const enPath = "messages/en.json";

const zh = JSON.parse(fs.readFileSync(zhPath, "utf8"));
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

/* ------------------------------------------------------------------ */
/*  Header: add new nav keys                                          */
/* ------------------------------------------------------------------ */
zh.Header.showroom = "展厅介绍";
zh.Header.visit = "参观流程";
zh.Header.partners = "合作接待";

en.Header.showroom = "Showroom";
en.Header.visit = "Visit Process";
en.Header.partners = "Partners";

/* ------------------------------------------------------------------ */
/*  Landing: expand detail structure                                  */
/* ------------------------------------------------------------------ */

// detail section
zh.Landing.detail = {
  eyebrow: "机器人谷介绍",
  title: "以南山智谷产业园为承载核心的机器人展示与创新平台",
  description:
    "深圳机器人谷聚焦前沿机器人展示、应用场景体验、产业资源对接与创新交流。参观者可以近距离了解机器人本体、智能制造、AI 算法、核心零部件及服务机器人应用，同时看到深圳机器人生态的全景脉络。",
  addressLabel: "展厅地址",
  areaLabel: "展厅面积",
  showroomCta: "了解展厅详情",
  cards: {
    showroom: {
      tag: "展厅",
      title: "沉浸式展厅体验",
      description:
        "实物机器人、互动演示与场景化展示，呈现从机器人研发到实际应用的完整路径。",
      link: "了解展厅",
    },
    ecosystem: {
      tag: "生态",
      title: "产业生态圈",
      description:
        "平台链接南山科研机构、机器人企业、应用场景与产业服务，形成高效协作网络。",
      link: "探索生态",
    },
    visit: {
      tag: "参观",
      title: "面向参观者",
      description:
        "适合政府园区、企业客户、投资机构、科研团队和产业伙伴前来参观与对接交流。",
      link: "合作接待",
    },
  },
};

en.Landing.detail = {
  eyebrow: "Robot Valley Introduction",
  title:
    "A robotics showcase and innovation platform centered on Nanshan Zhigu Industrial Park",
  description:
    "Shenzhen Robot Valley focuses on frontier robotics showcases, application-scenario experiences, industry resource connection, and innovation exchange. Visitors can explore robot bodies, intelligent manufacturing, AI algorithms, core components, and service robot applications while seeing Shenzhen's robotics ecosystem in context.",
  addressLabel: "Showroom Address",
  areaLabel: "Showroom Area",
  showroomCta: "Explore Showroom",
  cards: {
    showroom: {
      tag: "Showroom",
      title: "Immersive Showroom Experience",
      description:
        "Physical robots, interactive demos, and scenario-based displays show the full path from robotics R&D to real-world application.",
      link: "Explore Showroom",
    },
    ecosystem: {
      tag: "Ecosystem",
      title: "Industry Ecosystem",
      description:
        "The platform connects Nanshan research institutions, robotics companies, application scenarios, and industry services into an efficient collaboration network.",
      link: "Explore Ecosystem",
    },
    visit: {
      tag: "Visit",
      title: "Built for Visitors",
      description:
        "Designed for government parks, enterprise clients, investors, research teams, and industry partners to visit and connect.",
      link: "Partnerships",
    },
  },
};

// showroom section (landing page CTA)
zh.Landing.showroom = {
  eyebrow: "机器人谷展厅",
  title: "参观深圳机器人谷展厅",
  description:
    "展厅呈现具身智能、服务机器人、工业自动化、核心零部件与互动演示，让来访者通过真实场景与技术展示了解深圳机器人谷。",
  apply: "申请参观",
};

en.Landing.showroom = {
  eyebrow: "Robot Valley Showroom",
  title: "Visit the Shenzhen Robot Valley Showroom",
  description:
    "The showroom presents embodied intelligence, service robots, industrial automation, core components, and interactive demos so visitors can understand Shenzhen Robot Valley through real scenes and technology showcases.",
  apply: "Apply for a Visit",
};

/* ------------------------------------------------------------------ */
/*  ShowroomPage                                                      */
/* ------------------------------------------------------------------ */
zh.ShowroomPage = {
  eyebrow: "机器人谷展厅",
  title: "面向机器人技术、场景展示与产业交流的集中展厅",
  description:
    "深圳机器人谷展厅将机器人产业能力转化为清晰的参观体验：通过实物产品、互动演示、生态介绍和场景化展示，帮助来访团队快速理解平台价值。",
  apply: "申请参观",
  visit: "查看参观流程",
  addressLabel: "展厅地址",
  areaLabel: "展厅面积",
  what: {
    tag: "展厅",
    title: "以展示体验驱动产业连接",
    description:
      "深圳机器人谷展厅将机器人产业能力转化为清晰的参观体验。通过实物产品、互动演示、生态介绍和场景化展示，帮助来访团队快速理解平台价值与技术脉络。",
    link: "申请参观",
  },
  see: {
    tag: "展品",
    title: "从核心技术到真实应用场景",
    description:
      "展厅集中呈现具身智能、服务机器人、工业自动化、核心零部件与 AI 系统。每项展品围绕真实应用场景组织，让技术能力通过现场演示变得可触可感。",
    link: "查看参观流程",
  },
  audience: {
    tag: "访客",
    title: "为多元访客构建专属参观体验",
    description:
      "适合政府园区、企业客户、投资机构、科研团队、媒体访客和产业伙伴。我们根据来访方背景定制参观路线与介绍重点，让每一次参观都高效且有价值。",
    link: "合作接待",
  },
  collaboration: {
    tag: "合作",
    title: "构建机器人产业合作生态",
    description:
      "依托深圳机器人谷的产业集聚优势，为合作伙伴提供技术对接、项目孵化、市场拓展等全方位支持，共同推动机器人技术创新与产业化落地。",
    link: "了解更多",
  },
  detailFoundation: {
    title: "产业基础",
    text: "超过 200 家机器人企业在走廊内集聚，90% 的零部件可在三公里内快速集结，支撑从研发、制造到应用的产业闭环。",
  },
  detailInnovation: {
    title: "创新生态",
    text: "大湾区首个 AI 社区“模力营”、广东省具身智能机器人创新中心等生态平台扎根于此，企业与高校持续联合攻关。",
  },
  gallery: {
    title: "活动照片",
    close: "关闭",
    prev: "上一张",
    next: "下一张",
  },
};

en.ShowroomPage = {
  eyebrow: "Robot Valley Showroom",
  title: "A focused showroom for robotics technology, scenes, and industry exchange",
  description:
    "The Shenzhen Robot Valley showroom turns robotics capability into a clear visit experience: physical products, interactive demonstrations, ecosystem briefings, and scenario displays for teams that need to understand the platform quickly.",
  apply: "Apply to Visit",
  visit: "View Visit Flow",
  addressLabel: "Showroom Address",
  areaLabel: "Showroom Area",
  what: {
    tag: "Showroom",
    title: "Industry connections driven by showcase experiences",
    description:
      "The Shenzhen Robot Valley showroom turns robotics capability into a clear visit experience. Physical products, interactive demonstrations, ecosystem briefings, and scenario displays help visiting teams quickly understand the platform value and technology landscape.",
    link: "Apply to Visit",
  },
  see: {
    tag: "Exhibits",
    title: "From core technologies to real-world applications",
    description:
      "The showroom presents embodied intelligence, service robots, industrial automation, core components, and AI systems. Every exhibit is organized around real application scenarios, making technical capabilities tangible through live demonstrations.",
    link: "View Visit Flow",
  },
  audience: {
    tag: "Visitors",
    title: "Tailored visit experiences for diverse audiences",
    description:
      "Designed for government delegations, enterprise clients, investors, research teams, media visitors, and industry partners. We customize tour routes and briefing priorities based on each group background, making every visit efficient and valuable.",
    link: "Partnerships",
  },
  collaboration: {
    tag: "Collaboration",
    title: "Building a robotics industry collaboration ecosystem",
    description:
      "Leveraging the industrial cluster advantages of Shenzhen Robot Valley, we provide partners with comprehensive support including technology matchmaking, project incubation, and market expansion to jointly advance robotics innovation and industrialization.",
    link: "Learn More",
  },
  detailFoundation: {
    title: "Industrial Foundation",
    text: "More than 200 robotics enterprises cluster here, with 90% of components able to assemble quickly within 3 kilometers, supporting a full loop from R&D and manufacturing to application.",
  },
  detailInnovation: {
    title: "Innovation Ecosystem",
    text: "Ecological platforms such as Model Camp, the Greater Bay Area's first AI community, and the Guangdong Embodied AI Robotics Innovation Center are rooted here.",
  },
  gallery: {
    title: "Event Photos",
    close: "Close",
    prev: "Previous",
    next: "Next",
  },
};

/* ------------------------------------------------------------------ */
/*  VisitPage                                                         */
/* ------------------------------------------------------------------ */
zh.VisitPage = {
  eyebrow: "参观流程",
  title: "规划一次清晰、高效的深圳机器人谷参观",
  description:
    "这里说明如何预约参观、展厅适合哪些团队，以及提交哪些信息可以帮助工作人员更快确认安排。",
  apply: "开始申请",
  steps: {
    request: { title: "提交申请", text: "填写机构、联系人、期望参观日期、参观人数，以及希望重点了解的方向。" },
    confirm: { title: "确认安排", text: "工作人员审核申请，确认档期，并进一步沟通参观时间、团队规模和参观重点。" },
    visit: { title: "到场参观", text: "来访团队可参观展厅、观看演示，并根据需求对接相关产业或项目资源。" },
  },
  audience: {
    title: "适合哪些团队",
    government: "政府园区代表团",
    enterprise: "企业客户与合作方",
    investor: "投资机构",
    research: "科研团队与高校",
  },
  prepare: {
    title: "参观前的准备",
    text: "建议参观团队提前了解深圳机器人谷的基本情况，准备希望重点了解的技术方向或合作需求，以便工作人员更有针对性地安排参观内容。",
  },
};

en.VisitPage = {
  eyebrow: "Visit Process",
  title: "Plan a clear and efficient Shenzhen Robot Valley visit",
  description:
    "Find out how to book a visit, which teams the showroom is designed for, and what information helps staff confirm your arrangement faster.",
  apply: "Start Application",
  steps: {
    request: { title: "Submit Application", text: "Fill in your organization, contact person, preferred visit date, number of visitors, and areas of interest." },
    confirm: { title: "Confirm Arrangement", text: "Staff will review your application, confirm availability, and discuss visit timing, team size, and priorities." },
    visit: { title: "On-site Visit", text: "Your team can tour the showroom, view demonstrations, and connect with relevant industry or project resources as needed." },
  },
  audience: {
    title: "Who Should Visit",
    government: "Government delegations",
    enterprise: "Enterprise clients and partners",
    investor: "Investment institutions",
    research: "Research teams and universities",
  },
  prepare: {
    title: "Before Your Visit",
    text: "We recommend that visiting teams learn about Shenzhen Robot Valley basics in advance and prepare specific technology directions or collaboration needs, so staff can tailor the visit more effectively.",
  },
};

/* ------------------------------------------------------------------ */
/*  PartnersPage                                                      */
/* ------------------------------------------------------------------ */
zh.PartnersPage = {
  eyebrow: "合作接待",
  title: "为合作伙伴提供专业接待与深度对接",
  description:
    "深圳机器人谷针对政府园区、企业客户、投资机构和产业伙伴提供定制化接待方案，包括展厅参观、产业介绍、项目路演和技术对接。",
  apply: "立即申请",
  visit: "查看参观流程",
  signals: {
    reception: { label: "政府接待", value: "园区考察、产业座谈、政策沟通" },
    enterprise: { label: "企业对接", value: "技术交流、供应链合作、联合研发" },
    project: { label: "项目路演", value: "投融资对接、项目展示、资源匹配" },
    exchange: { label: "行业交流", value: "峰会论坛、技术研讨、国际合作" },
  },
  modelsEyebrow: "服务模式",
  modelsTitle: "四种接待模式",
  models: {
    reception: { title: "标准接待", text: "展厅参观 + 产业介绍，适合首次来访的政府园区和企业代表团。" },
    showcase: { title: "深度展示", text: "定制化展示 + 技术演示，适合有明确合作方向的来访团队。" },
    matchmaking: { title: "精准对接", text: "项目路演 + 一对一洽谈，适合寻求投融资或供应链合作的企业。" },
  },
  flowEyebrow: "接待流程",
  flowTitle: "一次典型的合作接待流程",
  flowDescription: "从需求沟通到后续跟进，每个环节都经过精心设计，确保接待效果。",
  flow: {
    brief: { title: "需求沟通", text: "来访方提交背景信息与合作需求，工作人员评估并设计方案。" },
    plan: { title: "方案设计", text: "根据来访方背景定制参观路线、介绍重点和参与人员。" },
    host: { title: "现场接待", text: "展厅参观、技术演示、座谈交流，全程陪同与讲解。" },
  },
  cta: {
    title: "预约合作接待",
    text: "请通过参观申请系统提交合作接待需求，工作人员将在 2 个工作日内与您联系。",
    button: "提交申请",
  },
};

en.PartnersPage = {
  eyebrow: "Partner Reception",
  title: "Professional reception and deep connections for partners",
  description:
    "Shenzhen Robot Valley provides customized reception programs for government parks, enterprise clients, investors, and industry partners, including showroom tours, industry briefings, project roadshows, and technology matchmaking.",
  apply: "Apply Now",
  visit: "View Visit Process",
  signals: {
    reception: { label: "Government Reception", value: "Park inspections, industry roundtables, policy communication" },
    enterprise: { label: "Enterprise Matchmaking", value: "Technical exchange, supply chain collaboration, joint R&D" },
    project: { label: "Project Roadshows", value: "Investment matchmaking, project showcasing, resource matching" },
    exchange: { label: "Industry Exchange", value: "Summits, forums, technical seminars, international cooperation" },
  },
  modelsEyebrow: "Service Models",
  modelsTitle: "Four Reception Models",
  models: {
    reception: { title: "Standard Reception", text: "Showroom tour + industry briefing, ideal for first-time government and enterprise delegations." },
    showcase: { title: "In-depth Showcase", text: "Customized display + technical demo, for visiting teams with clear collaboration directions." },
    matchmaking: { title: "Precision Matchmaking", text: "Project roadshow + one-on-one meetings, for enterprises seeking investment or supply chain collaboration." },
  },
  flowEyebrow: "Reception Flow",
  flowTitle: "A typical partner reception flow",
  flowDescription: "Every step, from requirements communication to follow-up, is carefully designed to ensure quality reception outcomes.",
  flow: {
    brief: { title: "Requirements Communication", text: "Visiting parties submit background and collaboration needs; staff evaluate and design the program." },
    plan: { title: "Program Design", text: "Customize tour routes, briefing priorities, and participants based on visitor background." },
    host: { title: "On-site Reception", text: "Showroom tour, technical demonstrations, discussions — accompanied and facilitated throughout." },
  },
  cta: {
    title: "Request Partner Reception",
    text: "Please submit your reception requirements through the visit application system. Staff will contact you within 2 working days.",
    button: "Submit Application",
  },
};

/* ------------------------------------------------------------------ */
/*  FoundationPage (expanded)                                         */
/* ------------------------------------------------------------------ */
zh.FoundationPage = {
  eyebrow: "产业基础",
  title: "产业基础聚链成峰",
  description:
    "深圳机器人谷汇聚超过 200 家机器人企业，形成从核心零部件到场景应用的完整产业链。",
  detailTitle: "完整产业链",
  detailText:
    "超过 200 家机器人企业在走廊内集聚，90% 的零部件可在三公里内快速集结，支撑从研发、制造到应用的产业闭环。",
  stats: {
    companies: "机器人企业",
    companiesValue: "200+",
    components: "零部件本地化率",
    componentsValue: "90%",
    radius: "供应链半径",
    radiusValue: "3 km",
    patents: "年均新增专利",
    patentsValue: "1,000+",
  },
  chain: {
    title: "全产业链布局",
    description:
      "从底层核心零部件到终端应用场景，深圳机器人谷已形成完整的机器人产业链闭环，各环节协同效应显著。",
    items: [
      {
        title: "核心零部件",
        description:
          "伺服电机、减速器、控制器、传感器、AI 芯片等关键零部件企业在此集聚，为整机研发提供坚实的底层支撑。",
      },
      {
        title: "本体制造",
        description:
          "涵盖工业机器人、服务机器人、特种机器人、人形机器人等品类，满足不同行业和场景的自动化需求。",
      },
      {
        title: "系统集成",
        description:
          "产线自动化、智能仓储物流、机器视觉检测、柔性制造等领域系统集成商，将技术与产业需求精准对接。",
      },
      {
        title: "应用场景",
        description:
          "覆盖 3C 电子、新能源汽车、医疗器械、智慧物流、商业服务等多元场景，持续拓展机器人应用边界。",
      },
    ],
  },
  supply: {
    title: "三公里供应链半径",
    description:
      "在深圳机器人谷三公里范围内，企业可快速完成从核心零部件采购到整机组装测试的全流程。90% 的零部件在本地即可获得，大幅缩短研发周期与交付时间，形成难以复制的产业集聚优势。",
  },
  ecosystem: {
    title: "多元企业生态",
    description:
      "深圳机器人谷汇聚了从初创团队到上市公司的多层次企业群体，涵盖工业机器人、服务机器人、特种机器人、核心零部件、AI 软件与系统集成等细分领域，形成大中小企业融通发展的产业生态。",
    items: [
      { label: "工业机器人", value: "焊接、喷涂、搬运、装配等" },
      { label: "服务机器人", value: "配送、清洁、导览、教育等" },
      { label: "特种机器人", value: "巡检、救援、水下、建筑等" },
      { label: "核心零部件", value: "电机、减速器、控制器、传感器" },
      { label: "AI 与软件", value: "具身智能、机器视觉、操作系统" },
      { label: "系统集成", value: "产线设计、自动化改造、数字孪生" },
    ],
  },
};

en.FoundationPage = {
  eyebrow: "Industrial Foundation",
  title: "A Peak Formed by Industry Clustering",
  description:
    "Shenzhen Robot Valley brings together more than 200 robotics enterprises, forming a complete industry chain from core components to application scenarios.",
  detailTitle: "Complete Industry Chain",
  detailText:
    "More than 200 robotics enterprises cluster here, with 90% of components able to assemble quickly within 3 kilometers, supporting a full loop from R&D and manufacturing to application.",
  stats: {
    companies: "Robotics Enterprises",
    companiesValue: "200+",
    components: "Local Component Rate",
    componentsValue: "90%",
    radius: "Supply Chain Radius",
    radiusValue: "3 km",
    patents: "Annual New Patents",
    patentsValue: "1,000+",
  },
  chain: {
    title: "Complete Industry Chain Layout",
    description:
      "From foundational core components to end-use application scenarios, Shenzhen Robot Valley has formed a complete robotics industry chain with significant synergy across all segments.",
    items: [
      {
        title: "Core Components",
        description:
          "Servo motors, reducers, controllers, sensors, AI chips, and other key component enterprises cluster here, providing solid foundational support for robot R&D.",
      },
      {
        title: "Robot Manufacturing",
        description:
          "Covering industrial robots, service robots, specialized robots, humanoid robots, and more to meet automation needs across diverse industries and scenarios.",
      },
      {
        title: "System Integration",
        description:
          "System integrators in production line automation, smart warehousing and logistics, machine vision inspection, and flexible manufacturing precisely match technology with industry demand.",
      },
      {
        title: "Application Scenarios",
        description:
          "Covering 3C electronics, new energy vehicles, medical devices, smart logistics, commercial services, and more, continuously expanding the boundaries of robotics applications.",
      },
    ],
  },
  supply: {
    title: "3km Supply Chain Radius",
    description:
      "Within a 3km radius of Shenzhen Robot Valley, enterprises can rapidly complete the entire process from core component procurement to robot assembly and testing. 90% of components are available locally, significantly shortening R&D cycles and delivery times, creating a hard-to-replicate industrial cluster advantage.",
  },
  ecosystem: {
    title: "Diverse Enterprise Ecosystem",
    description:
      "Shenzhen Robot Valley brings together a multi-tier enterprise community from startups to listed companies, covering industrial robots, service robots, specialized robots, core components, AI software, and system integration, forming an ecosystem where large, medium, and small enterprises grow together.",
    items: [
      { label: "Industrial Robots", value: "Welding, painting, handling, assembly" },
      { label: "Service Robots", value: "Delivery, cleaning, guidance, education" },
      { label: "Specialized Robots", value: "Inspection, rescue, underwater, construction" },
      { label: "Core Components", value: "Motors, reducers, controllers, sensors" },
      { label: "AI & Software", value: "Embodied AI, machine vision, OS" },
      { label: "System Integration", value: "Line design, automation, digital twin" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  InnovationPage (expanded)                                         */
/* ------------------------------------------------------------------ */
zh.InnovationPage = {
  eyebrow: "创新生态",
  title: "创新活力持续奔涌",
  description:
    "AI 社区、省级创新中心与校企合作持续驱动走廊内的技术突破。",
  detailTitle: "持续技术突破",
  detailText:
    "大湾区首个 AI 社区“模力营”、广东省具身智能机器人创新中心等生态平台扎根于此，企业与高校持续联合攻关。",
  stats: {
    platforms: "创新平台",
    platformsValue: "12+",
    aiCommunity: "AI 企业",
    aiCommunityValue: "50+",
    university: "合作高校",
    universityValue: "20+",
    annualEvents: "年度创新活动",
    annualEventsValue: "100+",
  },
  platforms: {
    title: "核心创新平台",
    description:
      "多个国家级与省级创新平台扎根深圳机器人谷，为企业提供技术研发、测试验证和成果转化支持。",
    items: [
      {
        title: "“模力营” AI 社区",
        description:
          "大湾区首个 AI 主题产业社区，聚集具身智能、大模型与机器人方向创业团队，提供算力、场景与资本对接。",
      },
      {
        title: "广东省具身智能机器人创新中心",
        description:
          "省级创新平台，围绕具身智能核心技术攻关，推动人形机器人整机与关键部件研发及产业化。",
      },
      {
        title: "西丽湖国际科教城",
        description:
          "汇聚清华、北大、哈工大等高校研究院，形成从基础研究到应用开发的完整创新链条。",
      },
    ],
  },
  research: {
    title: "前沿技术方向",
    description:
      "深圳机器人谷的创新力量集中在以下关键领域，持续推动机器人技术的代际跃迁。",
    items: [
      { label: "具身智能", value: "多模态感知、自主决策、灵巧操作" },
      { label: "人形机器人", value: "双足行走、全身控制、人机交互" },
      { label: "AI 大模型", value: "机器人基础模型、任务规划、场景理解" },
      { label: "核心零部件", value: "高性能伺服、精密减速器、力传感器" },
      { label: "协作机器人", value: "安全交互、柔性制造、易编程部署" },
      { label: "群体智能", value: "多机协同、分布式控制、集群调度" },
    ],
  },
};

en.InnovationPage = {
  eyebrow: "Innovation Ecosystem",
  title: "Continuous Surge of Innovation",
  description:
    "AI communities, provincial innovation centers, and university-industry collaboration continue to drive technological breakthroughs within the corridor.",
  detailTitle: "Continuous Technology Breakthroughs",
  detailText:
    "Ecological platforms such as Model Camp, the Greater Bay Area's first AI community, and the Guangdong Embodied AI Robotics Innovation Center are rooted here.",
  stats: {
    platforms: "Innovation Platforms",
    platformsValue: "12+",
    aiCommunity: "AI Enterprises",
    aiCommunityValue: "50+",
    university: "Partner Universities",
    universityValue: "20+",
    annualEvents: "Annual Innovation Events",
    annualEventsValue: "100+",
  },
  platforms: {
    title: "Key Innovation Platforms",
    description:
      "Multiple national and provincial innovation platforms are rooted in Shenzhen Robot Valley, providing enterprises with technology R&D, testing, validation, and commercialization support.",
    items: [
      {
        title: "Model Camp AI Community",
        description:
          "The Greater Bay Area's first AI-themed industry community, gathering startups in embodied intelligence, foundation models, and robotics with access to computing power, scenarios, and capital.",
      },
      {
        title: "Guangdong Embodied AI Robotics Innovation Center",
        description:
          "A provincial innovation platform focused on core embodied intelligence technologies, driving the R&D and industrialization of humanoid robot systems and key components.",
      },
      {
        title: "Xili Lake International Science and Education City",
        description:
          "Home to research institutes from Tsinghua, Peking University, HIT and more, forming a complete innovation chain from fundamental research to applied development.",
      },
    ],
  },
  research: {
    title: "Frontier Technology Directions",
    description:
      "The innovation strength of Shenzhen Robot Valley is concentrated in these key areas, continuously driving generational advances in robotics technology.",
    items: [
      { label: "Embodied Intelligence", value: "Multimodal perception, autonomous decision-making, dexterous manipulation" },
      { label: "Humanoid Robots", value: "Bipedal locomotion, whole-body control, human-robot interaction" },
      { label: "AI Foundation Models", value: "Robot foundation models, task planning, scene understanding" },
      { label: "Core Components", value: "High-performance servos, precision reducers, force sensors" },
      { label: "Collaborative Robots", value: "Safe interaction, flexible manufacturing, easy deployment" },
      { label: "Swarm Intelligence", value: "Multi-robot coordination, distributed control, fleet scheduling" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  CollaborationPage (expanded)                                      */
/* ------------------------------------------------------------------ */
zh.CollaborationPage = {
  eyebrow: "协同合作",
  title: "产学研用金协同",
  description:
    "高校、路演平台与大规模融资计划共同构建高效协同体系，服务展示、交流与项目对接。",
  detailTitle: "协同创新体系",
  detailText:
    "西丽湖国际科教城高校院所、X-DAY 西丽湖路演社和千亿融资计划共同构建高效协同体系，服务展示、交流与项目对接。",
  stats: {
    universities: "高校院所",
    universitiesValue: "20+",
    roadshows: "年度路演",
    roadshowsValue: "50+",
    financing: "融资规模",
    financingValue: "千亿级",
    projects: "对接项目",
    projectsValue: "300+",
  },
  models: {
    title: "五大协同模式",
    description:
      "深圳机器人谷通过多层次协同机制，打通从技术研发到市场落地的全链条。",
    items: [
      {
        title: "产学研协同",
        description:
          "高校院所与企业联合攻关，围绕产业需求开展定向研发，加速技术从实验室走向产线。",
      },
      {
        title: "投融资对接",
        description:
          "X-DAY 西丽湖路演社定期举办项目路演，链接天使投资、VC 与产业资本，千亿级融资计划持续赋能。",
      },
      {
        title: "展示交流",
        description:
          "机器人谷展厅与产业峰会为企业提供产品展示与行业交流平台，促进上下游合作。",
      },
      {
        title: "项目孵化",
        description:
          "为初创团队提供办公空间、技术支持与产业资源对接，降低创业门槛，加速产品落地。",
      },
      {
        title: "国际合作",
        description:
          "链接全球机器人产业资源，推动跨境技术引进、市场拓展与标准互认。",
      },
    ],
  },
  partners: {
    title: "合作伙伴生态",
    description:
      "深圳机器人谷与以下类型机构建立深度合作关系，共同推动机器人产业发展。",
    items: [
      { label: "政府园区", value: "产业政策支持、空间承载、项目引进" },
      { label: "高校院所", value: "技术攻关、人才培养、联合实验室" },
      { label: "投资机构", value: "天使、VC、PE、产业基金全阶段覆盖" },
      { label: "龙头企业", value: "场景开放、供应链协同、联合创新" },
      { label: "行业协会", value: "标准制定、行业交流、政策建言" },
      { label: "服务机构", value: "知识产权、检测认证、法律咨询" },
    ],
  },
};

en.CollaborationPage = {
  eyebrow: "Synergistic Collaboration",
  title: "Industry-Academia-Research-Finance Synergy",
  description:
    "Universities, roadshow platforms, and large-scale financing plans jointly build an efficient collaboration system for showcase, exchange, and project matchmaking.",
  detailTitle: "Collaborative Innovation System",
  detailText:
    "The Xili Lake International Science and Education City, X-DAY Xili Lake Roadshow Club, and the 100-billion-yuan financing plan jointly build a highly effective collaboration system.",
  stats: {
    universities: "Universities & Institutes",
    universitiesValue: "20+",
    roadshows: "Annual Roadshows",
    roadshowsValue: "50+",
    financing: "Financing Scale",
    financingValue: "100B+",
    projects: "Matched Projects",
    projectsValue: "300+",
  },
  models: {
    title: "Five Collaboration Models",
    description:
      "Shenzhen Robot Valley connects the full chain from technology R&D to market deployment through multi-tier collaboration mechanisms.",
    items: [
      {
        title: "Industry-Academia-Research",
        description:
          "Universities and enterprises jointly tackle challenges, conducting targeted R&D aligned with industry needs and accelerating technology transfer from lab to production line.",
      },
      {
        title: "Investment & Financing",
        description:
          "X-DAY Xili Lake Roadshow Club hosts regular pitch events connecting angel investors, VCs, and industrial capital, with a 100-billion-yuan financing plan providing sustained support.",
      },
      {
        title: "Showcase & Exchange",
        description:
          "The Robot Valley showroom and industry summits provide product display and networking platforms, fostering upstream-downstream collaboration.",
      },
      {
        title: "Project Incubation",
        description:
          "Providing startups with office space, technical support, and industry resource connections, lowering barriers to entry and accelerating product commercialization.",
      },
      {
        title: "International Cooperation",
        description:
          "Connecting global robotics industry resources to drive cross-border technology transfer, market expansion, and mutual recognition of standards.",
      },
    ],
  },
  partners: {
    title: "Partner Ecosystem",
    description:
      "Shenzhen Robot Valley has established deep partnerships with the following types of organizations to jointly advance the robotics industry.",
    items: [
      { label: "Government & Parks", value: "Policy support, space capacity, project attraction" },
      { label: "Universities & Institutes", value: "Technology R&D, talent cultivation, joint labs" },
      { label: "Investment Institutions", value: "Full-stage coverage: angel, VC, PE, industry funds" },
      { label: "Leading Enterprises", value: "Scenario sharing, supply chain synergy, joint innovation" },
      { label: "Industry Associations", value: "Standard setting, industry networking, policy advocacy" },
      { label: "Service Providers", value: "IP protection, testing & certification, legal advisory" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Footer                                                            */
/* ------------------------------------------------------------------ */
zh.Footer = {
  brand: "深圳机器人谷",
  colExplore: "探索",
  colVisit: "参观",
  colRobotValley: "机器人谷",
  colInfo: "信息",
  home: "首页",
  robotValley: "机器人谷",
  showroom: "展厅介绍",
  applyToVisit: "申请参观",
  partners: "合作接待",
  visitPlan: "参观流程",
  mediaInquiry: "媒体咨询",
  contact: "联系我们",
  about: "关于我们",
  terms: "使用条款",
  privacy: "隐私政策",
  partnersTitle: "合作伙伴",
  followUs: "关注我们",
};

en.Footer = {
  brand: "Shenzhen Robot Valley",
  colExplore: "Explore",
  colVisit: "Visit",
  colRobotValley: "Robot Valley",
  colInfo: "Info",
  home: "Home",
  robotValley: "Robot Valley",
  showroom: "Showroom",
  applyToVisit: "Apply to Visit",
  partners: "Partners",
  visitPlan: "Visit Process",
  mediaInquiry: "Media Inquiry",
  contact: "Contact Us",
  about: "About Us",
  terms: "Terms of Use",
  privacy: "Privacy Policy",
  partnersTitle: "Partners",
  followUs: "Follow Us",
};

/* ------------------------------------------------------------------ */
/*  ApplySuccessPage                                                  */
/* ------------------------------------------------------------------ */
zh.ApplySuccessPage = {
  eyebrow: "申请已提交",
  title: "您的参观申请已成功提交",
  description:
    "工作人员将在 2 个工作日内审核您的申请并与您联系。如需加急处理或有其他问题，请通过电话或邮件联系我们。",
  home: "返回首页",
  showroom: "返回展厅介绍",
};

en.ApplySuccessPage = {
  eyebrow: "Application Submitted",
  title: "Your visit application has been submitted",
  description:
    "Our staff will review your application and contact you within 2 working days. For urgent requests or questions, please reach out by phone or email.",
  home: "Back to Home",
  showroom: "Back to Showroom",
};

/* ------------------------------------------------------------------ */
/*  ApplicationForm: add datePicker if missing                         */
/* ------------------------------------------------------------------ */
if (!zh.ApplicationForm.datePicker) {
  zh.ApplicationForm.datePicker = {
    loading: "加载可选日期...",
    loadError: "加载失败，请重试",
    previousMonth: "上个月",
    nextMonth: "下个月",
    selectedDate: "已选日期",
    fullyBooked: "已约满",
    pastDate: "已过期",
    noDateSelected: "请选择参观日期",
    weekdays: {
      sun: "日",
      mon: "一",
      tue: "二",
      wed: "三",
      thu: "四",
      fri: "五",
      sat: "六",
    },
  };
}

if (!en.ApplicationForm.datePicker) {
  en.ApplicationForm.datePicker = {
    loading: "Loading available dates...",
    loadError: "Failed to load, please retry",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    selectedDate: "Selected date",
    fullyBooked: "Fully booked",
    pastDate: "Past date",
    noDateSelected: "Please select a visit date",
    weekdays: {
      sun: "Sun",
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Write back                                                        */
/* ------------------------------------------------------------------ */
fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2) + "\n", "utf8");
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + "\n", "utf8");

console.log("Done. All namespaces rebuilt.");
