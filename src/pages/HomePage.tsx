import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { SearchSection } from '../components/home/SearchSection';
import { FeaturedDoctors } from '../components/home/FeaturedDoctors';
import { SymptomsGrid } from '../components/home/SymptomsGrid';
import { WhyChooseUs } from '../components/home/WhyChooseUs';
import { RecoveryTimeline } from '../components/home/RecoveryTimeline';
import { PatientStories } from '../components/home/PatientStories';
import { CareerSection } from '../components/home/CareerSection';
import { ChatbotButton } from '../components/chatbot/ChatbotButton';

export const HomePage: React.FC = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <SearchSection />
      <SymptomsGrid />
      <RecoveryTimeline />
      <FeaturedDoctors />
      <PatientStories />
      <WhyChooseUs />
      <CareerSection />
      <ChatbotButton />
    </main>
  );
};
