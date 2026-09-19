import React from 'react';
import { usePageMeta } from '../lib/usePageMeta';
import { HeroSection } from '../components/home/HeroSection';
import { SearchSection } from '../components/home/SearchSection';
import { StatStrip } from '../components/home/StatStrip';
import { FeaturedDoctors } from '../components/home/FeaturedDoctors';
import { SymptomsGrid } from '../components/home/SymptomsGrid';
import { CategoriesGrid } from '../components/home/CategoriesGrid';
import { WhyChooseUs } from '../components/home/WhyChooseUs';
import { RecoveryTimeline } from '../components/home/RecoveryTimeline';
import { PatientStories } from '../components/home/PatientStories';
import { CareerSection } from '../components/home/CareerSection';
import { CaretakerSection } from '../components/home/CaretakerSection';
import { ChatbotButton } from '../components/chatbot/ChatbotButton';

export const HomePage: React.FC = () => {
  usePageMeta('PhysioPrime | Premium Home & Online Physiotherapy', 'Book certified physiotherapists for personalized home visits or HD video consultations. Orthopedic, neuro, sports, and post-op rehabilitation.');
  return (
    <main className="min-h-screen">
      <HeroSection />
      <SearchSection />
      <StatStrip />
      <SymptomsGrid />
      <CategoriesGrid />
      <RecoveryTimeline />
      <FeaturedDoctors />
      <PatientStories />
      <WhyChooseUs />
      <CareerSection />
      <CaretakerSection />
      <ChatbotButton />
    </main>
  );
};
