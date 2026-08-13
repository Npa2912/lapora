import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroBanner from "../components/home/HeroBanner";
import BenefitsBar from "../components/home/BenefitsBar";
import CategoryGrid from "../components/home/CategoryGrid";
import ProductTabs from "../components/home/ProductTabs";
import HomeBottom from "../components/home/HomeBottom";
import VoiceAssistantButton from "../components/voice/VoiceAssistantButton";

export default function HomePage() {
  return (
    <>
      <div
        className="h-[640px] overflow-hidden bg-no-repeat"
        style={{
          backgroundImage: "url('/images/home-hero-bg.png')",
          backgroundPosition: "center top",
          backgroundSize: "100% 100%",
        }}
      >
        <Header />
        <HeroBanner />
      </div>

      <main>
        <BenefitsBar />
        <CategoryGrid />
        <ProductTabs />
        <HomeBottom />
        <Footer />
      </main>

      <VoiceAssistantButton />


    </>
  );
}