import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { SearchSection } from '../components/home/SearchSection';
import { HeroShowcase } from '../components/home/HeroShowcase';
import { StatStrip } from '../components/home/StatStrip';
import { SymptomsGrid } from '../components/home/SymptomsGrid';
import { CategoriesGrid } from '../components/home/CategoriesGrid';
import { FeaturedDoctors } from '../components/home/FeaturedDoctors';
import { WhyChooseUs } from '../components/home/WhyChooseUs';
import { RecoveryTimeline } from '../components/home/RecoveryTimeline';
import { PatientStories } from '../components/home/PatientStories';
import { AppDownload } from '../components/home/AppDownload';
import { CareerSection } from '../components/home/CareerSection';
import { ChatbotButton } from '../components/chatbot/ChatbotButton';

export const HomePage: React.FC = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <SearchSection />
      <HeroShowcase />
      <StatStrip />
      <SymptomsGrid />
      <CategoriesGrid />
      <FeaturedDoctors />
      <WhyChooseUs />
      <RecoveryTimeline />
      <PatientStories />
      <CareerSection />
      <AppDownload />
      <ChatbotButton />
    </main>
  );
};
