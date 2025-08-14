// Core types for the multi-signal recognition system

export type VisionBundle = {
  labels: { desc: string; score: number }[];
  cropLabels: { desc: string; score: number }[];
  webBestGuess: string[];
  webPageTitles: string[];
  safe: { 
    adult: string; 
    violence: string; 
    racy: string; 
    medical: string 
  };
};

export type Canonical = {
  commonName: string;
  scientificName?: string | undefined;
  kgId?: string | undefined;
  wikipediaTitle?: string | undefined;
  source: "vision" | "web" | "manual";
};

export type ProviderHit = {
  scientificName: string;
  commonName?: string | undefined;
  source: "inat" | "plantid";
  confidence: number;
  meta?: any | undefined;
};

export type Candidate = {
  scientificName: string;
  commonName?: string | undefined;
  kgId?: string | undefined;
  wikipediaTitle?: string | undefined;
  scores: {
    vision?: number | undefined;
    webGuess?: number | undefined;
    kgMatch?: number | undefined;
    provider?: number | undefined;
    cropAgree?: number | undefined;
    habitatTime?: number | undefined;
  };
  totalScore?: number | undefined;
};

export type WikiCard = {
  title: string;
  extract: string;
  thumbnail?: string | undefined;
  url: string;
};

export type RecognitionDecision = {
  mode: "pick" | "disambiguate" | "no_match";
  pick?: Candidate | undefined;
  top3?: Candidate[] | undefined;
  debug?: {
    visionBundle?: VisionBundle | undefined;
    candidates?: Candidate[] | undefined;
    processingTime?: number | undefined;
  } | undefined;
};

export type RecognitionRequest = {
  imageBase64: string;
  lat?: number | undefined;
  lon?: number | undefined;
  hint?: string | undefined;
};

export type RecognitionResponse = {
  success: boolean;
  decision: RecognitionDecision;
  error?: string | undefined;
  debug?: {
    visionBundle?: VisionBundle | undefined;
    candidates?: Candidate[] | undefined;
    processingTime?: number | undefined;
  } | undefined;
};
