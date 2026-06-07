import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Hero from './Hero';
import VideoSection from './VideoSection';
import FeaturesGrid from './FeaturesGrid';
import CardsCarousel from './CardsCarousel';

interface Props {
  /** Enter the quiz app (the landing's Log in / Sign up). */
  onEnter: () => void;
}

/**
 * FlowMate landing page — the public front door. The quiz app lives behind the
 * navbar's Log in / Sign up. This page is never replaced by the app; it stays.
 */
export default function Landing({ onEnter }: Props) {
  return (
    <div className="min-h-screen bg-[#fefffc] text-[#2c2c2c]">
      <Sidebar />
      <Navbar onEnter={onEnter} />
      <div className="lg:ml-[240px]">
        <Hero />
        <VideoSection />
        <FeaturesGrid />
        <CardsCarousel />
        <footer className="border-t border-[#e8e8e8] px-5 py-10 text-[13px] text-[#b4b8b4] lg:px-10">
          FlowMate — transform your workflow using plain English.
        </footer>
      </div>
    </div>
  );
}
