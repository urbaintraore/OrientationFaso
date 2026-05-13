import { Institution } from '../types';

export const mockInstitutions: Institution[] = [
  {
    id: "inst-001",
    name: "Institut Supérieur de Génie Électrique (ISGE-BF)",
    type: "École d’Ingénieurs",
    logo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
      "https://images.unsplash.com/photo-1517048676732-dd2400e9ea0d?w=800&q=80",
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80"
    ],
    description: "L'ISGE-BF est une école d'ingénieurs de référence en Afrique de l'Ouest, spécialisée dans le génie électrique, les réseaux informatiques et les télécommunications. Reconnue par le CAMES, elle forme l'élite technique de demain.",
    city: "Ouagadougou",
    country: "Burkina Faso",
    address: "ZAD, Secteur 24",
    website: "https://www.isge-bf.org",
    establishedYear: 2003,
    studentCount: 1200,
    overallRating: 4.8,
    employabilityRate: 92,
    reputationScore: 95,
    tier: "Sponsored",
    specialOffer: "Bourse d'excellence -50% pour les filles en STEM",
    isVerified: true,
    accreditations: ["CAMES", "Ordre des Ingénieurs du Burkina"],
    scholarshipsAvailable: true,
    contactEmail: "contact@isge-bf.org",
    contactPhone: "+226 25 37 14 00",
    programsCount: 8,
    socialLinks: {
      facebook: "https://facebook.com/isgebf",
      linkedin: "https://linkedin.com/school/isge-bf"
    },
    programs: [
      {
        id: "prog-1",
        name: "Ingénierie Informatique et Réseaux",
        field: "Informatique",
        level: "Cycle Ingénieur (Bac+5)",
        duration: "3 ans (après classe prépa/DUT)",
        tuitionFee: 1200000,
        description: "Forme des ingénieurs de conception capables d'architecturer, déployer et sécuriser des SI complexes.",
        skills: ["Administration Systèmes", "Cybersécurité", "Cloud Computing", "DevOps", "Développement logiciel"],
        careers: ["Architecte Cloud", "Ingénieur Cybersécurité", "Chef de Projet Informatique", "Ingénieur Réseaux"],
        admissionCriteria: "Sur concours après Math Sup/Math Spé, DUT, BTS ou Licence Scientifique. Étude de dossier.",
        averageSalary: "400,000 - 800,000 FCFA / mois",
        employmentRate: 98
      },
      {
        id: "prog-2",
        name: "Génie Électrique et Énergétique",
        field: "Électricité",
        level: "Licence Professionnelle (Bac+3)",
        duration: "3 ans",
        tuitionFee: 850000,
        description: "Spécialisation en énergie solaire, systèmes électriques et automatismes industriels.",
        skills: ["Énergies Renouvelables", "Électrotechnique", "Automatismes", "Cadrage de projets"],
        careers: ["Technicien Supérieur Spécialisé", "Responsable d'Exploitation", "Automaticien"],
        admissionCriteria: "Baccalauréat séries C, D, E, F1, F2, F3.",
        averageSalary: "250,000 - 450,000 FCFA / mois",
        employmentRate: 85
      }
    ],
    reviews: [
      {
        id: "rev-1",
        author: "Kaboré Aristide",
        role: "Alumni 2023",
        rating: 5,
        comment: "Excellente école. Les laboratoires sont bien équipés et les professeurs sont très compétents. J'ai été embauché avant même ma soutenance.",
        date: "2024-02-15"
      },
      {
        id: "rev-2",
        author: "Sanou Awa",
        role: "Étudiante en 2ème année",
        rating: 4,
        comment: "Formation rigoureuse. Le rythme est intense mais c'est le prix à payer pour l'excellence. Très bonne ambiance étudiante.",
        date: "2024-03-01"
      }
    ]
  },
  {
    id: "inst-002",
    name: "Université Aube Nouvelle (U-AUBEN)",
    type: "Université Privée",
    logo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
      "https://images.unsplash.com/photo-1541829070764-84a5d30cb273?w=800&q=80"
    ],
    description: "Première université privée du Burkina Faso, l'Aube Nouvelle offre des formations diversifiées allant des sciences de gestion aux sciences technologiques, avec de forts partenariats internationaux.",
    city: "Ouagadougou",
    country: "Burkina Faso",
    address: "Quartier 1200 Logements",
    website: "https://www.u-auben.com",
    establishedYear: 1992,
    studentCount: 5000,
    overallRating: 4.5,
    employabilityRate: 80,
    reputationScore: 88,
    tier: "Premium",
    isVerified: true,
    specialOffer: "Inscription anticipée : -10% avant le 30 juillet",
    accreditations: ["CAMES"],
    scholarshipsAvailable: true,
    contactEmail: "infos@u-auben.com",
    contactPhone: "+226 25 36 12 12",
    programsCount: 42,
    socialLinks: {
      facebook: "https://facebook.com/uauben"
    },
    programs: [
      {
        id: "prog-3",
        name: "Finance et Comptabilité",
        field: "Finance",
        level: "Master",
        duration: "2 ans (après Licence)",
        tuitionFee: 650000,
        description: "Formation de haut niveau pour les futurs cadres financiers, auditeurs et experts-comptables.",
        skills: ["Analyse Financière", "Audit", "Contrôle de Gestion", "Droit des Sociétés"],
        careers: ["Auditeur Financier", "Directeur Financier", "Contrôleur de Gestion"],
        admissionCriteria: "Licence en Sciences de Gestion ou équivalent. Entretien de motivation.",
        averageSalary: "350,000 - 700,000 FCFA / mois",
        employmentRate: 82
      }
    ],
    reviews: [
      {
        id: "rev-3",
        author: "Ouédraogo Salif",
        role: "Étudiant Master 1",
        rating: 5,
        comment: "L'Aube Nouvelle m'a permis de décrocher un stage au sein d'une grande banque de la place.",
        date: "2024-01-20"
      }
    ]
  },
  {
    id: "inst-003",
    name: "Université Joseph Ki-Zerbo (UJKZ)",
    type: "Université Publique",
    logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1541829070764-84a5d30cb273?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1576495199011-eb94736d05d6?w=800&q=80"
    ],
    description: "Pilier historique de l'enseignement supérieur public au Burkina Faso. Pluridisciplinaire, elle forme dans la quasi-totalité des domaines du savoir et abrite de grands laboratoires de recherche.",
    city: "Ouagadougou",
    country: "Burkina Faso",
    address: "Boulevard Charles de Gaulle",
    website: "https://www.ujkz.bf",
    establishedYear: 1974,
    studentCount: 45000,
    overallRating: 4.1,
    employabilityRate: 70,
    reputationScore: 92,
    tier: "Free",
    isVerified: true,
    accreditations: ["CAMES", "Ministère de l'Enseignement Supérieur"],
    scholarshipsAvailable: true,
    contactEmail: "scolarite@ujkz.bf",
    contactPhone: "+226 25 30 70 64",
    programsCount: 156,
    socialLinks: {
      facebook: "https://facebook.com/ujkz"
    },
    programs: [
      {
        id: "prog-4",
        name: "Licence en Sciences Biomédicales",
        field: "Santé",
        level: "Licence",
        duration: "3 ans",
        tuitionFee: 15000, // Frais zone UEMOA
        description: "Formation de base pour les laboratoires de biologie médicale et la recherche en santé.",
        skills: ["Biologie Cellulaire", "Microbiologie", "Hématologie", "Analyses médicales"],
        careers: ["Technicien Supérieur de Labo", "Assistant de Recherche"],
        admissionCriteria: "Baccalauréat séries D ou C. Processus de sélection national (Campusfaso).",
        averageSalary: "150,000 - 300,000 FCFA / mois",
        employmentRate: 75
      }
    ],
    reviews: [
      {
        id: "rev-4",
        author: "Tiendrebéogo Mariam",
        role: "Ancienne étudiante",
        rating: 4,
        comment: "Excellent niveau théorique, les profs sont les meilleurs du pays. Le seul hic est le grand nombre d'étudiants par amphi.",
        date: "2023-11-10"
      }
    ]
  },
  {
    id: "inst-004",
    name: "Burkina Institute of Technology (BIT)",
    type: "Institut Privé",
    logo: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1517048676732-dd2400e9ea0d?w=800&q=80"
    ],
    description: "Campus bilingue ultra-moderne situé à Koudougou, concentré on l'informatique, l'entrepreneuriat et l'anglais. Le campus est une merveille écologique (construit en latérite) et incubateur de startups.",
    city: "Koudougou",
    country: "Burkina Faso",
    address: "Secteur 10",
    website: "https://www.bit.bf",
    establishedYear: 2017,
    studentCount: 400,
    overallRating: 4.9,
    employabilityRate: 95,
    reputationScore: 90,
    tier: "Premium",
    isVerified: true,
    accreditations: ["Ministère de l'Enseignement Supérieur"],
    scholarshipsAvailable: true,
    contactEmail: "info@bit.bf",
    contactPhone: "+226 25 44 00 00",
    programsCount: 3,
    socialLinks: {
      facebook: "https://facebook.com/bitburkina"
    },
    programs: [
      {
        id: "prog-5",
        name: "Computer Science (BSc)",
        field: "Informatique",
        level: "Licence Informatique",
        duration: "3 ans",
        tuitionFee: 500000,
        description: "Formation 100% en anglais sur le développement logiciel, IA et Data Science.",
        skills: ["Programmation (Python, Java)", "Intelligence Artificielle", "Anglais Bilingue", "Entrepreneuriat"],
        careers: ["Software Engineer", "Data Analyst", "Entrepreneur Tech"],
        admissionCriteria: "Examen d'entrée (Logique, Mathématiques, Anglais).",
        averageSalary: "300,000 - 1,000,000+ FCFA / mois",
        employmentRate: 96
      }
    ],
    reviews: [
      {
        id: "rev-5",
        author: "Bationo Romaric",
        role: "Alumni 2022",
        rating: 5,
        comment: "Le BIT a changé ma vie. Je travaille aujourd'hui pour une entreprise américaine en remote depuis Ouagadougou. L'anglais fait la différence.",
        date: "2024-04-12"
      }
    ]
  },
  {
    id: "inst-intl-001",
    name: "University of Oxford",
    type: "Université Publique",
    logo: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1590764158434-2975973e6a71?w=1200&q=80",
    gallery: ["https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=800&q=80"],
    description: "La plus ancienne université du monde anglophone, Oxford est synonyme d'excellence académique mondiale et de recherche de pointe.",
    city: "Oxford",
    country: "Royaume-Uni",
    address: "Oxford OX1 2JD",
    website: "https://www.ox.ac.uk",
    establishedYear: 1096,
    studentCount: 25000,
    overallRating: 5.0,
    employabilityRate: 98,
    reputationScore: 100,
    tier: "Premium",
    isVerified: true,
    accreditations: ["Royal Charter"],
    scholarshipsAvailable: true,
    contactEmail: "admissions@ox.ac.uk",
    contactPhone: "+44 1865 270000",
    socialLinks: { facebook: "https://facebook.com/the.university.of.oxford" },
    programs: [
      {
        id: "prog-ox-1",
        name: "Computer Science (BA/MCompSci)",
        field: "Informatique",
        level: "Undergraduate",
        duration: "3-4 ans",
        tuitionFee: 26000000, // Approx in FCFA
        description: "Un programme rigoureux couvrant les fondements mathématiques et les applications pratiques de l'informatique.",
        skills: ["Algorithms", "Machine Learning", "Software Engineering"],
        careers: ["Research Scientist", "Data Architect", "Tech Executive"],
        admissionCriteria: "A*A*A at A-level, including Mathematics.",
        averageSalary: "4,000,000 - 8,000,000 FCFA / mois",
        employmentRate: 99
      }
    ],
    reviews: []
  },
  {
    id: "inst-intl-002",
    name: "Massachusetts Institute of Technology (MIT)",
    type: "Institut Privé",
    logo: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
    gallery: [],
    description: "Le MIT est un leader mondial dans l'éducation et la recherche en sciences, technologie, ingénierie et mathématiques.",
    city: "Cambridge",
    country: "États-Unis",
    address: "77 Massachusetts Ave",
    website: "https://www.mit.edu",
    establishedYear: 1861,
    studentCount: 11000,
    overallRating: 5.0,
    employabilityRate: 97,
    reputationScore: 100,
    tier: "Premium",
    isVerified: true,
    accreditations: ["NECHE"],
    scholarshipsAvailable: true,
    contactEmail: "admissions@mit.edu",
    contactPhone: "+1 617-253-1000",
    socialLinks: { facebook: "https://facebook.com/MIT" },
    programs: [
      {
        id: "prog-mit-1",
        name: "Electrical Engineering & Computer Science",
        field: "Technologie",
        level: "Undergraduate/Master",
        duration: "4 ans",
        tuitionFee: 35000000,
        description: "L'un des programmes les plus sélectifs et innovants au monde.",
        skills: ["Artificial Intelligence", "Quantum Computing", "Circuit Design"],
        careers: ["Innovation Lead", "Systems Architect", "Startup Founder"],
        admissionCriteria: "SAT/ACT Scores, High GPA, Strong recommendation letters.",
        averageSalary: "5,000,000 - 10,000,000 FCFA / mois",
        employmentRate: 97
      }
    ],
    reviews: []
  },
  {
    id: "inst-intl-003",
    name: "Université de Toronto",
    type: "Université Publique",
    logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1541829070764-84a5d30cb273?w=1200&q=80",
    gallery: [],
    description: "Chef de file mondial en recherche et en enseignement, l'Université de Toronto offre un environnement d'apprentissage stimulant au cœur d'une métropole cosmopolite.",
    city: "Toronto",
    country: "Canada",
    address: "27 King's College Cir",
    website: "https://www.utoronto.ca",
    establishedYear: 1827,
    studentCount: 60000,
    overallRating: 4.8,
    employabilityRate: 93,
    reputationScore: 98,
    tier: "Premium",
    isVerified: true,
    accreditations: ["Ontario Universities"],
    scholarshipsAvailable: true,
    contactEmail: "intl.admissions@utoronto.ca",
    contactPhone: "+1 416-978-2011",
    socialLinks: { facebook: "https://facebook.com/universityoftoronto" },
    programs: [
      {
        id: "prog-tor-1",
        name: "Génie Civil",
        field: "Génie Civil",
        level: "Baccalauréat (License)",
        duration: "4 ans",
        tuitionFee: 25000000,
        description: "Excellence en infrastructures durables et planification urbaine.",
        skills: ["Structural Design", "Environmental Engineering", "Project Management"],
        careers: ["Civil Engineer", "Urban Planner", "Sustainability Consultant"],
        admissionCriteria: "Grade 12 Marks, English Proficiency (IELTS/TOEFL).",
        averageSalary: "3,000,000 - 5,000,000 FCFA / mois",
        employmentRate: 92
      }
    ],
    reviews: []
  },
  {
    id: "inst-intl-004",
    name: "University of Cape Town (UCT)",
    type: "Université Publique",
    logo: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1590764158434-2975973e6a71?w=1200&q=80",
    gallery: [],
    description: "L'université la mieux classée d'Afrique, offrant une excellence académique avec une vue imprenable sur la Montagne de la Table.",
    city: "Cape Town",
    country: "Afrique du Sud",
    address: "Rondebosch, Cape Town, 7701",
    website: "https://www.uct.ac.za",
    establishedYear: 1829,
    studentCount: 28000,
    overallRating: 4.7,
    employabilityRate: 88,
    reputationScore: 94,
    tier: "Premium",
    isVerified: true,
    accreditations: ["DHET"],
    scholarshipsAvailable: true,
    contactEmail: "admissions@uct.ac.za",
    contactPhone: "+27 21 650 9111",
    socialLinks: { facebook: "https://facebook.com/university.of.cape.town" },
    programs: [
      {
        id: "prog-uct-1",
        name: "Commerce & Management",
        field: "Management",
        level: "Undergraduate",
        duration: "3 ans",
        tuitionFee: 2500000,
        description: "Formation leader pour les futurs gestionnaires en Afrique.",
        skills: ["Economics", "Accounting", "Strategic Management"],
        careers: ["Investment Banker", "Policy Analyst", "Financial Manager"],
        admissionCriteria: "NSC results or international equivalent.",
        averageSalary: "1,500,000 - 3,500,000 FCFA / mois",
        employmentRate: 90
      }
    ],
    reviews: []
  },
  {
    id: "inst-intl-005",
    name: "University of Tokyo",
    type: "Université Publique",
    logo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1541829070764-84a5d30cb273?w=1200&q=80",
    gallery: [],
    description: "Le sommet de l'enseignement supérieur au Japon, célèbre pour ses contributions scientifiques et son influence culturelle.",
    city: "Tokyo",
    country: "Japon",
    address: "7 Chome-3-1 Hongo, Bunkyo City",
    website: "https://www.u-tokyo.ac.jp",
    establishedYear: 1877,
    studentCount: 28000,
    overallRating: 4.9,
    employabilityRate: 95,
    reputationScore: 98,
    tier: "Premium",
    isVerified: true,
    accreditations: ["MEXT"],
    scholarshipsAvailable: true,
    contactEmail: "admission@u-tokyo.ac.jp",
    contactPhone: "+81 3-3812-2111",
    socialLinks: { facebook: "https://facebook.com/UTokyo.News.en" },
    programs: [
      {
        id: "prog-ut-1",
        name: "Robotics and Information Technology",
        field: "Robotique",
        level: "Master/PhD",
        duration: "2-3 ans",
        tuitionFee: 10000000,
        description: "Recherche de pointe en robotique humanoïde et systèmes intelligents.",
        skills: ["Robotics", "Control Theory", "AI"],
        careers: ["R&D Engineer", "Academic Researcher", "System Designer"],
        admissionCriteria: "Bachelor's degree, entrance exam, research proposal.",
        averageSalary: "3,000,000 - 6,000,000 FCFA / mois",
        employmentRate: 96
      }
    ],
    reviews: []
  }
];
